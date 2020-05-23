
/**
 * Override and extend the basic :class:`Item` implementation
 */
export class ItemArchmage extends Item {

  prepareData() {
    super.prepareData();
    if (!this.data.img || this.data.img == CONFIG.DEFAULT_TOKEN) {
      if (CONFIG.ARCHMAGE.defaultTokens[this.data.type]) {
        this.data.img = CONFIG.ARCHMAGE.defaultTokens[this.data.type];
      }
      else {
        this.data.img = CONST.DEFAULT_TOKEN;
      }
    }
  }

  /**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async roll() {

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/${this.data.type.toLowerCase()}-card.html`
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token.scene._id}.${token.id}` : null,
      item: this.data,
      data: this.getChatData()
    };

    // Basic chat message data
    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Create the chat message
    return ChatMessage.create(chatData, { displaySheet: false });
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
        label: data.actionType.label,
        value: CONFIG.ARCHMAGE.actionTypes[data.actionType.value]
      },
      {
        label: data.powerUsage.label,
        value: CONFIG.ARCHMAGE.powerUsages[data.powerUsage.value]
      },
      {
        label: data.powerSource.label,
        value: CONFIG.ARCHMAGE.powerSources[data.powerSource.value]
      },
      {
        label: data.powerType.label,
        value: CONFIG.ARCHMAGE.powerTypes[data.powerType.value]
      },
      {
        label: data.powerLevel !== undefined ? data.powerLevel.label : 'Level',
        value: data.powerLevel !== undefined ? 'Level ' + data.powerLevel.value : 'Level ' + this.actor.data.data.details.level.value
      }
    ];
    const properties = [
      // {
      //   label: data.range.label,
      //   value: data.range.value
      // },
      {
        label: data.recharge.label,
        value: data.recharge.value
      },
      {
        label: data.trigger.label,
        value: data.trigger.value
      },
      {
        label: data.target.label,
        value: data.target.value
      },
      {
        label: data.always.label,
        value: data.always.value
      },
      {
        label: data.attack.label,
        value: data.attack.value
      },
      {
        label: data.hit.label,
        value: data.hit.value
      },
      {
        label: data.hitEven.label,
        value: data.hitEven.value
      },
      {
        label: data.hitOdd.label,
        value: data.hitOdd.value
      },
      {
        label: data.crit.label,
        value: data.crit.value
      },
      {
        label: data.miss.label,
        value: data.miss.value
      },
      {
        label: data.missEven.label,
        value: data.missEven.value
      },
      {
        label: data.missOdd.label,
        value: data.missOdd.value
      },
      {
        label: data.cost.label,
        value: data.cost.value
      }
    ];
    const feats = [
      {
        label: data.feats.adventurer.description.label,
        description: data.feats.adventurer.description.value,
        isActive: data.feats.adventurer.isActive.value
      },
      {
        label: data.feats.champion.description.label,
        description: data.feats.champion.description.value,
        isActive: data.feats.champion.isActive.value
      },
      {
        label: data.feats.epic.description.label,
        description: data.feats.epic.description.value,
        isActive: data.feats.epic.isActive.value
      }
    ];
    const effects = [
      {
        label: data.effect.label,
        value: data.effect.value
      },
      {
        label: data.castBroadEffect.label,
        value: data.castBroadEffect.value
      },
      {
        label: data.castPower.label,
        value: data.castPower.value
      },
      {
        label: data.sustainedEffect.label,
        value: data.sustainedEffect.value
      },
      {
        label: data.finalVerse.label,
        value: data.finalVerse.value
      },
      {
        label: data.spellLevel3.label,
        value: data.spellLevel3.value
      },
      {
        label: data.spellLevel5.label,
        value: data.spellLevel5.value
      },
      {
        label: data.spellLevel7.label,
        value: data.spellLevel7.value
      },
      {
        label: data.spellLevel9.label,
        value: data.spellLevel9.value
      },
      {
        label: data.spellChain.label,
        value: data.spellChain.value
      },
      {
        label: data.breathWeapon.label,
        value: data.breathWeapon.value
      },
      {
        label: data.special.label,
        value: data.special.value
      }
    ];
    data.tags = tags.filter(t => t.value !== null && t.value !== undefined && t.value != '');
    data.properties = properties.filter(p => p.value !== null && p.value !== undefined && p.value != '');
    data.feats = feats.filter(f => f.description !== null && f.description !== undefined && f.description !== '');
    data.effects = effects.filter(e => e.value !== null && e.value !== undefined && e.value != '');
    data.effect = {
      label: data.effect.label,
      value: data.effect.value
    };
    data.special = {
      label: data.special.label,
      value: data.special.value
    };
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