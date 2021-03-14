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
    // Grab the sheetdata for both updates and new apps.
    let sheetData = this.getData();
    // Exit if Vue has already rendered.
    if (this._vm) {
      if (sheetData.data) Vue.set(this._vm.actor, 'data', sheetData.data);
      if (sheetData.items) Vue.set(this._vm.actor, 'items', sheetData.items);
      this._updateEditors($(this.form));
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
        let html = $(this.form);
        this.activateVueListeners(html);
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

  // Update initial content throughout all editors.
  _updateEditors(html) {
    for (let [name, editor] of Object.entries(this.editors)) {
      const data = this.object instanceof Entity ? this.object.data : this.object;
      const initialContent = getProperty(data, name);
      const div = $(this.form).find(`.editor-content[data-edit="${name}"]`)[0];
      this.editors[name].initial = initialContent;
      this.editors[name].options.target = div;
    }
  }

  /** @override */
  activateEditor(name, options={}, initialContent="") {
    const editor = this.editors[name];
    if ( !editor ) throw new Error(`${name} is not a registered editor name!`);
    options = mergeObject(editor.options, options);
    options.height = options.target.offsetHeight;
    // Override initial content to pull from the editor, to avoid stale data.
    initialContent = editor.initial;
    TextEditor.create(options, initialContent).then(mce => {
      editor.mce = mce;
      editor.changed = false;
      editor.active = true;
      mce.focus();
      mce.on('change', ev => editor.changed = true);
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  Event Listeners ------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // CRUD listeners.
    html.on('click', '.item-create', (event) => this._createItem(event));
    html.on('click', '.item-delete', (event) => this._deleteItem(event));
    html.on('click', '.item-edit', (event) => this._editItem(event));

    // Support Image updates
    if ( this.options.editable ) {
      html.on('click', 'img[data-edit]', (event) => this._onEditImage(event));
    }

    // Roll listeners.
    html.on('click', '.rollable', (event) => this._onRollable(event));
  }

  /**
   * Activate additional listeners on the rendered Vue app.
   * @param {jQuery} html
   */
  activateVueListeners(html) {
    html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));
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

  /**
   * Handle rollable clicks.
   */
  _onRollable(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.rollType ?? null;
    let opt = dataset.rollOpt ?? null;

    if (type == 'item' && opt) this._onItemRoll(opt);
    else if (type == 'recovery') this._onRecoveryRoll();
    // else if (type == 'save') this._onSaveRoll(opt);
    // else if (type == 'init') this._onInitRoll(opt);
    // else if (type == 'ability') this._onAbilityRoll(opt);
    // else if (type == 'background') this._onBackgroundRoll(opt);
    // else if (type == 'icon') this._onIconRoll(opt);
    // else if (type == 'command') this._onCommandRoll(opt);
    // else if (type == 'disengage') this._onDisengageRoll(opt);

    // Fallback to a plain formula roll.
    else if (opt) this._onFormulaRoll(opt);

  }

  /**
   * Perform a basic roll and send it to chat.
   * @param {string} formula
   */
  _onFormulaRoll(formula) {
    let roll = new Roll(formula, this.actor.getRollData());
    roll.roll();
    roll.toMessage();
  }

  /**
   * Perform an owned item's roll.
   * @param {string} id
   */
  _onItemRoll(id) {
    let item = this.actor.getOwnedItem(id);
    if (item) item.roll();
  }

  /**
   * Roll a recovery for the actor.
   */
  _onRecoveryRoll() {
    let actorData = this.actor.data.data;
    let attr = actorData.attributes;
    let totalRecoveries = attr.recoveries.value;
    let formula = `${attr.level.value}${attr.recoveries.dice}+${actorData.abilities.con.dmg}`;

    // Handle average results.
    if (this.actor.getFlag('archmage', 'averageRecoveries')) {
      formula = Math.floor(attr.level.value * ((Number(attr.recoveries.dice.replace('d', ''))+1) / 2)) + actorData.abilities.con.dmg;
    }
    // Handle strong recovery. Ignores average results if set!
    if (this.actor.getFlag('archmage', 'strongRecovery')) {
      formula = (attr.level.value + actorData.tier).toString() + attr.recoveries.dice + 'k' + attr.level.value.toString() + '+' + actorData.abilities.con.dmg.toString();
    }
    // Perform the roll.
    let roll = new Roll(Number(totalRecoveries) > 0 ? `${formula}` : `floor((${formula})/2)`);
    roll.roll();
    // Send to chat and reduce the number of recoveries.
    roll.toMessage({
      flavor: `<div class="archmage chat-card"><header class="card-header"><h3 class="ability-usage">Recovery Roll${Number(totalRecoveries) < 1 ? ' (Half)' : ''}</h3></header></div>`
    });
    this.actor.update({
      'data.attributes.recoveries.value': attr.recoveries.value - 1,
      'data.attributes.hp.value': Math.min(attr.hp.max, Math.max(attr.hp.value, 0) + roll.total)
    });
  }
}

Hooks.on()