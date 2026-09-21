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

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['archmage-appv2', 'archmage-v3', 'actor', 'character-sheet'],
    position: { width: 960, height: 960 },
    window: { resizable: true },
    tag: 'form',
    form: {
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    },
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
   * Bind the portrait context menu once.
   *
   * _onRender fires after every context update (every save) while the Vue DOM
   * persists, so binding unguarded would stack a listener per save.
   *
   * @override
   */
  _onRender(context, options) {
    super._onRender(context, options);
    if (this._portraitMenuEl !== this.element) {
      this._portraitMenuEl = this.element;
      ActorHelpersV2._activatePortraitArtContextMenu(this, this.element);
    }
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
