import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import preCreateChatMessageHandler from "../hooks/preCreateChatMessageHandler.mjs";

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class ItemArchmage extends Item {

  prepareDerivedData() {
    super.prepareDerivedData();
    if (!this.data.img || this.data.img == CONFIG.DEFAULT_TOKEN) {
      if (CONFIG.ARCHMAGE.defaultTokens[this.data.type]) {
        this.data.img = CONFIG.ARCHMAGE.defaultTokens[this.data.type];
      }
      else {
        this.data.img = CONST.DEFAULT_TOKEN;
      }
    }

    if (this.data.type == 'loot' || this.data.type == 'tool') {
      let model = game.system.model.Item[this.data.type];
      if (!this.data.data.quantity) this.data.data.quantity = model.quantity;
    }
  }

  /**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async roll() {
    // Update uses left
    let uses = this.data.data.quantity?.value;
    let updateData = {};
    if (uses == null) {
      return this._roll();
    } else {
      if (uses == 0 && !event.shiftKey
        && this.data.data.powerUsage.value != 'at-will') {
        let use = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.ConfirmDialog"),
          buttons: {
            use: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Use"),
              callback: () => {use = true;}
            },
            cancel: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
              callback: () => {}
            }
          },
          default: 'cancel',
          close: html => {
            if (use) {
              return this._roll();
            }
          }
        }).render(true);
      } else {
        let rolled = await this._roll();
        let item = null;
        if (rolled) {
          item = this.actor.items.get(this.data._id);
          updateData.data = { quantity: { value: Math.max(uses - 1, 0)} };
        }
        if (!isObjectEmpty(updateData)) item.update(updateData, {});
        return rolled;
      }
    }
  }

  async _roll() {
    // Decrease resources if cost is set
    let cost = this.data.data.cost?.value;
    if (cost && game.settings.get("archmage", "automatePowerCost")) {
      let updateData = {};
      let filter = /^([0-9]*) ([a-zA-Z ]+)|([a-zA-Z ]+)$/;
      let parsed = filter.exec(cost);
      if (parsed) {
        // Command points
        if (parsed[2] && parsed[2].toLowerCase().includes("command point")
            && this.actor.data.data.resources.perCombat.commandPoints.enabled) {
          let costNum = Number(parsed[1]);
          if (costNum > this.actor.data.data.resources.perCombat.commandPoints.current) {
            ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNotEnoughCP"));
            return false;
          } else {
            let path = 'data.resources.perCombat.commandPoints.current';
            updateData[path] = this.actor.data.data.resources.perCombat.commandPoints.current - costNum;
          }
        }
        // Ki
        else if (parsed[2] && parsed[2].toLowerCase().includes("ki")
            && this.actor.data.data.resources.spendable.ki.enabled) {
          let costNum = Number(parsed[1]);
          if (costNum > this.actor.data.data.resources.spendable.ki.current) {
            ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNotEnoughKi"));
            return false;
          } else {
            let path = 'data.resources.spendable.ki.current';
            updateData[path] = this.actor.data.data.resources.perCombat.commandPoints.current - costNum;
          }
        }
        // Momentum
        else if (parsed[3] && parsed[3].toLowerCase() == "spend momentum"
            && this.actor.data.data.resources.perCombat.momentum.enabled) {
          if (!this.actor.data.data.resources.perCombat.momentum.current) {
            ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNoMomentum"));
            return false;
          } else {
            let path = 'data.resources.perCombat.momentum.current';
            updateData[path] = false;
          }
        }
        else if (parsed[3] && parsed[3].toLowerCase() == "have momentum"
            && this.actor.data.data.resources.perCombat.momentum.enabled) {
          if (!this.actor.data.data.resources.perCombat.momentum.current) {
            ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNoMomentum"));
            return false;
          }
        }
        // Focus
        else if (parsed[3] && parsed[3].toLowerCase() == "focus"
            && this.actor.data.data.resources.perCombat.focus.enabled) {
          if (!this.actor.data.data.resources.perCombat.focus.current) {
            ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNoFocus"));
            return false;
          } else {
            let path = 'data.resources.perCombat.focus.current';
            updateData[path] = false;
          }
        }
        // Custom resources
        for (let idx of ["1", "2", "3"]) {
          let resourcePathName = "custom"+idx;
          let resourceName = this.actor.data.data.resources.spendable[resourcePathName].label;
          if (this.actor.data.data.resources.spendable[resourcePathName].enabled
            && parsed[2] && parsed[1]
            && this.actor.data.data.resources.spendable[resourcePathName].current !== null
            && parsed[2].toLowerCase().includes(resourceName.toLowerCase())) {
            let numUsed = Number(parsed[1]);
            if (numUsed > this.actor.data.data.resources.spendable[resourcePathName].current) {
              ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNoCustomResource")+" "+resourceName);
              return false;
            } else {
              let path = `data.resources.spendable.${resourcePathName}.current`;
              updateData[path] = this.actor.data.data.resources.spendable[resourcePathName].current - numUsed;
            }
          }
        }
      }
      if (!isObjectEmpty(updateData)) this.actor.update(updateData);
    }

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/${this.data.type.toLowerCase()}-card.html`
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token._object.scene.id}.${token.id}` : null,
      item: this.data,
      data: this.getChatData()
    };

    //let rollData = await ArchmageRolls.rollItem(this);

    // Basic chat message data
    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.actor.id,
        token: this.actor.token,
        alias: this.actor.name,
        scene: game.user.viewedScene
      },
      roll: new Roll("") // Needed to silence an error in 0.8.x
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Enrich the message to parse inline rolls.
    chatData.content = TextEditor.enrichHTML(chatData.content, { rolls: true, rollData: this.actor.getRollData() });

    preCreateChatMessageHandler.handle(chatData, null, null);

    // If 3d dice are enabled, handle them first.
    if (game.dice3d) {
      let contentHtml = $(chatData.content);
      let rolls = [];

      if (contentHtml.length > 0) {
        // Find all property rows.
        let $rows = contentHtml.find('.card-prop');
        if ($rows.length > 0) {
          // Iterate over properties.
          $rows.each(function(index) {
            let $row_self = $(this);
            let row_text = $row_self.html();
            // If this is an attack row, we need to get the roll data.
            if (row_text.includes('Attack:') || row_text.includes('Hit:')) {
              let $roll_html = $row_self.find('.inline-result');
              if ($roll_html.length > 0) {
                rolls.push(Roll.fromJSON(unescape($roll_html.data('roll'))));
              }
            }
          });
        }

        // If we have roll data, handle a 3d roll.
        if (rolls.length > 0) {
          for (let r of rolls) {
            await game.dice3d.showForRoll(r, game.user, true);
          }
        }
      }
    }

    return ChatMessage.create(chatData, { displaySheet: false });


  }

  /**
   * Roll an item's recharge, and update its quantity based on the maxQuantity.
   *
   * @param {Object} options      Options to pass during execution.
   * @param {Boolean} options.createMessage  Whether or not to render chat messages.
   * @returns {Promise.<Object>}  A promise resolving to an object with roll results.
   */
  async recharge({createMessage=true}={}) {
    let recharge = this.data.data?.recharge?.value ?? null;
    // If a recharge power does not have a recharge value, assume 16+
    if (this.data.data?.powerUsage?.value == 'recharge'
      && !recharge) recharge = 16;

    // Only update for recharge powers/items.
    if (!recharge) return;
    // And only if recharge is feasible
    // if (recharge <= 0 || recharge > 20) return;

    let actor = this.parent;
    let maxQuantity = this.data.data?.maxQuantity?.value ?? 1;
    let currQuantity = this.data.data?.quantity?.value ?? 0;
    if (maxQuantity - currQuantity <= 0) return;
    let rechAttempts = this.data.data?.rechargeAttempts?.value ?? 0;

    let roll = new Roll('d20');
    roll.roll();

    let rechargeSuccessful = roll.total >= Number(recharge);

    if (createMessage) {
      // Basic template rendering data
      const template = `systems/archmage/templates/chat/recharge-card.html`
      const token = actor.token;

      // Basic chat message data
      const chatData = {
        user: game.user._id,
        type: 5,
        roll: roll,
        speaker: {
          actor: actor._id,
          token: actor.token,
          alias: actor.name,
          scene: game.user.viewedScene
        }
      };

      const templateData = {
        actor: actor,
        title: this.data.name,
        tokenId: token ? `${token.id}` : null,
        success: rechargeSuccessful,
        data: chatData,
      };

      // Toggle default roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
      if (rollMode === "blindroll") chatData["blind"] = true;

      // TODO: Wait for 3d dice.

      // Render the template
      chatData["content"] = await renderTemplate(template, templateData);
      ChatMessage.create(chatData, { displaySheet: false });
    }

    // Update the item.
    if (rechargeSuccessful) {
      await this.update({
        data: { quantity: { value: Number(currQuantity) + 1 } }
      });
    } else {
      // Record recharge attempt
      await this.update({
        data: { rechargeAttempts: { value: Number(rechAttempts) + 1 } }
      });
    }

    return {
      roll: roll,
      total: roll.total,
      target: recharge,
      success: rechargeSuccessful
    };
  }

  /* -------------------------------------------- */
  /*  Chat Card Data
  /* -------------------------------------------- */

  getChatData(htmlOptions) {
    const data = this[`_${this.data.type}ChatData`]();
    data.description.value = data.description.value !== undefined ? TextEditor.enrichHTML(data.description.value, htmlOptions) : '';
    return data;
  }

  _powerChatData() {
    const data = duplicate(this.data.data);
    const tags = [
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.actionType'),
        value: CONFIG.ARCHMAGE.actionTypes[data.actionType.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerUsage'),
        value: CONFIG.ARCHMAGE.powerUsages[data.powerUsage.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerSource'),
        value: CONFIG.ARCHMAGE.powerSources[data.powerSource.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerType'),
        value: CONFIG.ARCHMAGE.powerTypes[data.powerType.value]
      },
      {
        label: data.powerLevel !== undefined ? data.powerLevel.label : 'Level',
        value: game.i18n.localize('ARCHMAGE.level') + ' ' + (data.powerLevel !== undefined ? data.powerLevel.value : this.actor.data.data.details.level.value)
      }
    ];

    const propKeys = [
      'recharge',
      'sustainOn',
      'trigger',
      'target',
      'always',
      'attack',
      'hit',
      'hitEven',
      'hitOdd',
      'crit',
      'miss',
      'missEven',
      'missOdd',
      'cost',
    ];
    const properties = propKeys.map(k => {
      return {
        label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
        value: data[k] ? data[k].value : null,
      };
    })

    const featKeys = [
      'adventurer',
      'champion',
      'epic',
    ];
    const feats = featKeys.map(k => {
      return {
        label: data.feats[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
        description: data.feats[k] ? data.feats[k].description.value : null,
        isActive: data.feats[k] ? data.feats[k].isActive.value : null,
      };
    });

    let effectKeys = [
      'effect',
      'castBroadEffect',
      'castPower',
      'sustainedEffect',
      'finalVerse',
      'spellLevel3',
      'spellLevel5',
      'spellLevel7',
      'spellLevel9',
      'spellChain',
      'breathWeapon',
      'special',
    ];

    // Add spell level entries only if the current spell level is high enough
    [3, 5, 7, 9].forEach(i => {
      if (Number(data.powerLevel.value) < i) {
        effectKeys = effectKeys.filter(x => x != `spellLevel${i}`)
      }
    })

    const effects = effectKeys.map(k => {
      return {
        label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
        value: data[k] ? data[k].value : null,
      };
    });

    data.tags = tags.filter(t => t.value !== null && t.value !== undefined && t.value != '');
    data.properties = properties.filter(p => p.value !== null && p.value !== undefined && p.value != '');
    data.feats = feats.filter(f => f.description !== null && f.description !== undefined && f.description !== '');
    data.effects = effects.filter(e => e.value !== null && e.value !== undefined && e.value != '');
    data.effect = {
      label: game.i18n.localize(`ARCHMAGE.CHAT.effect`),
      value: data.effect.value
    };
    data.special = {
      label: game.i18n.localize(`ARCHMAGE.CHAT.special`),
      value: data.special.value
    };
    return data;
  }

  _equipmentChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  _actionChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  _traitChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  _nastierSpecialChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  static chatListeners(html) {

    // Chat card actions
    html.on('click', '.card-buttons button', ev => {
      ev.preventDefault();

      // Extract card data
      const button = $(ev.currentTarget),
        messageId = button.parents('.message').attr("data-message-id"),
        senderId = game.messages.get(messageId).user._id,
        card = button.parents('.chat-card');

      // Confirm roll permission
      if (!game.user.isGM && (game.user._id !== senderId)) return;

      // Get the Actor from a synthetic Token
      let actor;
      const tokenKey = card.attr("data-token-id");
      if (tokenKey) {
        const [sceneId, tokenId] = tokenKey.split(".");
        let token;
        if (sceneId === canvas.scene._id) token = canvas.tokens.get(tokenId);
        else {
          const scene = game.scenes.get(sceneId);
          if (!scene) return;
          let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
          if (tokenData) token = new Token(tokenData);
        }
        if (!token) return;
        actor = Actor.fromToken(token);
      } else actor = game.actors.get(card.attr('data-actor-id'));

      // Get the Item
      if (!actor) return;
      const itemId = card.attr("data-item-id");
      let itemData = actor.items.find(i => i.id === itemId);
      if (!itemData) return;
      const item = new CONFIG.Item.entityClass(itemData, { actor: actor });

      // Get the Action
      const action = button.attr("data-action");

      // Weapon attack
      if (action === "weaponAttack") item.rollWeaponAttack(ev);
      else if (action === "weaponDamage") item.rollWeaponDamage(ev);
      else if (action === "weaponDamage2") item.rollWeaponDamage(ev, true);

      // Spell actions
      else if (action === "spellAttack") item.rollSpellAttack(ev);
      else if (action === "spellDamage") item.rollSpellDamage(ev);

      // Feat actions
      else if (action === "featAttack") item.rollFeatAttack(ev);
      else if (action === "featDamage") item.rollFeatDamage(ev);

      // Consumable usage
      else if (action === "consume") item.rollConsumable(ev);

      // Tool usage
      else if (action === "toolCheck") item.rollToolCheck(ev);
    });
  }
}