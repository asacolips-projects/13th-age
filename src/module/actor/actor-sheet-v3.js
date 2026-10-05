import VueRenderingMixin, { DOCUMENT_PROVIDE_KEYS } from '../item/_vue-application-mixin.mjs';
import { pickImage, createDragDropHandlers } from '../helpers/sheet-helpers.mjs';
import { ActorHelpersV2, buildSheetContext, sortItemDrop } from './helpers/actor-helpers-v2.js';
import { parentNamesById } from '../item/item-relations.mjs';
import { ArchmageCharacterSheetV3 } from '../../vue/components.vue.es.js';

export class ActorArchmageSheetV3 extends VueRenderingMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  /** Injection key used to provide the actor document to the Vue app. */
  documentProvideKey = DOCUMENT_PROVIDE_KEYS.actorDocument;

  /** Vue root for the sheet. */
  vueParts = {
    'archmage-character-sheet-v3': {
      component: ArchmageCharacterSheetV3,
      template: `<archmage-character-sheet-v3 :context="context">Failed to render Vue component.</archmage-character-sheet-v3>`
    }
  };

  constructor(options = {}) {
    super(options);
    this.#dragDrop = createDragDropHandlers(this);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['archmage-v3', 'actor', 'character-sheet'],
    position: { width: 925, height: 800 },
    window: { resizable: true },
    tag: 'form',
    form: {
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    },
    // Item rows are Vue-rendered with data-draggable="true"; core's own
    // DragDrop instance (selector ".draggable") would never match them, and
    // the mixin's _onRender doesn't chain to core's anyway. Wire our own so
    // dragstart carries the document payload and drops reach _onDrop.
    dragDrop: [{ dragSelector: '[data-draggable="true"]', dropSelector: null }],
    actions: {
      onEditImage: this._onEditImage
    }
  };

  /**
   * Handle changing the actor's image, e.g. via the FilePicker.
   *
   * Adapted from the item sheet's handler (base-item-sheet-v2.js); the update
   * flows back through _prepareContext, so the Vue header refreshes on its own.
   * The shared implementation lives in the sheet helpers module.
   *
   * @this ActorArchmageSheetV3
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    return pickImage(this, event, target);
  }

  /**
   * Bind the portrait context menu once, and rebind drag-drop handling.
   *
   * _onRender fires after every context update (every save) while the Vue DOM
   * persists, so the portrait menu binding is guarded to avoid stacking a
   * listener per save. The DragDrop rebind is safe to repeat: DragDrop.bind
   * assigns on* properties rather than adding listeners, and re-resolves the
   * draggable rows, which Vue may have recreated since the last render.
   *
   * @override
   */
  _onRender(context, options) {
    super._onRender(context, options);
    this.#dragDrop.forEach(d => d.bind(this.element));
    if (this._portraitMenuEl !== this.element) {
      this._portraitMenuEl = this.element;
      ActorHelpersV2._activatePortraitArtContextMenu(this, this.element);
    }
  }

  /* -------------------------------------------- */
  /*  Drag and drop                               */
  /* -------------------------------------------- */

  /** DragDrop controllers backing the dragDrop option. */
  #dragDrop;

  /**
   * Sort items on drop.
   *
   * Overrides ActorSheetV2._onSortItem(), delegating to the shared helper.
   * See sortItemDrop() for why the drop target resolution differs from core.
   *
   * @param {DragEvent} event   The drop event.
   * @param {Item} item   The dropped item document.
   * @protected
   */
  _onSortItem(event, item) {
    return sortItemDrop(this.actor, event, item);
  }

  /**
   * Prepare the context passed into the Vue application.
   *
   * Ported nearly verbatim from the V1-API sheet's getData() (actor-sheet-v2.js),
   * minus the AppV1-isms (appId, options) and isNPC, so future tab components
   * can consume the same context contract. The shared fields come from the
   * common buildSheetContext helper.
   *
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Shared sheet context plus this sheet's own fields.
    Object.assign(context, buildSheetContext(this.actor, {
      editable: this.isEditable,
      _renderKey: this._renderKey
    }));

    // Mark the items that came along with another one.
    const parentNames = parentNamesById(this.actor);
    for (const item of context.actor.items) {
      if (parentNames.has(item._id)) item.grantedBy = parentNames.get(item._id).join(', ');
    }

    return context;
  }
}
