import { ArchmageBaseItemSheetV2 } from "./base-item-sheet-v2.js";
import { wrapRolls } from "./_item-sheet-helpers.mjs";

import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { ArchmageActionSheetVue } from "../../vue/components.vue.es.js";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class ArchmageActionSheetV2 extends VueRenderingMixin(ArchmageBaseItemSheetV2) {
  vueParts = {
    'archmage-action-sheet-vue': {
      component: ArchmageActionSheetVue,
      template: `<archmage-action-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-action-sheet-vue>`
    }
  }
  
  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["archmage-appv2", "item", "dialog-form", "standard-form"],
    actions: {
      onEditImage: this._onEditImage,
      edit: this._viewEffect,
      create: this._createEffect,
      delete: this._deleteEffect,
      toggle: this._toggleEffect
    },
    position: {
      width: 600,
      height: 600,
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
      ]
    },
    actions: {},
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
      // Force re-renders. Defined in the vue mixin.
      _renderKey: this._renderKey ?? 0,
      // @todo add this after switching to DataModel
      // fields: this.document.schema.fields,
      // systemFields: this.document.system.schema.fields
    };

    console.log('context', context);

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
        enriched: await TextEditor.enrichHTML(this.item.system.description?.value ?? '', enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          ...editorOptions,
          name: 'system.description.value',
          value: context.system.description?.value ?? '',
        }),
      },
    };

    // Enrich powers and feats.
    await this._enrichActions(context, enrichmentOptions, editorOptions);

    // Make another pass through the editors to fix the element contents.
    for (let [field, editor] of Object.entries(context.editors)) {
      if (context.editors[field].element) {
        context.editors[field].element.innerHTML = context.editors[field].enriched;
      }
    }

    return context;
  }

  /**
   * Enrich values for action fields.
   * 
   * @param {object} context 
   * @param {object} enrichmentOptions 
   * @param {object} editorOptions 
   */
  async _enrichActions(context, enrichmentOptions, editorOptions) {
    // Enrich other fields.
    const powerFields = [
      'attack',
      'hit',
      'hit1',
      'hit2',
      'hit3',
      'hit4',
      'hit5',
      'miss',
    ];

    for (let field of powerFields) {
      context.editors[field] = {
        // @todo write a power enricher.
        enriched: await wrapRolls(this.item.system[field].value ?? '', [], 'short', {}, field, enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          ...editorOptions,
          name: `system.${field}.value`,
          value: context.system[field]?.value ?? '',
        }),
      };
    }
  }
}
