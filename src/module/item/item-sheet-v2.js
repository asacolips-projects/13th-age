import { ArchmageBaseItemSheetV2 } from "./base-item-sheet-v2.js";

import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { ArchmageItemSheetVue } from "../../vue/components.vue.es.js";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class ArchmageItemSheetV2 extends VueRenderingMixin(ArchmageBaseItemSheetV2) {
  vueParts = {
		'archmage-item-sheet-vue': {
			component: ArchmageItemSheetVue,
			template: `<archmage-item-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-item-sheet-vue>`
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
      viewDoc: this._viewEffect,
      createDoc: this._createEffect,
      deleteDoc: this._deleteEffect,
      toggleEffect: this._toggleEffect
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
      item: this.item,
      // Adding system and flags for easier access
      system: this.item.system,
      flags: this.item.flags,
      // Adding a pointer to CONFIG.ARCHMAGE
      config: CONFIG.ARCHMAGE,
      
      // @todo add this after switching to DataModel
      // Necessary for formInput and formFields helpers
      // fields: this.document.schema.fields,
      // systemFields: this.document.system.schema.fields
    };

    // Handle select fields.
    // context.system.powerSource.options = CONFIG

    context.editors = {
      'system.description.value': {
        enriched: await TextEditor.enrichHTML(
          this.item.system.description?.value ?? '',
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.item.getRollData(),
            // Relative UUID resolution
            relativeTo: this.item
          }
        ),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          name: 'system.description.value',
          toggled: true,
          collaborate: true,
          documentUUID: this.document.uuid,
          height: 300,
          value: context.system.description?.value ?? '',
        }),
      },
    };

    for (let [field, editor] of Object.entries(context.editors)) {
      context.editors[field].element.innerHTML = context.editors[field].enriched;
    }

    return context;
  }
}
