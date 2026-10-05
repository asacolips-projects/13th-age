import { ArchmagePrepopulate } from '../setup/archmage-prepopulate.js';
import { ArchmagePowerImporterApplication } from '../applications/power-importer.js';
import { parentNamesById } from '../item/item-relations.mjs';
// Import Vue dependencies.
import { createApp } from "../../scripts/lib/vue.esm-browser.js";
import { ArchmageCharacterSheet } from "../../vue/components.vue.es.js";
import { DOCUMENT_PROVIDE_KEYS } from '../item/_vue-application-mixin.mjs';
import { pickImage } from '../helpers/sheet-helpers.mjs';
import { ActorHelpersV2, buildSheetContext, sortItemDrop } from './helpers/actor-helpers-v2.js';
import { DiceArchmage } from './dice.js';

export class ActorArchmageSheetV2 extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  constructor(...args) {
    super(...args);

    // Properties that we'll use for the Vue app.
    this.vueApp = null;
    this.vueRoot = null;
    this.vueListenersActive = false;
    this._renderKey = 0;
    this.vueComponents = {
      'character-sheet': ArchmageCharacterSheet
    };
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    const compactMode = game.settings.get('archmage', 'compactMode');
    const nightMode = game.settings.get("archmage", "nightmode");
    foundry.utils.mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: compactMode ? 826 : 960,
      height: compactMode ? 750 : 960,
      submitOnClose: true,
      submitOnChange: true,
      dragDrop: [{dragSelector: '.item-list .item', dropSelector: null}]
    });

    if (compactMode) {
      options.classes.push('compact-mode');
    }

    if (nightMode) {
      options.classes.push('nightmode');
    }

    return options;
  }

  /** @override */
  get template() {
    const type = this.actor.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-vue.html`;
  }

  /** @override */
  getData(options) {
    // Shared sheet context plus the AppV1-only fields this sheet adds.
    const context = buildSheetContext(this.actor, {
      appId: this.appId,
      options: this.options,
      editable: this.isEditable,
      isNPC: this.actor.type === "npc",
      _renderKey: this._renderKey
    });

    // Mark the items that came along with another one.
    const parentNames = parentNamesById(this.actor);
    for (const item of context.actor.items) {
      if (parentNames.has(item._id)) item.grantedBy = parentNames.get(item._id).join(', ');
    }

    return context;
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  render(force=false, options={}) {
    this._renderKey++;
    const context = this.getData();

    // Render the vue application after loading. We'll need to destroy this
    // later in the this.close() method for the sheet.
    if (!this.vueApp || !this.vueRoot) {
      this.vueRoot = null;
      this.vueApp = createApp({
        // Initialize data.
        data() {
          return {
            context: context,
          }
        },
        // Define our character sheet component.
        components: this.vueComponents,
        // Create a method to the update the data while retaining reactivity.
        methods: {
          updateContext(newContext) {
            for (let key of Object.keys(this.context)) {
              this.context[key] = newContext[key];
            }
          }
        }
      });
      // Expose the actor document for components that inject it, matching the
      // Vue application mixin's documentProvideKey.
      this.vueApp.provide(DOCUMENT_PROVIDE_KEYS.actorDocument, this.actor);
    }
    // Otherwise, perform update routines on the app.
    else {
      // Pass new values from this.getData() into the app.
      this.vueRoot.updateContext(context);
      // Reactivate the listeners if we need to.
      if (!this.vueListenersActive) {
        setTimeout(() => {
          this.activateVueListeners($(this.form), true);
        }, 200);
      }
      return;
    }

    // If we don't have an active vueRoot, run Foundry's render and then mount
    // the Vue application to the form.
    this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    })
    // Run Vue's render, assign it to our prop for tracking.
    .then(rendered => {
      // @todo Determine why this is necessary to avoid warnings during
      // actor/token migrations.
      let $selector = $(`[data-appid="${this.appId}"] .archmage-vue`);
      if ($selector.length > 0) {
        this.vueRoot = this.vueApp.mount(`[data-appid="${this.appId}"] .archmage-vue`);
        // @todo Find a better solution than a timeout.
        setTimeout(() => {
          this.activateVueListeners($(this.form), false);
        }, 200);
      }
    });

    // Store our app for later.
    this.object.apps[this.appId] = this;
    return this;
  }

  /** @override */
  async close(options={}) {
    // Run the upstream close method.
    const result = await super.close(options);
    // Unmount and clean up the vue app on close.
    this.vueApp.unmount();
    this.vueApp = null;
    this.vueRoot = null;
    // Return the close response from earlier.
    return result;
  }

  /** @override */
  async saveEditor(name, {remove=true, preventRender}={}) {
    const editor = this.editors[name];
    if (!editor || !editor.instance) throw new Error(`${name} is not an active editor name!`);
    editor.active = false;
    const instance = editor.instance;
    const event = new Event("submit", {cancelable: true});
    await this._onSubmit(event, {preventRender});

    if (remove) {
      // Grab the .editor wrapper before destroying: ProseMirror restructures the
      // DOM on activate (inserts menu-container + editor-container) and does NOT
      // undo that on destroy. Foundry normally restores it via render(), but the
      // Vue sheet's render() skips DOM recreation when vueRoot already exists.
      const editorEl = editor.options.target?.closest(".editor");

      instance.destroy();
      editor.instance = editor.mce = null;

      if (editorEl) {
        editorEl.classList.remove("prosemirror");
        editorEl.innerHTML = "";

        if (editor.hasButton) {
          const btn = document.createElement("a");
          btn.className = "editor-edit";
          btn.innerHTML = '<i class="fas fa-edit"></i>';
          btn.onclick = () => {
            // Rebuild plugins — ProseMirror plugin instances carry editor-view
            // state and cannot be reused across activations.
            editor.options.plugins = this._configureProseMirrorPlugins(name, {remove: true});
            // Strip 'document' from editor.options before activation: the
            // DocumentSheet.activateEditor override merges options.document
            // (the actor) into editor.options via mergeObject, and on a second
            // activation that causes mergeObject to try writing into the
            // actor's read-only properties.
            delete editor.options.document;
            editor.initial = foundry.utils.getProperty(this.object, name);
            this.activateEditor(name, {}, editor.initial);
          };
          editor.button = btn;
          editorEl.appendChild(btn);
        }

        const contentDiv = document.createElement("div");
        contentDiv.className = "editor-content";
        contentDiv.dataset.edit = name;
        editor.options.target = contentDiv;
        const rawContent = foundry.utils.getProperty(this.object, name) ?? "";
        contentDiv.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawContent, {
          secrets: this.object.isOwner,
          documents: true,
          links: true,
          rolls: true,
          rollData: this.object.getRollData?.() ?? {},
        });
        editorEl.appendChild(contentDiv);
      }
    }
    editor.changed = false;
  }

  // Update initial content throughout all editors.
  _updateEditors(html) {
    for (let [name, editor] of Object.entries(this.editors)) {
      // const data = this.object instanceof Document ? this.object.data : this.object;
      const data = this.object;
      const initialContent = getProperty(data, name);
      const div = $(this.form).find(`.editor-content[data-edit="${name}"]`)[0];
      this.editors[name].initial = initialContent;
      this.editors[name].options.target = div;
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Event Listeners ------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    ActorHelpersV2._activatePortraitArtContextMenu(this, html)

    // Close the mobile menu if open.
    html.on('click', (event) => {
      const button = event?.target?.closest('.sheet-tabs-toggle') ?? event.target;
      // Exit early if is the mobile menu button itself, that's handled in the component.
      if (button?.classList?.contains('sheet-tabs-toggle')) return;
      // Otherwise close the menu.
      const parent = event?.target?.classList?.contains('archmage-v2-vue')
        ? event.target
        : event?.target?.closest('.archmage-v2-vue');
      const mobileMenu = parent.querySelector('.tabs--mobile.active');
      if (mobileMenu) {
        mobileMenu.classList.remove('active');
      }
    })

    if (!this.options.editable) return;

    // CRUD listeners.
    html.on('click', '.item-create', (event) => this._createItem(event));
    html.on('click', '.item-delete', (event) => this._deleteItem(event));
    html.on('click', '.item-edit', (event) => this._editItem(event));

    // Effects.
    html.on('click', '.effect-control', (event) => this._onManageEffect(event));

    // Support Image updates
    if ( this.options.editable ) {
      html.on('click', 'img[data-edit]', (event) => {
        // Handle Tokenizer integration since the delayed Vue render prevents it.
        const tokenizer = game.modules.get('vtta-tokenizer')?.active ?? false;
        let bypass = event.shiftKey ? true : false;
        if (tokenizer && !bypass) {
          const doc = this.token ? this : this.document;
          event.stopPropagation();
          Tokenizer.tokenizeDoc(doc);
          event.preventDefault();
        }
        // Otherwise, use the file picker.
        else {
          this._onEditImage(event)
        }
      });
    }

    // Roll listeners.
    html.on('click', '.rollable', (event) => this._onRollable(event));

    // Other listeners.
    html.on('click', '.item-import', (event) => this._importPowers(event));
    html.on('click', '.death-save-attempts input[type="checkbox"]', (event) => this._updateFails(event, "deathFails"));
    html.on('click', '.lastgasp-save-attempts input[type="checkbox"]', (event) => this._updateFails(event, "lastGaspFails"));
    html.on('click', '.icon-roll', (event) => this._updateIconRoll(event));
    html.on('click', '.rest', (event) => this._onRest(event));

    // Item listeners.
    // Uses and quantity counters, and the expandable item rows'
    // edit/delete controls are handled by their own Vue components.
    html.on('click', '.feat-uses-rollable', (event) => this._updateFeatQuantity(event, true));
    html.on('contextmenu', '.feat-uses-rollable', (event) => this._updateFeatQuantity(event, false));
    html.on('click', '.feat-pip', (event) => this._updatePips(event));
  }

  /**
   * Handle changing a Document's image.
   *
   * Delegates to the shared pickImage helper, preserving this sheet's
   * submitOnChange guard around the document update.
   *
   * @param {MouseEvent} event  The click event.
   * @returns {Promise}
   * @override
   */
  _onEditImage(event) {
    return pickImage(this, event, event.currentTarget, {respectSubmitOnChange: true});
  }

  /**
   * Activate additional listeners on the rendered Vue app.
   * @param {jQuery} html
   */
  activateVueListeners(html, repeat = false) {
    if (!this.options.editable) {
      html.find('input,select,textarea').attr('disabled', true);
      return;
    }

    if (html.find('.archmage-v2-vue').length > 0) {
      this.vueListenersActive = true;
    }

    this._dragHandler(html);
    this._lockEffectsFields(html);

    // Place one-time executions after this line.
    if (repeat) return;

    html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));

    // Input listeners.
    let inputs = '.section input[type="text"], .section input[type="number"]';
    html.on('focus', inputs, (event) => this._onFocus(event));
  }

  /*
   * Prevent Effects Editing
   */
  _lockEffectsFields(html) {
    // const context = this.getData();
    // html.find('input[name]').each((i, el) => {
    //   const name = el.name;
    //   // @todo improve this
    //   if (context.actor.lockedFields.includes(name)) {
    //     el.readOnly = true;
    //   }
    //   else {
    //     el.readonly = false;
    //   }
    // })
  }

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
    let dataset = foundry.utils.duplicate(target.dataset);

    // Grab the item type from the dataset and then remove it.
    let itemType = dataset.itemType ?? 'power';
    delete dataset.itemType;

    // Handle the power group.
    if (dataset?.groupType && dataset?.powerType) {
      let groupType = dataset.groupType;
      let model = game.data.model.Item[itemType];
      if (model[groupType] && groupType !== 'powerType') {
        dataset[groupType] = foundry.utils.duplicate(dataset.powerType);
        delete dataset.powerType;
      }
      delete dataset.groupType;
    }

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
      name: game.archmage.ArchmageUtility.formatNewItemName(itemType),
      type: itemType,
      img: img,
      system: data
    };
    await this.actor.createEmbeddedDocuments('Item', [itemData]);
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

    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      let item = this.actor.items.get(itemId);
      item.delete();
      return;
    }

    // Items this one brought along are deleted with it, so list them.
    let content = game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm");
    const progeny = (await this.actor.items.get(itemId)?.gatherChildren() ?? [])
      .filter(child => child.parent === this.actor);
    if (progeny.length) {
      const names = progeny.map(child => `<li>${foundry.utils.escapeHTML(child.name)}</li>`).join('');
      content += `<p>${game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirmChildren")}</p><ul>${names}</ul>`;
    }

    // Delete the item from the actor object. An item that includes others can
    // also be deleted alone, which leaves what it included as ordinary items.
    let del = false;
    let withChildren = true;
    const buttons = {
      del: {
        label: game.i18n.localize("ARCHMAGE.CHAT.Delete"),
        callback: () => {del = true;}
      }
    };
    if (progeny.length) {
      buttons.delOnly = {
        label: game.i18n.localize("ARCHMAGE.CHAT.DeleteOnlyThis"),
        callback: () => {del = true; withChildren = false;}
      };
    }
    buttons.cancel = {
      label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
      callback: () => {}
    };
    new Dialog({
      title: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirmTitle"),
      content: content,
      buttons: buttons,
      default: 'cancel',
      close: html => {
        if (del) {
          let item = this.actor.items.get(itemId);
          item.delete(withChildren ? {} : {archmageChildren: false});
        }
      }
    }).render(true);
  }

  _editItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Render the edit form.
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  /* ------------------------------------------------------------------------ */
  /*  Handle effects -------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  _onManageEffect(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;
    const effect = dataset.itemId ? this.actor.effects.get(dataset.itemId) : null;

    switch (dataset.action) {
      case 'create':
        return this.actor.createEmbeddedDocuments('ActiveEffect', [{
          name: game.i18n.localize("ARCHMAGE.EFFECT.AE.new"),
          img: 'icons/svg/aura.svg',
          origin: this.actor.uuid,
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

  /* ------------------------------------------------------------------------ */
  /*  Handle rolls ---------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /**
   * Handle rollable clicks.
   */
  async _onRollable(event) {
    event.preventDefault;
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.rollType ?? null;
    let opt = dataset.rollOpt ?? null;
    let opt2 = dataset.rollOpt2 ?? null;

    if (type == 'item' && opt) this._onItemRoll(opt);
    else if (type == 'recovery') this._onRecoveryRoll(event);
    else if (type == 'save') this._onSaveRoll(opt);
    else if (type == 'disengage') this._onDisengageRoll(opt);
    else if (type == 'init') this._onInitRoll();
    else if (type == 'ability') this._onAbilityRoll(opt);
    else if (type == 'background') this._onBackgroundRoll(opt);
    else if (type == 'icon') this.actor.rollIconDialog(opt);
    else if (type == 'command') this._onCommandRoll(opt);
    else if (type == 'recharge') this._onRechargeRoll(opt);
    else if (type == 'feat') this._onFeatRoll(opt, opt2);
    else if (type == 'reroll') this._onRerollRoll(opt);

    // Fallback to a plain formula roll.
    else if (opt) await this._onFormulaRoll(opt);
  }

  /**
   * Perform a basic roll and send it to chat.
   *
   * @param {string} formula
   */
  async _onFormulaRoll(formula) {
    let roll = new Roll(formula, this.actor.getRollData());
    await roll.roll();
    roll.toMessage();
  }

  /**
   * Perform an owned item's roll.
   *
   * @param {string} id
   */
  _onItemRoll(id) {
    let item = this.actor.items.get(id);
    if (item) item.roll();
  }

  /**
   * Roll a recovery for the actor.
   */
  async _onRecoveryRoll(event) {
    this.actor.rollRecoveryDialog(event);
  }


  /**
   * Roll a saving throw for the actor.
   *
   * @param {string} difficulty
   *   The save type, such as 'easy', 'normal', 'hard', or 'death'.
   */
  async _onSaveRoll(difficulty) {
    this.actor.rollSave(difficulty);
  }


  /**
   * Roll a disengage check for the actor.
   *
   * @param {string} difficulty
   *   The save type, such as 'easy', 'normal', 'hard', 'death', or 'disengage'.
   */
  async _onDisengageRoll() {
    this.actor.rollDisengage();
  }

  /**
   * Roll initiative for the actor.
   */
  async _onInitRoll() {
    this.actor.rollInitiativeDialog();
  }

  /**
   * Roll ability check for the actor.
   */
  _onAbilityRoll(ability) {
    DiceArchmage.BackgroundRoll(this.actor, {defaultAbility: ability});
  }

  /**
   * Roll background check for the actor.
   */
   _onBackgroundRoll(background) {
    DiceArchmage.BackgroundRoll(this.actor, {defaultBackground: background});
  }

  /**
   * Roll command points for an actor, and apply them.
   *
   * @param {string} dice
   *   Dice formula to roll.
   */
  async _onCommandRoll(dice) {
    return this.actor.rollCommand(dice);
  }

  async _onRechargeRoll(itemId) {
    let item = this.actor.items.get(itemId);
    if (item) await item.recharge();
  }

  async _onFeatRoll(itemId, featId) {
    let item = this.actor.items.get(itemId);
    if (item) item.rollFeat(featId);
  }

  async _onRerollRoll(kind) {
    this.actor.rollReroll(kind);
  }

  /* ------------------------------------------------------------------------ */
  /*  Special Listeners ----------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  async _updateFails(event, saveType) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    if (dataset.opt) {
      await this.actor.updateFails(saveType, dataset.opt);
    }
  }

  async _updateIconRoll(event) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    if (dataset.roll && dataset.key && dataset.rollKey) {
      let iconIndex = dataset.key;
      let resultIndex = dataset.rollKey;
      let value = Number(dataset.roll);

      // Increment the value.
      value++;
      if (value > 6) {
        value = 0;
      }
      else if (value < 5) {
        value = 5;
      }
      if (game.settings.get('archmage', 'alternateIconRollingMethod') && value === 5) {
        // Skip 5's, dice are either used or not
        value = 6;
      }

      // Retrieve the original results array, replace this die result.
      let results = this.actor.system.icons[iconIndex].results;
      results[resultIndex] = value;

      // Execute the update.
      let updates = {};
      updates[`system.icons.${iconIndex}.results`] = results;
      await this.actor.update(updates);
    }
  }

  /**
   * Increase or decrease a power feat's remaining uses.
   *
   * @param {MouseEvent} event  The click (increase) or contextmenu (decrease) event.
   * @param {Boolean} increase  Whether to add or remove a use.
   */
  async _updateFeatQuantity(event, increase = true) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    let itemId = dataset.itemId;
    if (!itemId) return;

    let item = this.actor.items.get(itemId);
    if (!item) return;

    let featIndex = dataset.itemFeatkey;
    let feat = item.system.feats[featIndex];
    if (!feat) return;

    // Update the quantity.
    let newQuantity = Number(feat.quantity.value) ?? 0;
    newQuantity = increase ? newQuantity + 1 : newQuantity - 1;

    // TODO: Refactor the fallback to not be absurdly high after maxQuantity has become regularly used.
    let maxQuantity = feat.maxQuantity.value ?? 99;

    let updateData = {};
    updateData[`system.feats.${featIndex}.quantity.value`] = increase ? Math.min(maxQuantity, newQuantity) : Math.max(0, newQuantity);

    await item.update(updateData, {});
  }

  async _updatePips(event) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;
    let itemId = dataset.itemId;

    if (!itemId) return;

    let item = this.actor.items.get(itemId);
    if (item) {
      let updateData = {};

      if (item.type == "power") {
        let tier = dataset.tier ?? null;
        if (!tier) return;
        let isActive = item.system.feats[tier].isActive.value;
        updateData[`system.feats.${tier}.isActive.value`] = !isActive;
      }
      else if (item.type == "equipment") {
        let isActive = item.system.isActive;
        updateData["system.isActive"] = !isActive;
      }

      await item.update(updateData, {});
    }
  }

  /**
   * Handle rests.
   */
   _onRest(event) {
    event.preventDefault;
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.restType ?? null;

    // Exit if type is invalid;
    if (type !== 'quick' && type !== 'full') return;

    // Determine if we need to skip confirmation.
    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      if (type == 'quick') this.actor.restQuick();
      else if (type == 'full') this.actor.restFull();
    }
    // Otherwise, we need to make a dialog.
    else {
      let options = {
        title: null,
        confirmLabel: 'ARCHMAGE.CHAT.Rest',
        cancelLabel: 'ARCHMAGE.CHAT.Cancel',
        default: 'rest',
      };

      if (type == 'quick') {
        options.title = 'ARCHMAGE.CHAT.QuickRest';
        options.content = 'ARCHMAGE.CHAT.QuickRestBody';
      }
      else if (type == 'full') {
        options.title = 'ARCHMAGE.CHAT.FullHeal';
        options.content = 'ARCHMAGE.CHAT.FullHealBody';
      }

      // Render the rest dialog.
      let doRest = false;
      new Dialog({
        title: game.i18n.localize(options.title),
        content: game.i18n.localize(options.content),
        buttons: {
          rest: {
            label: game.i18n.localize(options.confirmLabel),
            callback: () => {doRest = true;}
          },
          cancel: {
            label: game.i18n.localize(options.cancelLabel),
            callback: () => {}
          }
        },
        default: 'rest',
        close: html => {
          if (doRest) {
            if (type == 'quick') this.actor.restQuick();
            else if (type == 'full') this.actor.restFull();
          }
        }
      }).render(true);
    }
  }

  /**
   * Apply drag events to items (powers and equipment).
   * @param {jQuery} html
   */
  _dragHandler(html) {
    // Vue owns the rows inside this form and recreates them whenever the
    // context is refreshed, so per-element listeners would only cover the rows
    // that happened to exist the one time this ran. Delegate from the form
    // instead so rows added later (new powers, new equipment) are draggable.
    const form = html instanceof jQuery ? html[0] : html;
    if (!form || form.dataset.archmageDragBound === 'true') return;
    form.dataset.archmageDragBound = 'true';
    form.addEventListener('dragstart', event => {
      if (!event.target.closest('.item[data-draggable="true"]')) return;
      this._onDragStart(event);
    }, false);
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    // Resolve the row being dragged. This is delegated from the form, so
    // event.currentTarget is not the row itself.
    const li = event.target.closest?.('.item[data-draggable="true"]') ?? event.currentTarget;
    if (!li) return;
    if (event.target.dataset && "link" in event.target.dataset) return;

    let dragData = null;

    // Active Effect
    if (li.dataset.documentClass === 'ActiveEffect') {
      if (li.dataset.effectId) {
        const effect = this.actor.effects.get(li.dataset.effectId);
        dragData = effect.toDragData();
      }
    }
    // Treat a row that carries an item id as an Item even if the markup forgot
    // to declare the document class - without drag data the drop is a silent
    // no-op, which is a very confusing way for a missing attribute to fail.
    else if (li.dataset.itemId) {
      const item = this.actor.items.get(li.dataset.itemId);
      if (item) dragData = item.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Sort items on drop.
   *
   * Overrides ActorSheet._onSortItem(), delegating to the shared helper.
   * See sortItemDrop() for why the drop target resolution differs from core.
   *
   * @param {DragEvent} event   The drop event.
   * @param {object} itemData   Dropped item data.
   * @protected
   */
  _onSortItem(event, itemData) {
    return sortItemDrop(this.actor, event, itemData);
  }

  /** @override */
  async _onDropActiveEffect(event, data) {
    // Run core's effect operations.
    await super._onDropActiveEffect(event, data);

    // Handle item sorting within the same Actor
    const effect = await ActiveEffect.implementation.fromDropData(data);
    const effectData = effect.toObject();
    if ( this.actor.uuid === effect.parent?.uuid ) return this._onSortEffect(event, effectData);
  }

  /**
   * Sort effects on drop. Adapted from ActorSheet._onSortItem().
   * @param {Event} event
   * @param {Object} effectData
   * @private
   */
  _onSortEffect(event, effectData) {

    // Get the drag source and drop target
    const effects = this.actor.effects;
    const source = effects.get(effectData._id);
    const dropTarget = event.target.closest("[data-effect-id]");
    if ( !dropTarget ) return;
    const target = effects.get(dropTarget.dataset.effectId);

    // Don't sort on yourself
    if ( source.id === target.id ) return;

    // Identify sibling effects based on adjacent HTML elements
    const siblings = [];
    for ( let el of dropTarget.parentElement.children ) {
      const siblingId = el.dataset.effectId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(effects.get(el.dataset.effectId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(source, {target, siblings});
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments("ActiveEffect", updateData);
  }

  _onFocus(event) {
    let target = event.currentTarget;
    setTimeout(function() {
      if (target == document.activeElement) {
        $(target).trigger('select');
      }
    }, 100);
  }

  /* ------------------------------------------------------------------------ */
  /*  Import Powers --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  async _importPowers(event) {
    const characterRace = this.actor.system.details.race.value;
    const characterClasses = this.actor.system.details.detectedClasses ?? [];
    const prepop = new ArchmagePrepopulate();
    const importData = await prepop.getImportData(characterClasses, characterRace, this.actor);
    if (!importData?.packs?.length) {
      return;
    }
    new ArchmagePowerImporterApplication({actor: this.actor, importData: importData}).render(true);
  }
}
