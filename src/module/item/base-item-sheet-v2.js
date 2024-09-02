export class ArchmageBaseItemSheetV2 extends foundry.applications.sheets.ItemSheetV2 {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    // classes: ["archmage", "item"],
    actions: {
      onEditImage: this._onEditImage,
      edit: this._viewEffect,
      create: this._createEffect,
      delete: this._deleteEffect,
      toggle: this._toggleEffect,
      showItemArtwork: this.#onShowItemArtwork,
      importFromCompendium: this.#onImportFromCompendium,
      parseInlineRolls: this.#onParseInlineRolls,
    },
    form: {
      submitOnChange: true
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }]
  };

  /* -------------------------------------------- */

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    if (options.document.compendium) {
      const hasOption = options.window.controls.find(o => o.action === 'importFromCompendium');
      if (!hasOption) {
        options.window.controls.push({
          action: "importFromCompendium",
          icon: "fa-solid fa-download",
          label: "Import",
        });
      }
    }
    return options;
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
    console.log('onRender', this.element);
    this.element.addEventListener('paste', '.prose-mirror-wrapper .editor-content', (event) => this.parsePastedContent(event));
  }

  parsePastedContent(event) {
    console.log('event', event);
    if (game.settings.get('archmage', 'allowPasteParsing')) {
      event.preventDefault();
      const target = event.target;
      const prosemirror = target.closest('prose-mirror');
      const options = {
        field: prosemirror.name,
      };
      // Retrieve the value from the field and the clipboard.
      const oldValue = target.innerHTML ?? '';
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      const result = game.archmage.ArchmageUtility.parseClipboardText(paste, options);
      let newValue = result;

      // Handle selections.
      const selection = window.getSelection();
      let startRange = target.selectionStart ?? oldValue.length;
      let endRange = target.selectionEnd ?? startRange;
      // If there's a selection, replace it.
      if (selection.rangeCount) {
        newValue = `${oldValue.slice(0, startRange)}${result}${oldValue.slice(endRange)}`;
        startRange += result.length;
      }
      // Otherwise, append it.
      else {
        newValue = `${oldValue}${result}`;
      }

      // Update field contents.
      target.innerHTML = newValue;

      // Update cursor position.
      if (startRange) {
        target.focus();
        target.setSelectionRange(startRange, startRange);
      }
    }
  }

  /** ************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   * 
   * @this ArchmageBaseItemSheetV2
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    if (!this.isEditable) return false;
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: path => {
        target.src = path;
        this.document.update({[attr]: path});
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this ArchmageBaseItemSheetV2
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewEffect(event, target) {
    const effect = this._getEffect(target);
    effect.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this ArchmageBaseItemSheetV2
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteEffect(event, target) {
    if (!this.isEditable) return;
    const effect = this._getEffect(target);
    await effect.delete();
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this ArchmageBaseItemSheetV2
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createEffect(event, target) {
    if (!this.isEditable) return;
    // Retrieve the configured document class for ActiveEffect
    const aeCls = getDocumentClass("ActiveEffect");
    // Prepare the document creation data by initializing it a default name.
    // As of v12, you can define custom Active Effect subtypes just like Item subtypes if you want
    const effectData = {
      img: this.document.img || 'icons/svg/aura.svg',
      origin: this.document.uuid,
      name: aeCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.item
      })
    };
    // Loop through the dataset and add it to our effectData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (["action", "documentClass"].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(effectData, dataKey, value);
    }

    // Finally, create the embedded document!
    await aeCls.create(effectData, { parent: this.item });
    this.render(true);
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this ArchmageBaseItemSheetV2
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    if (!this.isEditable) return;
    const effect = this._getEffect(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /** Helper Functions */

  /**
   * Fetches the row with the data for the rendered embedded document
   *
   * @param {HTMLElement} target  The element with the action
   * @returns {HTMLLIElement} The document's row
   */
  _getEffect(target) {
    const li = target.closest(".effect");
    return this.item.effects.get(li?.dataset?.effectId);
  }

  /**
   *
   * DragDrop
   *
   */

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ("link" in event.target.dataset) return;

    let dragData = null;

    // Active Effect
    if (li.dataset.effectId) {
      const effect = this.item.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @returns {Promise|void} A promise of the thing that was dropped, or void if disallowed.
   * @protected
   */
  async _onDrop(event) {
    if (!this.isEditable) return;
    const data = TextEditor.getDragEventData(event);
    const item = this.item;
    const allowed = Hooks.call("dropItemSheetData", item, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    if (!this.isEditable) return false;
    const aeCls = getDocumentClass("ActiveEffect");
    const effect = await aeCls.fromDropData(data);
    if (!this.item.isOwner || !effect) return false;

    if (this.item.uuid === effect.parent?.uuid) return this._onEffectSort(event, effect);
    return aeCls.create(effect, { parent: this.item });
  }

  /**
   * Sorts an Active Effect based on its surrounding attributes
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   * @returns {Promise|void} Promise for the update applied, or void.
   */
  _onEffectSort(event, effect) {
    if (!this.isEditable) return;
    const effects = this.item.effects;
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = effects.get(dropTarget.dataset.effectId);

    // Don't sort on yourself
    if (effect.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && siblingId !== effect.id) siblings.push(effects.get(el.dataset.effectId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.isEditable) return false;
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.isEditable) return false;
    if (!this.item.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.isEditable) return [];
    if (!this.item.isOwner) return [];
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      };
      return new DragDrop(d);
    });
  }

  /**
   * Handle header control button clicks to display actor portrait artwork.
   * @this {ArchmageBaseItemSheetV2}
   * @param {PointerEvent} event
   */
  static #onShowItemArtwork(event) {
    const {img, name, uuid} = this.document;
    new ImagePopout(img, {title: name, uuid: uuid}).render(true);
  }

  /**
   * Handle header control button clicks to import compendium documents.
   * @this {ArchmageBaseItemSheetV2}
   * @param {PointerEvent} event
   */
  static async #onImportFromCompendium(event) {
    await this.close();
    this.document.collection.importFromCompendium(this.document.compendium, this.document.id);
  }

  /**
   * Attempt to parse inline rolls on the sheet.
   * 
   * @this {ArchmageBaseItemSheetV2}
   * @param {PointerEvent} event 
   */
  static async #onParseInlineRolls(event) {
    const frame = event.target.closest('.archmage-appv2');
    if (!frame || !this.isEditable) return;

    // Find all text inputs and textarea inputs.
    const fieldElements = frame.querySelectorAll('input[type="text"],textarea');
    if (!fieldElements) return;

    // Exclude certain fields, like macros.
    const excludeList = ['system.embeddedMacro.value'];
    let hasChanges = false;

    // Iterate through the elements and run the parser on them, if necessary.
    for (let element of fieldElements) {
      const { name, value } = element;
      // Skip in certain conditions.
      if (excludeList.includes(name)) continue;
      if (value.includes('[[') || value.includes(']]')) continue;
      // Run the parser and update the values.
      const options = { field: name };
      const result = game.archmage.ArchmageUtility.parseClipboardText(value, options);
      if (result !== value) {
        element.value = result;
        hasChanges = true;
      }
    }

    // Trigger a form submit.
    await this.submit();
  }
}
