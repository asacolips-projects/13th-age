const { ApplicationV2 } = foundry.applications.api;

import VueRenderingMixin from "../item/_vue-application-mixin.mjs";
import { ArchmageMookDamageAppV2 } from "../../vue/components.vue.es.js";

export class MookDamageApplicationV2 extends VueRenderingMixin(ApplicationV2) {
  documents = [];

  vueParts = {
    'archmage-mook-damage-app-v2': {
      component: ArchmageMookDamageAppV2,
      template: `<archmage-mook-damage-app-v2 :context="context">Vue rendering for application failed.</archmage-mook-damage-app-v2>`,
    }
  }

  constructor(documents, options = {}) {
    super(options);
    this.documents = documents;
    this.isEditable = true;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["mook-damage-application", "dialog-form", "standard-form"],
    actions: {
      // onEditImage: this._onEditImage,
      // edit: this._viewEffect,
      // create: this._createEffect,
      // delete: this._deleteEffect,
      // toggle: this._toggleEffect
    },
    position: {
      width: 640,
      // height: 400,
    },
    window: {
      title: 'Apply Damage to Mooks',
      resizable: true,
      controls: [
        // {
        //   action: "showItemArtwork",
        //   icon: "fa-solid fa-image",
        //   label: "ITEM.ViewArt",
        //   ownership: "OWNER"
        // },
      ]
    },
    actions: {
      // createFeat: this._updateFeat,
      // deleteFeat: this._updateFeat,
      // moveFeatUp: this._updateFeat,
      // moveFeatDown: this._updateFeat,
    },
    tag: 'form',
    form: {
      submitOnChange: false,
      submitOnClose: false,
    },
    // Custom property that's merged into `this.options`
    // dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }]
  };

  async _prepareContext(options) {
    const context = {
      damage: {},
      mooks: {
        targets: this.documents ?? [],
      }
    };

    const targetIds = this.documents.map(t => t.id);
    const sceneTokens = [...game.scenes.viewed.tokens.values() ?? []].filter(t => {
      return t.actor.type === 'npc'
        && !targetIds.includes(t.id)
        && t.actor.system.details.role.value === 'mook';
    });

    context.mooks.other = sceneTokens;

    context.damage.single = 20;
    context.damage.total = context.damage.single * context.mooks.targets.length;
    context.damage.spillover = 0;

    for (let token of context.mooks.targets) {
      if (context.damage.single > token.actor.system.attributes.hp.value) {
        context.damage.spillover += context.damage.single - token.actor.system.attributes.hp.value;
      }
    }

    return context;
  }
}