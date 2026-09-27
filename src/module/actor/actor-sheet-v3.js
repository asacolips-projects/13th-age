import VueRenderingMixin from '../item/_vue-application-mixin.mjs';
import { ActorHelpersV2 } from './helpers/actor-helpers-v2.js';
import { ArchmageCharacterSheetV3 } from '../../vue/components.vue.es.js';

export class ActorArchmageSheetV3 extends VueRenderingMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  /** Injection key used to provide the actor document to the Vue app. */
  documentProvideKey = 'actorDocument';

  /** Vue root for the sheet. */
  vueParts = {
    'archmage-character-sheet-v3': {
      component: ArchmageCharacterSheetV3,
      template: `<archmage-character-sheet-v3 :context="context">Failed to render Vue component.</archmage-character-sheet-v3>`
    }
  };

  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
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
   *
   * @this ActorArchmageSheetV3
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
    const fp = new foundry.applications.apps.FilePicker.implementation({
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
   * Build DragDrop controllers for the sheet's dragDrop option, wiring the
   * core ActorSheetV2 permission and callback hooks. Same pattern as the
   * base item sheet v2.
   *
   * @returns {DragDrop[]}
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map(d => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      };
      return new foundry.applications.ux.DragDrop.implementation(d);
    });
  }

  /**
   * Sort items on drop.
   *
   * Overrides ActorSheetV2._onSortItem(). Core resolves the drop target with
   * `event.target.closest('[data-item-id]')`, which is unsafe here: several
   * elements *inside* an item row also carry `data-item-id` (the uses/quantity
   * counter, the feat pips, the edit and delete controls). When the cursor was
   * over any of those, core resolved the drop target to that inner element and
   * then scanned `dropTarget.parentElement.children` for siblings, collecting
   * the row's own inner elements instead of the neighbouring rows. The
   * resulting sort value was computed against a bogus sibling list, which
   * makes drops do nothing or land in the wrong place.
   *
   * Ported from the v2 sheet's override of the same method.
   *
   * @param {DragEvent} event   The drop event.
   * @param {Item} item   The dropped item document.
   * @protected
   */
  _onSortItem(event, item) {
    const items = this.actor.items;
    const source = items.get(item.id);
    if (!source) return;

    // Always resolve the drop target to the item row, never a descendant.
    const dropTarget = event.target.closest('.item[data-item-id]');
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);
    if (!target || source.id === target.id) return;

    // Work out whether the drop crossed into another group. The rendered lists
    // are the groups, so ask the destination list whether it holds the source
    // row rather than trying to re-derive the grouping from item data. Scoping
    // the lookup to that list also keeps it correct for items that appear in
    // more than one list (a power with a trigger shows up on both tabs).
    const crossGroup = !dropTarget.parentElement
      .querySelector(`:scope > .item[data-item-id="${source.id}"]`);
    const groupBy = this.actor.getFlag('archmage', 'sheetDisplay.powers.groupBy.value') ?? 'powerType';

    // A drop into another group is only meaningful for custom power groups,
    // where the group is free text stored on the power. Under the built-in
    // groupings the group is derived from the power's own data, so the row
    // would snap straight back to where it started with a new and meaningless
    // sort value - which read as "nothing moved". Ignore those drops instead.
    const regroup = crossGroup && source.type === 'power' && target.type === 'power' && groupBy === 'group';
    if (crossGroup && !regroup) return;

    // Identify sibling rows from the list the drop target lives in, skipping
    // anything that isn't itself an item row.
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      if (!el.matches('.item[data-item-id]')) continue;
      const siblingId = el.dataset.itemId;
      if (!siblingId || siblingId === source.id) continue;
      const sibling = items.get(siblingId);
      if (sibling) siblings.push(sibling);
    }

    // Drop into the half of the row the cursor is actually over so the item
    // lands where it was released, rather than always above the target.
    // Measure against the summary line rather than the whole row: an expanded
    // row is mostly detail content, which would push the midpoint far off
    // screen.
    const rect = (dropTarget.firstElementChild ?? dropTarget).getBoundingClientRect();
    const sortBefore = (event.clientY - rect.top) < (rect.height / 2);

    // Perform the sort.
    const sortUpdates = foundry.utils.performIntegerSort(source, {target, siblings, sortBefore});
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Adopt the destination group. The target row already lives there, so its
    // own group value is the label to copy.
    if (regroup) {
      const sourceUpdate = updateData.find(u => u._id === source.id);
      if (sourceUpdate) sourceUpdate['system.group.value'] = target.system.group?.value ?? '';
    }

    return this.actor.updateEmbeddedDocuments('Item', updateData);
  }

  /**
   * Prepare the context passed into the Vue application.
   *
   * Ported nearly verbatim from the V1-API sheet's getData() (actor-sheet-v2.js),
   * minus the AppV1-isms (appId, options) and isNPC, so future tab components
   * can consume the same context contract.
   *
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Basic data.
    let isOwner = this.actor.isOwner;
    context.owner = isOwner;
    context.limited = this.actor.limited;
    context.editable = this.isEditable;
    context.cssClass = isOwner ? "editable" : "locked";
    context.isCharacter = this.actor.type === "character";
    context.config = CONFIG.ARCHMAGE;
    context.rollData = this.actor.getRollData(this.actor);
    context._renderKey = this._renderKey;

    // Convert the actor data into a more usable version.
    let actorData = this.actor.toObject(false);

    // Get drag data for later retrieval.
    const dragData = this.actor.toDragData();
    if (dragData.uuid.includes('Token.') && dragData.type !== 'Token') {
      dragData.type = 'Token';
    }

    context.dragData = dragData;

    // Add to our data object that the sheet will use.
    context.actor = actorData;
    context.data = actorData.system;
    context.actor.owner = context.owner;
    context.actor._source = foundry.utils.deepClone(this.actor._source);
    context.actor.overrides = foundry.utils.flattenObject(this.actor.overrides);
    context.actor.dragData = context.dragData;

    // Add token info if needed.
    if (this.actor?.token?.id) {
      if (!this.actor.token.actorLink && this.actor?.token?.id) {
        context.actor.prototypeToken.id = this.actor.prototypeToken.id;
        context.actor.prototypeToken.sceneId = this.actor.prototypeToken?.parent?.id;
      }
    }

    // Add pack info if needed.
    if (this.actor?.pack) {
      context.actor.pack = this.actor.pack;
    }

    // Sort items.
    context.actor.items = actorData.items;
    context.actor.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Sort effects.
    context.actor.effects = actorData.effects;
    context.actor.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Retrieve a list of locked fields due to AEs.
    context.actor.lockedFields = [];
    this.actor.effects.forEach(ae => {
      const changes = ae.changes.map(c => c.key);
      context.actor.lockedFields = context.actor.lockedFields.concat(changes);
    });

    return context;
  }
}
