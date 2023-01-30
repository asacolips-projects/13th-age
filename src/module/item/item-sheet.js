/**
 * Override and extend the basic :class:`ItemSheet` implementation
 */
export class ItemArchmageSheet extends ItemSheet {

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

    // Sequencer support
    context.sequencerEnabled = game.modules.get("sequencer")?.active;

    // Power-specific data
    if (this.item.type === 'power') {
      context['powerSources'] = CONFIG.ARCHMAGE.powerSources;
      context['powerTypes'] = CONFIG.ARCHMAGE.powerTypes;
      context['powerUsages'] = CONFIG.ARCHMAGE.powerUsages;
      context['actionTypes'] = CONFIG.ARCHMAGE.actionTypes;
    }
    // Equipment-specific data
    else if (this.item.type === 'equipment') {
      context['equipUsages'] = CONFIG.ARCHMAGE.equipUsages;
    }

    if (this.actor) {
      let powerClass = 'monster';

      // Determine if nightmode is used.
      context.nightmode = this.actor.getFlag('archmage', 'nightmode') ?? false;

      if (this.actor.type === 'character') {
        // Pass general character data.
        powerClass = this.actor.system.details.class.value.toLowerCase();
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

    // If there wasn't an actor, check to see if the user's selector character
    // has nightmode set as a fallback.
    if (game.user?.character) {
      context.nightmode = game.user.character.getFlag('archmage', 'nightmode') ?? false;
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
      itemId: this.item.id
    });
  }

  /**
   * Handle a received request to display an item.
   */
  static _handleShareItem({itemId}={}) {
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
          theme: context.nightmode ? 'monokai' : 'default',
          readOnly: textarea.hasAttribute('readonly')
        }).on('change', (instance) => instance.save());
      }
    }
  }
}



Hooks.once('ready', async function () {
  game.socket.on("system.archmage", (msg) => {
    ItemArchmageSheet._handleShareItem(msg);
  });
})
