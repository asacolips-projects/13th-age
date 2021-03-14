import { ActorArchmageSheet } from './actor-sheet.js';

export class ActorArchmageSheetV2 extends ActorArchmageSheet {
  /** @override */
  constructor(...args) {
    super(...args);

    console.log('tester');

    /**
     * If this Actor Sheet represents a synthetic Token actor, reference the active Token
     * @type {Token}
     */
    this.token = this.object.token;
    this._vm = null;
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: 800,
      height: 960,
      submitOnClose: false, // Avoid double submissions.
      submitOnChange: true,
      dragDrop: [{dragSelector: '.item-list .item', dropSelector: null}]
    });
    return options;
  }

  /** @override */
  get template() {
    const type = this.actor.data.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-v2.html`;
  }

  /** @override */
  getData() {
    const sheetData = super.getData();
    return sheetData;
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  render(force=false, options={}) {
    console.log('test');
    // Grab the sheetdata for both updates and new apps.
    let sheetData = this.getData();
    // Exit if Vue has already rendered.
    if (this._vm) {
      if (sheetData.data) Vue.set(this._vm.actor, 'data', sheetData.data);
      if (sheetData.items) Vue.set(this._vm.actor, 'items', sheetData.items);
      return;
    }
    // Run the normal Foundry render once.
    this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
	    console.error(err);
	    this._state = Application.RENDER_STATES.ERROR;
    })
    // Run Vue's render, assign it to our prop for tracking.
    .then(rendered => {
      // Prepare the actor data.
      let el = this.element.find('.archmage-vueport');
      // Render Vue and assign it to prevent later rendering.
      VuePort.render(null, el[0], {data: {actor: sheetData.actor, owner: this.actor.owner}}).then(vm => {
        this._vm = vm;
        console.log(this._vm);
      });
    })
    // Return per the overridden method.
    return this;
  }

  /** @override */
  async close(options={}) {
    // Destroy the Vue app.
    if (this._vm) {
      this._vm.$destroy();
      this._vm = null;
    }
    console.log('/////////////////////\r\nCLOSING SHEET\r\n/////////////////////');
    return super.close(options);
  }

  /* ------------------------------------------------------------------------ */
  /*  Event Listeners ------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '.item-create', (event) => this._createItem(event));
    html.on('click', '.item-delete', (event) => this._deleteItem(event));
    html.on('click', '.item-edit', (event) => this._editItem(event));
    // TODO: This is a hack to get editors working, find a better solution.
    setTimeout(() => {
      html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));
    }, 200);
  }

  /**
   * Create items on the actor, such as powers or magic items.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  async _createItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Grab the item type from the dataset and then remove it.
    let itemType = dataset.itemType ?? 'power';
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
    await this.actor.createOwnedItem({
      name: 'New ' + game.i18n.localize(`ARCHMAGE.${itemType}`),
      type: itemType,
      img: img,
      data: data
    });
  }

  /**
   * Delete items from the actor.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  async _deleteItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Delete the tiem from the actor object.
    await this.actor.deleteOwnedItem(itemId);
  }

  _editItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Render the edit form.
    const item =this.actor.getOwnedItem(itemId);
    if (item) item.sheet.render(true);
  }
}

Hooks.on()