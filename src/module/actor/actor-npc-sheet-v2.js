import { ActorArchmageSheetV2 } from './actor-sheet-v2.js';
import { ArchmageNpcSheet } from '../../vue/components.vue.es.js';

export class ActorArchmageNpcSheetV2 extends ActorArchmageSheetV2 {
  /** @override */
  constructor(...args) {
    super(...args);

    // Properties that we'll use for the Vue app.
    this.vueApp = null;
    this.vueRoot = null;
    this.vueComponents = {
      'npc-sheet': ArchmageNpcSheet
    };
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'npc-sheet']).filter(c => c !== 'archmage'),
      width: 640,
      height: 800,
    });
    return options;
  }

  /** @override */
  get template() {
    const type = this.actor.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-vue.html`;
  }

  /** @override */
  getData(options) {
    const context = super.getData();

    // Prepare select fields.
    context.data.roles = CONFIG.ARCHMAGE.creatureRoles;
    context.data.sizes = CONFIG.ARCHMAGE.creatureSizes;
    context.data.types = CONFIG.ARCHMAGE.creatureTypes;

    return context;
  }

  // /* ------------------------------------------------------------------------ */
  // /*  Event Listeners ------------------------------------------------------- */
  // /* ------------------------------------------------------------------------ */

  // /** @override */
  // activateListeners(html) {
  //   super.activateListeners(html);

  //   // Non-editable listeners should go here (uncommon, but calculations could be an example).

  //   if (!this.options.editable) return;

  //   // Editable listeners should go after here (CRUD, effects, etc.).
  // }

  // /**
  //  * Activate additional listeners on the rendered Vue app.
  //  * @param {jQuery} html
  //  */
  // activateVueListeners(html, repeat = false) {
  //   // Uncommon. Some examples would be TinyMCE editors and drag events.
  //   super.activateVueListeners(html, repeat);

  //   if (repeat) return;
  //   if (!this.options.editable) return;
  // }

  /* ------------------------------------------------------------------------ */
  /*  Create, Update, Delete------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /**
   * Create items on the actor, such as powers or magic items.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
   async _createItem(event) {
    let target = event.currentTarget;
    let dataset = duplicate(target.dataset);

    // Grab the item type from the dataset and then remove it.
    let itemType = dataset.itemType ?? 'power';

    // @todo: Refactor this after migrating actions to a single type.
    if (dataset.powerType && ['action', 'trait', 'nastierSpecial'].includes(dataset.powerType)) {
      itemType = dataset.powerType;
    }

    // Handle the power group.
    if (dataset?.groupType && dataset?.powerType) {
      let groupType = dataset.groupType;
      let model = game.system.model.Item[itemType];
      if (model[groupType] && groupType !== 'powerType') {
        dataset[groupType] = foundry.utils.duplicate(dataset.powerType);
        delete dataset.powerType;
      }
    }

    // Clear out dataset props.
    delete dataset.groupType;
    delete dataset.itemType;

    // Default image.
    let img = CONFIG.ARCHMAGE.defaultTokens[itemType] ?? CONFIG.DEFAULT_TOKEN;

    // Initialize data.
    let data = {};
    if (typeof dataset == 'object') {
      for (let [k,v] of Object.entries(dataset)) {
        data[k] = { value: v };
      }
    }
    else {
      data = dataset;
    }

    // Create the item.
    let itemData = {
      name: 'New ' + game.i18n.localize(`ARCHMAGE.${itemType}`),
      type: itemType,
      img: img,
      data: data
    };
    await this.actor.createEmbeddedDocuments('Item', [itemData]);
  }
}