/**
 * Override and extend the basic :class:`ItemSheet` implementation
 */
export class ItemArchmageSheet extends foundry.appv1.sheets.ItemSheet {

  /**
   * Extend and override the default options used by the Actor Sheet
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      scrollY: ['.sheet-tabs-content'],
      classes: super.defaultOptions.classes.concat(['archmage', 'item', 'item-sheet']),
      template: 'systems/archmage/templates/item-power-sheet.html',
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-tabs-content", initial: "details" }]
    });
  }

  constructor(item, options) {
    super(item, options);
    this.mce = null;
  }

  /* -------------------------------------------- */

  /**
   * Use a type-specific template for each different item type
   */
  get template() {
    let type = this.item.type;
    // Special cases.
    if (type === 'nastierSpecial') {
      type = 'nastier-special';
    }
    // Get template.
    return `systems/archmage/templates/items/item-${type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare item sheet data
   * Start with the base item data and extending with additional properties for
   * rendering.
   *
   * @return {undefined}
   */
  async getData(options) {
    const context = super.getData(options);

    // Edition
    context.secondEdition = game.settings.get("archmage", "secondEdition");

    // Sequencer support
    context.sequencerEnabled = game.modules.get("sequencer")?.active;

    // Effects.
    function getChanges(effect) {
      let changes = [];
      let modes = [
        'question',
        'times',
        'plus',
        "minus",
        'angle-double-down',
        'angle-double-up',
        'undo'
      ]
      effect.changes.forEach(c => {
        if (c.key && c.value) {
          const label = game.archmage.ArchmageUtility.cleanActiveEffectLabel(c.key);
          let change = {
            name: label,
            img: game.archmage.ArchmageUtility.getActiveEffectLabelIcon(label),
            mode: modes[c.mode],
            value: c.value
          };
          if (change.mode === "plus" && change.value < 0) {
            change.mode = "minus";
            change.value = Math.abs(change.value);
          }
          changes.push(change);
        }
      })
      return changes;
    }
    context.effects = this.item.effects.toObject();
    context.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    for (let [index, effect] of context.effects.entries()) {
      context.effects[index].duration = effect.flags?.archmage?.duration
        ? game.i18n.localize(CONFIG.ARCHMAGE.effectDurationTypes[effect.flags.archmage.duration])
        : false;
      context.effects[index].ongoingDamage = effect.flags?.archmage?.ongoingDamage
        ? `${effect.flags.archmage.ongoingDamage} ongoing ${effect.flags.archmage.ongoingDamageType} damage`
        : false;
      context.effects[index].bonuses = getChanges(effect);
      context.effects[index].img = effect?.img ?? effect?.icon;
    }

    // Power-specific data
    if (this.item.type === 'power') {
      context['powerSources'] = CONFIG.ARCHMAGE.powerSources;
      context['powerTypes'] = CONFIG.ARCHMAGE.powerTypes;
      context['powerUsages'] = CONFIG.ARCHMAGE.powerUsages;
      context['actionTypes'] = CONFIG.ARCHMAGE.actionTypes;
      context['featTiers'] = CONFIG.ARCHMAGE.featTiers;
      context['featUsages'] = CONFIG.ARCHMAGE.featUsages;
    }
    // Equipment-specific data
    else if (this.item.type === 'equipment') {
      context['equipUsages'] = CONFIG.ARCHMAGE.equipUsages;
      context['tiers'] = CONFIG.ARCHMAGE.featTiers;
    }

    if (this.actor) {
      let powerClass = 'monster';

      if (this.actor.type === 'character') {
        // Pass general character data.
        powerClass = this.actor.system.details.class.value?.toLowerCase();
      }

      let powerLevel = this.actor.system.details.level.value;
      let powerLevelString = '';

      for (let i = 1; i <= powerLevel; i++) {
        if (powerLevelString.length < 1) {
          powerLevelString = '' + i;
        }
        else {
          powerLevelString = `${powerLevelString}+${i}`;
        }

        if (i >= 10) {
          break;
        }
      }

      context['powerClass'] = powerClass;
      context['powerLevel'] = powerLevelString;
    }

    context.system = context.data.system;
    return context;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    let me = this;

    // Share Entry
    if (game.user.isGM) {
      buttons.unshift({
        label: game.i18n.localize('ARCHMAGE.sharePlayers'),
        class: "share-image",
        icon: "fas fa-eye",
        onclick: () => this.shareItem()
      });
    }

    return buttons;
  }

  shareItem() {
    game.socket.emit("system.archmage", {
      type: "shareItem",
      itemId: this.item.id
    });
  }

  /**
   * Handle a received request to display an item.
   */
  static handleShareItem({itemId}={}) {
    let item = game.items.get(itemId);

    if (item == undefined) {
      let characters = game.actors.filter(x => x.data.type == "character");

      for (var x = 0; x <= characters.length; x++) {
        let actor = characters[x];
        let found = actor.data.items.find(x => x._id == itemId);
        if (found) {
          item = actor.items.get(itemId);
          break;
        }
      }
    }

    // Force permissions to ensure item displays for players
    let updates = {"ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER};
    updates[`ownership.${game.userId}`] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
    // Cloning without saving ensures this change is ephemeral
    item = item.clone(updates, {"save": false, "keepId": false});

    let itemSheet = new ItemArchmageSheet(item, {
      title: item.title,
      uuid: item.uuid,
      shareable: false,
      editable: false
    });

    return itemSheet.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for interactive item sheet events.
   *
   * @param {HTML} html The prepared HTML object ready to be rendered into
   *
   * @return {undefined}
   */
  async activateListeners(html) {
    super.activateListeners(html);
    const context = await this.getData();

    if (!this.options.editable) return;

    // If the _CodeMirror module is enabled, use it to create a code editor for
    // the macro field.
    if (game.modules.get('_CodeMirror')?.active && typeof CodeMirror != undefined) {
      const textarea = html.find(".power-macro-editor textarea")[0];
      if (textarea) {
        const editor = CodeMirror.fromTextArea(textarea, {
          mode: "javascript",
          ...CodeMirror.userSettings,
          lineNumbers: true,
          inputStyle: "contenteditable",
          autofocus: false,
          theme: game.settings.get("archmage", "nightmode") ? 'monokai' : 'default',
          readOnly: textarea.hasAttribute('readonly')
        }).on('change', (instance) => instance.save());
      }
    }

    // Feat buttons
    html.on('click', '.feat-edit', (event) => this._updateFeat(event));

    // Effects.
    html.on('click', '.effect-control', (event) => this._onManageEffect(event));
  }

  /**
   * Add/delete/reorder feats on a power.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  async _updateFeat(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    let item = this.item;
    if (item.type != "power") return;

    let featIndex = Number(dataset.featkey);
    let feats = item.system.feats;

    let change = (async () => {return;});
    switch(dataset.action) {
      case 'add':
        if (feats) feats = Object.values(feats);
        else feats = [];
        feats.push({
          "description": {
            "type": "String",
            "value": ""
          },
          "isActive": {
            "type": "Boolean",
            "value": false
          },
          "tier": {
            "type": "String",
            "value": "adventurer"
          },
          "powerUsage": {
            "type": "String",
            "value": ""
          },
          "quantity": {
            "type": "Number",
            "value": null
          },
          "maxQuantity": {
            "type": "Number",
            "value": null
          }
        });
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'del':
        change = (async () => {
          let newFeats = foundry.utils.deepClone(feats);
          delete newFeats[featIndex];
          newFeats = Object.assign({}, Object.values(newFeats));  // Re-index from 0
          let updateData = {'system.feats': newFeats};
          for (let key of Object.keys(item.system.feats)) {
            if (!newFeats[key]) updateData[`system.feats.-=${key}`] = null;
          }
          await item.update(updateData);
        });
        break;
      case 'up':
        if (featIndex == 0) return;
        feats = Object.values(feats);
        [feats[featIndex], feats[featIndex - 1]] = [feats[featIndex - 1], feats[featIndex]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'down':
        feats = Object.values(feats);
        if (featIndex >= feats.length - 1) return;
        [feats[featIndex + 1], feats[featIndex]] = [feats[featIndex], feats[featIndex + 1]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
    }

    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      await change();
      return;
    }
    let del = false;
    new Dialog({
      title: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm"),
      buttons: {
        del: {
          label: game.i18n.localize("ARCHMAGE.CHAT.Delete"),
          callback: async () => {del = true;}
        },
        cancel: {
          label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
          callback: async () => {}
        }
      },
      default: 'cancel',
      close: async html => {
        if (del) await change();
      }
    }).render(true);
  }

  /* ------------------------------------------------------------------------ */
  /*  Handle effects -------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  _onManageEffect(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;
    const effect = dataset.itemId ? this.document.effects.get(dataset.itemId) : null;

    switch (dataset.action) {
      case 'create':
        return this.document.createEmbeddedDocuments('ActiveEffect', [{
          name: game.i18n.localize("ARCHMAGE.EFFECT.AE.new"),
          img: this.document.img || 'icons/svg/aura.svg',
          origin: this.document.uuid,
          disabled: false
        }]);

      case 'edit':
        return effect.sheet.render(true);

      case 'delete':
        let del = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirmTitle"),
          content: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm"),
          buttons: {
            del: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Delete"),
              callback: () => {del = true;}
            },
            cancel: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
              callback: () => {}
            }
          },
          default: 'cancel',
          close: html => { if (del) return effect.delete(); }
        }).render(true);
        break;

      case 'toggle':
        return effect.update({disabled: !effect.disabled});
    }

  }
}
