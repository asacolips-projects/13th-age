// Import Vue dependencies.
import { createApp } from "../../scripts/lib/vue.esm-browser.js";
import { ArchmagePowerImporter } from "../../vue/components.vue.es.js";
import { ArchmagePrepopulate } from "../setup/archmage-prepopulate.js";

/**
 * Application class for the power importer.
 *
 * Renders compendium powers with the same components the character sheet uses,
 * so that what a player picks here looks like what they end up with.
 *
 * @export
 * @class ArchmagePowerImporterApplication
 * @extends {Application}
 */
export class ArchmagePowerImporterApplication extends Application {
  /**
   * Gather the import data for an actor and open the importer, mirroring the
   * v2 sheet's _importPowers flow. Static so the Vue sheet can call it through
   * game.archmage without the vue bundle importing module internals.
   *
   * @param {Actor} actor   The character actor to import powers onto.
   * @returns {Promise<Application>|undefined}
   */
  static async open(actor) {
    if (!actor || actor.pack) return;
    const characterRace = actor.system.details.race.value;
    const characterClasses = actor.system.details.detectedClasses ?? [];
    const importData = await new ArchmagePrepopulate().getImportData(characterClasses, characterRace, actor);
    if (!importData?.tabs?.length) return;
    return new ArchmagePowerImporterApplication({actor, importData}).render(true);
  }

  /** @override */
  constructor(options = {}) {
    super(options);

    this.actor = options.actor;
    this.importData = options.importData;

    this.vueApp = null;
    this.vueRoot = null;
    this.vueComponents = {
      'power-importer': ArchmagePowerImporter
    };
  }

  /** @override */
  static get defaultOptions() {
    const nightMode = game.settings.get("archmage", "nightmode");
    const options = {...super.defaultOptions,
      classes: [
        'form',
        'archmage-v2',
        'archmage-dialog',
        'archmage-power-importer'
      ],
      popOut: true,
      template: "systems/archmage/templates/dialog/power-importer.html",
      title: game.i18n.localize('ARCHMAGE.import'),
      width: 1080,
      height: 900,
      resizable: true,
    };

    if (nightMode) {
      options.classes.push('nightmode');
    }

    return options;
  }

  /** @override */
  get id() {
    // One importer per actor, rather than one for the whole world.
    return `archmage-power-importer-${this.actor?.id ?? 'unowned'}`;
  }

  /** @override */
  async getData() {
    return {
      tabs: this.importData.tabs,
      defaultTab: this.importData.defaultTab,
      // Powers are previewed unowned, so there's no roll data to resolve
      // formulas against. They render the same way the item sheet's preview does.
      rollData: {},
      onImport: (ids) => this._onImport(ids),
      onCancel: () => this.close(),
    };
  }

  /**
   * Create the selected powers on the actor and close.
   *
   * @param {string[]} ids Ids of the compendium powers to import.
   */
  async _onImport(ids) {
    if (ids.length && this.actor) {
      const powers = this.importData.powers
        .filter(power => ids.includes(power.id))
        .map(power => power.toObject());
      await this.actor.createEmbeddedDocuments('Item', powers);
    }
    return this.close();
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  async render(force = false, options = {}) {
    const context = await this.getData();

    // The importer's contents are fixed for as long as it's open, so the app is
    // only ever created once.
    if (!this.vueApp) {
      this.vueApp = createApp({
        data() {
          return {
            context: context,
          }
        },
        components: this.vueComponents,
      });
    }

    await this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    });

    // Mount our rendered app.
    const selector = `[data-appid="${this.appId}"] .archmage-vue`;
    if (!this.vueRoot && document.querySelector(selector)) {
      this.vueRoot = this.vueApp.mount(selector);
    }

    return this;
  }

  /** @override */
  async close(options = {}) {
    const result = await super.close(options);
    // Unmount and clean up the vue app on close.
    this.vueApp?.unmount();
    this.vueApp = null;
    this.vueRoot = null;
    return result;
  }
}
