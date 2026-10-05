import VueRenderingMixin, { DOCUMENT_PROVIDE_KEYS } from '../item/_vue-application-mixin.mjs';
import { buildSheetContext } from '../actor/helpers/actor-helpers-v2.js';
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
  documentProvideKey = DOCUMENT_PROVIDE_KEYS.actorDocument;

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
    super(Object.assign({
      id: `archmage-character-settings-${actor?.id ?? foundry.utils.randomID()}`,
      actor
    }, options));
    this.actor = actor;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['archmage-appv2', 'dialog-form', 'character-settings', 'standard-form', 'themed'],
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

  /**
   * Resolve the theme class for the settings window: mirror the theme Foundry
   * assigned to the actor's sheet window, so the settings open in the same
   * color scheme as the sheet that spawned them.
   *
   * Core's DocumentSheetV2 pushes `themed theme-{scheme}` onto the sheet's
   * window classes from the per-sheet color scheme preference, so the sheet
   * element is the ground truth. Fall back to the body class, which core
   * derives from the Applications color scheme, so the window still tracks
   * the user's preference when the sheet itself carries no theme class.
   *
   * @param {Actor} actor   The actor whose sheet theme to read
   * @returns {string}      "theme-light", "theme-dark", or "" if nothing matched
   */
  static themeForActor(actor) {
    const match = el => [...(el?.classList ?? [])].find(c => c === 'theme-light' || c === 'theme-dark') ?? '';
    return match(actor?.sheet?.element) || match(document.body);
  }

  /**
   * Add the resolved theme class to the window classes, alongside the `themed`
   * flag from DEFAULT_OPTIONS. Core does the same in DocumentSheetV2 for
   * document sheets; without it, a `themed` window never receives the
   * theme-light/theme-dark variable sets.
   *
   * @override
   */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    const theme = this.constructor.themeForActor(options.actor);
    if (theme) options.classes.push(theme);
    return options;
  }

  /** The actor must be in a world (not a compendium pack) to be editable. */
  get isEditable() {
    return this.actor.isOwner;
  }

  /**
   * Prepare the context for the Vue component. Uses the same shared sheet
   * context builder as the actor sheets (plain actor object, flattened
   * overrides, locked fields), so the field bindings port over unchanged.
   *
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    Object.assign(context, buildSheetContext(this.actor, {
      editable: this.isEditable
    }));

    // Add tabs.
    context.tabs = this.constructor.buildTabs();

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
