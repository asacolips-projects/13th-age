/**
 * Override and extend the basic :class:`ItemSheet` implementation
 */
export class ItemArchmageSheet extends ItemSheet {

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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
    const data = super.getData(options);

    // Power-specific data
    if (this.item.type === 'power') {
      data['powerSources'] = CONFIG.ARCHMAGE.powerSources;
      data['powerTypes'] = CONFIG.ARCHMAGE.powerTypes;
      data['powerUsages'] = CONFIG.ARCHMAGE.powerUsages;
      data['actionTypes'] = CONFIG.ARCHMAGE.actionTypes;
    }
    // Equipment-specific data
    else if (this.item.type === 'equipment') {
      data['equipUsages'] = CONFIG.ARCHMAGE.equipUsages;
    }

    if (this.actor) {
      let powerClass = 'monster';

      if (this.actor.type === 'character') {
        // Pass general character data.
        powerClass = this.actor.data.data.details.class.value.toLowerCase();
      }

      let powerLevel = this.actor.data.data.details.level.value;
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

      data['powerClass'] = powerClass;
      data['powerLevel'] = powerLevelString;
    }

    // console.log(data);
    data.data = data.data.data;
    return data;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    let me = this;

    // Share Entry
    if (game.user.isGM) {
      buttons.unshift({
        label: "Show Players",
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
  activateListeners(html) {
    super.activateListeners(html);
  }
}



Hooks.once('ready', async function () {
  game.socket.on("system.archmage", (msg) => {
    ItemArchmageSheet._handleShareItem(msg);
  });
})
