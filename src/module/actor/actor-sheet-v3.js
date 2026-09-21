import VueRenderingMixin from '../item/_vue-application-mixin.mjs';
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
    }
  };

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
