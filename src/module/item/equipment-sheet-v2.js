import { ArchmageBaseItemSheetV2 } from "./base-item-sheet-v2.js";
import { wrapRolls } from "./_item-sheet-helpers.mjs";

import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { ArchmageEquipmentSheetVue } from "../../vue/components.vue.es.js";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class ArchmageEquipmentSheetV2 extends VueRenderingMixin(ArchmageBaseItemSheetV2) {
  vueParts = {
    'archmage-equipment-sheet-vue': {
      component: ArchmageEquipmentSheetVue,
      template: `<archmage-equipment-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-equipment-sheet-vue>`
    }
  }

  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["archmage-appv2", "item", "dialog-form", "standard-form"],
    position: {
      width: 950,
      height: 650,
    },
    window: {
      resizable: true,
      controls: [
        {
          action: "showItemArtwork",
          icon: "fa-solid fa-image",
          label: "ITEM.ViewArt",
          ownership: "OWNER"
        },
        {
          action: "parseInlineRolls",
          icon: "fa-solid fa-dice",
          label: "ARCHMAGE.UI.parseInlineRolls",
          ownership: "OWNER"
        }
      ]
    },
    tag: 'form',
    form: {
      submitOnChange: true,
      submitOnClose: true,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }]
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {

    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.isOwner,
      limited: this.document.limited,
      // Add the item document.
      item: this.item.toObject(),
      actor: this.actor?.toObject() ?? false,
      // Adding system and flags for easier access
      system: this.item.system,
      flags: this.item.flags,
      // Rolldata.
      rollData: this.actor?.getRollData() ?? {},
      // Adding a pointer to CONFIG.ARCHMAGE
      config: CONFIG.ARCHMAGE,
      // Sequencer (module) support.
      sequencerEnabled: game.modules.get("sequencer")?.active,
      // Add tabs:
      tabs: {
        primary: {
          details: {
            key: 'details',
            label: game.i18n.localize('ARCHMAGE.details'),
            active: true,
          },
          bonuses: {
            key: 'bonuses',
            label: game.i18n.localize('ARCHMAGE.bonuses'),
            active: false,
          },
          effects: {
            key: 'effects',
            label: game.i18n.localize('ARCHMAGE.effects'),
            active: false,
          }
        },
      },
      // Force re-renders. Defined in the vue mixin.
      _renderKey: this._renderKey ?? 0,
      // @todo add this after switching to DataModel
      // fields: this.document.schema.fields,
      // systemFields: this.document.system.schema.fields
    };

    // Handle enriched fields.
    const enrichmentOptions = {
      // Whether to show secret blocks in the finished html
      secrets: this.document.isOwner,
      // Data to fill in for inline rolls
      rollData: this.item?.getRollData() ?? {},
      // Relative UUID resolution
      relativeTo: this.item
    };

    const editorOptions = {
      toggled: true,
      collaborate: true,
      documentUUID: this.document.uuid,
      height: 300,
    };

    // Enrich the description.
    context.editors = {
      'system.description.value': {
        enriched: await wrapRolls(this.item.system.description.value ?? '', [], 'short', {}, 'description', enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          ...editorOptions,
          name: 'system.description.value',
          value: context.system.description?.value ?? '',
        }),
      },
    };


    // Make another pass through the editors to fix the element contents.
    for (let [field, editor] of Object.entries(context.editors)) {
      if (context.editors[field].element) {
        context.editors[field].element.innerHTML = context.editors[field].enriched;
      }
    }

    return context;
  }
}
