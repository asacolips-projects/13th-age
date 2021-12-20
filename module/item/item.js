import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import { ArchmageUtility } from '../setup/utility-classes.js';
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
    if (uses == null) {
      return this._roll_resource_check({});
    } else {
      let updateData = {"data.quantity.value": Math.max(uses - 1, 0)};
      if (uses == 0 && !event.shiftKey
        && this.data.data.powerUsage.value != 'at-will') {
        let use = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.NoUses"),
          content: game.i18n.localize("ARCHMAGE.CHAT.NoUsesMsg"),
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
              return this._roll_resource_check(updateData);
            }
          }
        }).render(true);
      } else {
        return this._roll_resource_check(updateData);
      }
    }
  }

  async _roll_resource_check(itemUpdateData) {
    // Decrease resources if cost is set
    let cost = this.data.data.cost?.value;
    let updateData = {}
    if (cost && game.settings.get("archmage", "automatePowerCost")) {
      let filter = /^([0-9]*) ([a-zA-Z ]+)|([a-zA-Z ]+)$/;
      let parsed = filter.exec(cost);
      let res = this.actor.data.data.resources;
      if (parsed) {
        // Command points
        if (parsed[2] && parsed[2].toLowerCase().includes("command point")
            && res.perCombat.commandPoints.enabled) {
          let costNum = Number(parsed[1]);
          let path = 'data.resources.perCombat.commandPoints.current';
          updateData[path] = res.perCombat.commandPoints.current - costNum;
          if (costNum > res.perCombat.commandPoints.current) {
            let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughCP");
            updateData[path] = 0;
            return this._roll_resDiag(msg, itemUpdateData, updateData);
          }
        }
        // Ki
        else if (parsed[2] && parsed[2].toLowerCase().includes("ki")
            && this.actor.data.data.resources.spendable.ki.enabled) {
          let costNum = Number(parsed[1]);
          let path = 'data.resources.spendable.ki.current';
          updateData[path] = res.perCombat.commandPoints.current - costNum;
          if (costNum > res.spendable.ki.current) {
            let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughKi");
            updateData[path] = 0;
            return this._roll_resDiag(msg, itemUpdateData, updateData);
          }
        }
        // Momentum
        else if (parsed[3] && res.perCombat.momentum.enabled
          && (parsed[3].toLowerCase() == "spend momentum"
          || parsed[3].toLowerCase() == "have momentum")) {
          if (!res.perCombat.momentum.current) {
            let msg = game.i18n.localize("ARCHMAGE.UI.errNoMomentum");
            return this._roll_resDiag(msg, itemUpdateData, updateData);
          } else {
            if (parsed[3].toLowerCase() == "spend momentum") {
              let path = 'data.resources.perCombat.momentum.current';
              updateData[path] = false;
            }
          }
        }
        // Focus
        else if (parsed[3] && parsed[3].toLowerCase() == "focus"
            && res.perCombat.focus.enabled) {
          if (!res.perCombat.focus.current) {
            let msg = game.i18n.localize("ARCHMAGE.UI.errNoFocus");
            return this._roll_resDiag(msg, itemUpdateData, updateData);
          } else {
            let path = 'data.resources.perCombat.focus.current';
            updateData[path] = false;
          }
        }
        // Custom resources
        for (let idx of ["1", "2", "3"]) {
          let resourcePathName = "custom"+idx;
          let resourceName = res.spendable[resourcePathName].label;
          if (res.spendable[resourcePathName].enabled && parsed[2] && parsed[1]
            && res.spendable[resourcePathName].current !== null
            && resourceName.toLowerCase().includes(parsed[2].toLowerCase())) {
            let numUsed = Number(parsed[1]);
            let path = `data.resources.spendable.${resourcePathName}.current`;
            updateData[path] = res.spendable[resourcePathName].current - numUsed;
            if (numUsed > res.spendable[resourcePathName].current) {
              let msg = game.i18n.localize("ARCHMAGE.UI.errNoCustomResource") + " ";
              msg += resourceName + ". " + game.i18n.localize("ARCHMAGE.UI.errNoCustomResource2");
              updateData[path] = 0;
              return this._roll_resDiag(msg, itemUpdateData, updateData);
            }
          }
        }
      }
    }
    return this._roll_render(itemUpdateData, updateData);
  }

  async _roll_resDiag(message, itemUpdateData, actorUpdateData) {
    let use = false;
    new Dialog({
      title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
      content: message,
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
          return this._roll_render(itemUpdateData, actorUpdateData);
        } else {
          return;
        }
      }
    }).render(true);
  }

  async _roll_render(itemUpdateData, actorUpdateData) {
    // Replicate attack rolls as needed for attacks
    let overrideData = {};
    let numTargets = {targets: 1, rolls: []};
    if (this.data.type == "power" || this.data.type == "action") {
      let attackLine = ArchmageRolls.addAttackMod(this);
      overrideData = {"data.attack.value": attackLine};
      if (game.settings.get("archmage", "multiTargetAttackRolls")){
        numTargets = await ArchmageRolls.rollItemTargets(this);
        overrideData = {"data.attack.value": ArchmageRolls.rollItemAdjustAttacks(this, attackLine, numTargets)};
        if (numTargets.targetLine) overrideData["data.target.value"] = numTargets.targetLine;
      }
    }
    let itemToRender = this.clone(overrideData, {"save": false, "keepId": true});

    // Prepare roll data now
    let rollData = itemToRender.actor.getRollData(this);

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/${this.data.type.toLowerCase()}-card.html`
    const token = itemToRender.actor.token;
    const templateData = {
      actor: itemToRender.actor,
      tokenId: token ? `${token._object.scene.id}.${token.id}` : null,
      item: itemToRender.data,
      data: itemToRender.getChatData({ rollData: rollData }, true)
    };

    // TODO: roll rolls here
    //let rollData = await ArchmageRolls.rollItem(this);

    // Basic chat message data
    const chatData = {
      user: game.user.id,
      speaker: {
        actor: itemToRender.actor.id,
        token: itemToRender.actor.token,
        alias: itemToRender.actor.name,
        scene: game.user.viewedScene
      }
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Enrich the message to parse inline rolls.

    // this line causes deprecation warnings due to missing asyinc= for rolls
    // TODO: remove once rolls are correctly pre-rolled above
    chatData.content = TextEditor.enrichHTML(chatData.content, { rolls: true, rollData: rollData });

    let sequencerFile = this.data.data.sequencer?.file;
    preCreateChatMessageHandler.handle(chatData, {
      targets: numTargets.targets,
      type: this.data.type,
      sequencerFile: sequencerFile
    }, null);

    // If 3d dice are enabled, handle them first.
    if (game.dice3d && !game.settings.get("dice-so-nice", "animateInlineRoll")) {
      let contentHtml = $(chatData.content);
      let rolls = [];
      let damageRolls = [];

      if (contentHtml.length > 0) {
        // Find all property rows.
        let $rows = contentHtml.find('.card-prop');
        if ($rows.length > 0) {
          // Iterate over properties.
          $rows.each(function(index) {
            let $row_self = $(this);
            let row_text = $row_self.html();
            // Attack or Target rows - keep all, in right order
            if (row_text.includes('Attack:') || row_text.includes('Target:')) {
              let $roll_html = $row_self.find('.inline-result');
              if ($roll_html.length > 0) {
                $roll_html.each(function(i, e){
                  let roll = Roll.fromJSON(unescape(e.dataset.roll));
                  if (row_text.includes('Attack:') && roll.terms[0].faces != 20) {
                    // Not an attack roll, usually a target roll, roll first
                    rolls.unshift(roll);
                  } else rolls.push(roll);
                });
              }
            }
            // Hit or Spell level rows - keep only the last
            else if (row_text.includes('Hit:') || row_text.includes('Level Spell:')) {
              damageRolls = []; // Reset for each line
              let $roll_html = $row_self.find('.inline-result');
              if ($roll_html.length > 0) {
                $roll_html.each(function(i, e){
                  let roll = Roll.fromJSON(unescape(e.dataset.roll));
                  damageRolls.push(roll);
                });
              }
            }
          });
        }

        // If we have roll data, handle a 3d roll.
        rolls = rolls.concat(damageRolls);
        if (rolls.length > 0) {
          for (let r of rolls) {
            await game.dice3d.showForRoll(r, game.user, true);
          }
        }
      }
    }

    if (!isObjectEmpty(itemUpdateData)) this.update(itemUpdateData, {});
    if (!isObjectEmpty(actorUpdateData)) this.actor.update(actorUpdateData);

    // Handle Monk AC bonus
    //TODO: remove dependency on times-up once core Foundry handles AE expiry
    if (game.modules.get("times-up")?.active) {
      await this._handleMonkAC();
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
    // Only update for recharge powers/items.
    if (!this.data.data?.powerUsage?.value == 'recharge') return;

    // And only if recharge is feasible
    // if (recharge <= 0 || recharge > 20) return;

    // If a recharge power does not have a recharge value, assume 16+
    let recharge = Number(this.data.data?.recharge?.value) || 16;

    let actor = this.actor;
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
        user: game.user.id,
        type: 5,
        roll: roll,
        speaker: {
          actor: actor.id,
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
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
      if (rollMode === "blindroll") chatData["blind"] = true;

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

  /**
   * Check if we are rolling a monk form, add related AC active effect
   */
  async _handleMonkAC() {
    if (this.data.type != "power") return;
    if (!this.actor.data.data.details.detectedClasses?.includes("monk")) return;

    let effects = this.actor.effects;
    let group = this.data.data.group.value.toLowerCase();
    let bonusMagnitudeMap = {};
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.opening")] = 1;
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.flow")] = 2;
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.finishing")] = 3;
    if (!Object.keys(bonusMagnitudeMap).includes(group)) return;
    let bonusMagnitude = bonusMagnitudeMap[group];

    // Check for other monk AC bonuses
    let effectsToDelete = [];
    let alreadyHasBetterBonus = false;
    effects.forEach(e => {
      if (e.data.label == game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel")) {
        if (Number(e.data.changes[0].value) <= bonusMagnitude) {
          effectsToDelete.push(e.id);
        }
        else alreadyHasBetterBonus = true;
      }
    });
    await this.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);

    if (alreadyHasBetterBonus) return;

    // Now create new AC bonus effect
    let effectData = {
      label: game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel"),
      icon: "icons/svg/shield.svg",
      changes: [{
        key: "data.attributes.ac.value",
        value: bonusMagnitude,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      }]
    }
    effectData = ArchmageUtility.addDuration(effectData, CONFIG.ARCHMAGE.effectDurations.StartOfNextTurn)
    await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  /* -------------------------------------------- */
  /*  Chat Card Data
  /* -------------------------------------------- */

  getChatData(htmlOptions, skipInlineRolls) {
    const data = this[`_${this.data.type}ChatData`]();
    if (!skipInlineRolls) {
      data.description.value = data.description.value !== undefined ? TextEditor.enrichHTML(data.description.value, htmlOptions) : '';
    }
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
        senderId = game.messages.get(messageId).user.id,
        card = button.parents('.chat-card');

      // Confirm roll permission
      if (!game.user.isGM && (game.user.id !== senderId)) return;

      // Get the Actor from a synthetic Token
      let actor;
      const tokenKey = card.attr("data-token-id");
      if (tokenKey) {
        const [sceneId, tokenId] = tokenKey.split(".");
        let token;
        if (sceneId === canvas.scene.id) token = canvas.tokens.get(tokenId);
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
      const item = new CONFIG.Item.documentClass(itemData, { actor: actor });

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