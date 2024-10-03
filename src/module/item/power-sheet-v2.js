import { ArchmageBaseItemSheetV2 } from "./base-item-sheet-v2.js";
import { wrapRolls } from "./_item-sheet-helpers.mjs";

import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { ArchmagePowerSheetVue } from "../../vue/components.vue.es.js";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class ArchmagePowerSheetV2 extends VueRenderingMixin(ArchmageBaseItemSheetV2) {
  vueParts = {
    'archmage-power-sheet-vue': {
      component: ArchmagePowerSheetVue,
      template: `<archmage-power-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-power-sheet-vue>`
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
      width: 860,
      height: 630,
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
    actions: {
      createFeat: this._updateFeat,
      deleteFeat: this._updateFeat,
      moveFeatUp: this._updateFeat,
      moveFeatDown: this._updateFeat,
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
      // Add tabs:
      tabs: {
        primary: {
          details: {
            key: 'details',
            label: game.i18n.localize('ARCHMAGE.details'),
            active: true,
          },
          attack: {
            key: 'attack',
            label: 'Attack',
            active: false,
          },
          special: {
            key: 'special',
            label: 'Special',
            active: false,
          },
          feats: {
            key: 'feats',
            label: 'Feats',
            active: false,
          },
          effects: {
            key: 'effects',
            label: 'Effects',
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

    // Enrich powers and feats.
    await this._enrichPowers(context, enrichmentOptions, editorOptions);
    await this._enrichFeats(context, enrichmentOptions, editorOptions);

    // Make another pass through the editors to fix the element contents.
    for (let [field, editor] of Object.entries(context.editors)) {
      if (context.editors[field].element) {
        context.editors[field].element.innerHTML = context.editors[field].enriched;
      }
    }

    return context;
  }

  /**
   * Enrich values for power fields.
   * 
   * @param {object} context 
   * @param {object} enrichmentOptions 
   * @param {object} editorOptions 
   */
  async _enrichPowers(context, enrichmentOptions, editorOptions) {
    // Enrich other fields.
    const spellFields = CONFIG.ARCHMAGE.is2e ? [
      'spellLevel2',
      'spellLevel3',
      'spellLevel4',
      'spellLevel5',
      'spellLevel6',
      'spellLevel7',
      'spellLevel8',
      'spellLevel9',
      'spellLevel10',
      'spellLevel11',
    ] : [
      'spellLevel3',
      'spellLevel5',
      'spellLevel7',
      'spellLevel9',
    ];
    const powerFields = [
      'trigger',
      'sustainOn',
      'target',
      'always',
      'attack',
      'hit',
      'hitEven',
      'hitOdd',
      'crit',
      'miss',
      'missEven',
      'missOdd',
      'resources',
      'castBroadEffect',
      'castPower',
      'sustainedEffect',
      'finalVerse',
      'special',
      'effect',
      ...spellFields,
      'spellChain',
      'breathWeapon',
      'recharge',
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

  /**
   * Enrich values for feats.
   * 
   * @param {object} context 
   * @param {object} enrichmentOptions 
   * @param {object} editorOptions 
   */
  async _enrichFeats(context, enrichmentOptions, editorOptions) {
    // Enrich feats.
    if (this.item.system.feats) {
      for (let [featKey, feat] of Object.entries(this.item.system.feats)) {
        context.editors[`feat.${featKey}`] = {
          enriched: await wrapRolls(feat.description.value ?? '', [], 'short', {}, featKey, enrichmentOptions),
          element: foundry.applications.elements.HTMLProseMirrorElement.create({
            ...editorOptions,
            name: `system.feats.${featKey}.description.value`,
            value: feat.description.value ?? '',
          }),
        }
      }
    }
  }

  /* ---------------------------------------------------- */

  /**
   * Add/delete/reorder feats on a power.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  static async _updateFeat(event, target) {
    if (!this.isEditable) return;

    let dataset = target.dataset;

    let item = this.item;
    if (item.type != "power") return;

    let featIndex = Number(dataset.featKey);
    let feats = item.system.feats;

    let deleteFeat = (async () => {return;});
    switch(dataset.action) {
      case 'createFeat':
        if (feats) feats = Object.values(feats);
        else feats = [];
        feats.push({
          "description": {
            "type": "String",
            "value": ""
          },
          "isActive": {
            "type": "Boolean",
            "value": false
          },
          "tier": {
            "type": "String",
            "value": "adventurer"
          },
          "powerUsage": {
            "type": "String",
            "value": ""
          },
          "quantity": {
            "type": "Number",
            "value": null
          },
          "maxQuantity": {
            "type": "Number",
            "value": null
          }
        });
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'deleteFeat':
        deleteFeat = (async () => {
          let newFeats = foundry.utils.deepClone(feats);
          delete newFeats[featIndex];
          newFeats = Object.assign({}, Object.values(newFeats));  // Re-index from 0
          let updateData = {'system.feats': newFeats};
          for (let key of Object.keys(item.system.feats)) {
            if (!newFeats[key]) updateData[`system.feats.-=${key}`] = null;
          }
          await item.update(updateData);
        });
        break;
      case 'moveFeatUp':
        if (featIndex == 0) return;
        feats = Object.values(feats);
        [feats[featIndex], feats[featIndex - 1]] = [feats[featIndex - 1], feats[featIndex]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'moveFeatDown':
        feats = Object.values(feats);
        if (featIndex >= feats.length - 1) return;
        [feats[featIndex + 1], feats[featIndex]] = [feats[featIndex], feats[featIndex + 1]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
    }

    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      await deleteFeat();
      return;
    }
    foundry.applications.api.DialogV2.prompt({
      window: {title: 'Delete feat?'},
      content: `<p>${game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm")}</p>`,
      rejectClose: false,
      ok: {
        callback: (event, button, dialog) => {
          deleteFeat();
        }
      }
    });
  }
}
