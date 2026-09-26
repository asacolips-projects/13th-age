import VueRenderingMixin from '../item/_vue-application-mixin.mjs';
import { ArchmageCharacterSettings } from '../../vue/components.vue.es.js';

/**
 * Character settings window for the V3 sheet: an ApplicationV2 form hosting
 * the per-character settings that used to live in the V2 sheet's settings tab,
 * organized into tabs and group boxes (see ArchmageCharacterSettings.vue).
 *
 * The Vue component renders named inputs; submission flows through the V2
 * form pipeline (submitOnChange) into the actor document.
 */
export class ArchmageCharacterSettingsApp extends VueRenderingMixin(
  foundry.applications.api.ApplicationV2
) {
  /** Injection key used to provide the actor document to the Vue app. */
  documentProvideKey = 'actorDocument';

  /** Vue root for the settings window. */
  vueParts = {
    'archmage-character-settings': {
      component: ArchmageCharacterSettings,
      template: `<archmage-character-settings :context="context">Failed to render Vue component.</archmage-character-settings>`
    }
  };

  /**
   * Open the settings window for an actor, or focus it if already open.
   * Core's instances registry is keyed by our per-actor window id.
   *
   * @param {Actor} actor   The character actor to configure
   * @returns {Promise<ArchmageCharacterSettingsApp>|undefined}
   */
  static show(actor) {
    if (!actor || actor.pack) return;
    const id = `archmage-character-settings-${actor.id}`;
    const existing = foundry.applications.instances.get(id);
    if (existing) return existing.render({ force: true });
    return new this(actor).render({ force: true });
  }

  /**
   * @param {Actor} actor               The character actor to configure
   * @param {Partial<ApplicationConfiguration>} [options]
   */
  constructor(actor, options = {}) {
    super(Object.assign({ id: `archmage-character-settings-${actor?.id ?? foundry.utils.randomID()}` }, options));
    this.actor = actor;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['archmage-appv2', 'dialog-form', 'character-settings', 'standard-form'],
    position: { width: 560, height: 680 },
    window: {
      title: 'ARCHMAGE.CHARACTERSETTINGS.settings',
      resizable: true
    },
    tag: 'form',
    form: {
      handler: this._onFormSubmit,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    }
  };

  /** Tab strip config for the Vue Tabs/Tab parts, built like the power sheet. */
  static buildTabs() {
    const localize = path => game.i18n.localize(`ARCHMAGE.CHARACTERSETTINGS.tabs.${path}`);
    return {
      primary: {
        core: { key: 'core', label: localize('core'), active: true },
        weapons: { key: 'weapons', label: localize('weapons'), active: false },
        flags: { key: 'flags', label: localize('flags'), active: false },
        resources: { key: 'resources', label: localize('resources'), active: false },
        hooks: { key: 'hooks', label: localize('hooks'), active: false }
      }
    };
  }

  /** The actor must be in a world (not a compendium pack) to be editable. */
  get isEditable() {
    return this.actor.isOwner;
  }

  /**
   * Prepare the context for the Vue component. Mirrors the actor data shape
   * the V3 sheet provides (plain actor object, flattened overrides), so the
   * field bindings port over unchanged.
   *
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const actorData = actor.toObject(false);

    context.owner = actor.isOwner;
    context.editable = this.isEditable;
    context.actor = actorData;
    context.actor._source = foundry.utils.deepClone(actor._source);
    context.actor.overrides = foundry.utils.flattenObject(actor.overrides);

    // Add tabs.
    context.tabs = this.constructor.buildTabs();

    // Locked fields from active effects, used to disable overridden inputs.
    context.actor.lockedFields = [];
    actor.effects.forEach(ae => {
      context.actor.lockedFields = context.actor.lockedFields.concat(ae.changes.map(c => c.key));
    });

    return context;
  }

  /**
   * Form submission handler: expand the flat dotted-key form data and update
   * the actor. Checkbox and select fields are read straight from the DOM, so
   * unchecked boxes persist correctly.
   *
   * @this ArchmageCharacterSettingsApp
   * @param {SubmitEvent} event          The originating form submission event
   * @param {HTMLFormElement} form       The form element that was submitted
   * @param {FormDataExtended} formData  Processed data for the submitted form
   * @returns {Promise}
   */
  static async _onFormSubmit(event, form, formData) {
    if (!this.isEditable) return;
    const submitData = foundry.utils.expandObject(formData.object);
    await this.actor.update(submitData);
  }
}
