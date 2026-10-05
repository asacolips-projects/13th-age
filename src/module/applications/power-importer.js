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
  /** @override */
  constructor(options = {}) {
    super(options);

    this.actor = options.actor;
    this.importData = options.importData;

    this.vueApp = null;
    this.vueRoot = null;
    this.vueComponents = {
      "power-importer": ArchmagePowerImporter
    };
  }

  /** @override */
  static get defaultOptions() {
    const nightMode = game.settings.get("archmage", "nightmode");
    const options = { ...super.defaultOptions,
      classes: [
        "form",
        "archmage-v2",
        "archmage-dialog",
        "archmage-power-importer"
      ],
      popOut: true,
      template: "systems/archmage/templates/dialog/power-importer.html",
      title: game.i18n.localize("ARCHMAGE.import"),
      width: 1080,
      height: 900,
      resizable: true
    };

    if (nightMode) {
      options.classes.push("nightmode");
    }

    return options;
  }

  /** @override */
  get id() {
    // One importer per actor, rather than one for the whole world.
    return `archmage-power-importer-${this.actor?.id ?? "unowned"}`;
  }

  /** @override */
  async getData() {
    return {
      tabs: this.importData.tabs,
      packs: this.importData.packs,
      defaultTab: this.importData.defaultTab,
      // Powers are previewed unowned, so there's no roll data to resolve
      // formulas against. They render the same way the item sheet's preview does.
      rollData: {},
      onImport: (ids) => this._onImport(ids),
      onTogglePack: (id, enabled) => this._onTogglePack(id, enabled),
      onToggleSource: (id, tabKey, listed) => this._onToggleSource(id, tabKey, listed),
      onCancel: () => this.close()
    };
  }

  /**
   * Create the selected powers on the actor and close.
   *
   * Ticked children of a ticked power come along with it through the item's
   * own creation workflow, which is told which children were unticked. A
   * ticked child of an unticked power is imported on its own.
   *
   * @param {string[]} keys Keys of the rows to import.
   */
  async _onImport(keys) {
    if (keys.length && this.actor) {
      const selected = new Set(keys);
      // Top-level imports by UUID, so that a power listed twice is imported once.
      const imports = new Map();
      const walk = (row, root) => {
        const isSelected = selected.has(row.key);
        // Already imported from another tab, children and all.
        if (isSelected && !root && imports.has(row.uuid)) return;
        if (isSelected && !root) {
          const data = game.items.fromCompendium(this.importData.docs.get(row.uuid));
          foundry.utils.setProperty(data, "flags.archmage.excludeChildren", []);
          imports.set(row.uuid, data);
          root = row;
        }
        else if (!isSelected && root) {
          // The path of child UUIDs below the top-level import.
          imports.get(root.uuid).flags.archmage.excludeChildren.push(row.key.slice(root.key.length + 1));
          root = null;
        }
        for (const child of row.children) walk(child, isSelected ? root : null);
      };
      for (const row of this.#rows()) walk(row, null);
      await this.actor.createEmbeddedDocuments("Item", [...imports.values()]);
    }
    return this.close();
  }

  /**
   * Add or remove a compendium's powers on the "other" tab.
   *
   * @param {string} id Collection ID of the compendium.
   * @param {boolean} enabled Whether its powers should be listed there.
   * @returns {Promise<object[]>} The rebuilt tabs.
   */
  async _onTogglePack(id, enabled) {
    await new ArchmagePrepopulate().setPackEnabled(this.importData, id, enabled);
    return this.importData.tabs;
  }

  /**
   * Add or remove a compendium's powers on one of the character's tabs.
   *
   * @param {string} id Collection ID of the compendium.
   * @param {string} tabKey The tab it's ticked or unticked on.
   * @param {boolean} listed Whether its powers should be listed there.
   * @returns {Promise<object[]>} The rebuilt tabs.
   */
  async _onToggleSource(id, tabKey, listed) {
    await new ArchmagePrepopulate().setPackListed(this.importData, id, tabKey, listed);
    return this.importData.tabs;
  }

  /**
   * Every top-level row, across all tabs.
   *
   * @returns {object[]}
   */
  #rows() {
    return this.importData.tabs
      .flatMap((tab) => tab.sections)
      .flatMap((section) => section.powerGroups)
      .flatMap((group) => group.levels)
      .flatMap((level) => level.groups)
      .flatMap((group) => group.powers);
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  async render(force = false, options = {}) {
    const context = await this.getData();

    // The app is only ever created once. Changes to the importer's contents,
    // from its compendium settings, come back to it from _onTogglePack().
    if (!this.vueApp) {
      this.vueApp = createApp({
        data() {
          return {
            context: context
          };
        },
        components: this.vueComponents
      });
    }

    await this._render(force, options).catch((err) => {
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
