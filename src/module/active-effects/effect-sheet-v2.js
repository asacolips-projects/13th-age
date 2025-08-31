import VueRenderingMixin from '../item/_vue-application-mixin.mjs'
import { ArchmageActiveEffectSheetVue } from '../../vue/components.vue.es.js'
import { wrapRolls } from '../item/_item-sheet-helpers.mjs'

export class ArchmageActiveEffectSheetV2 extends VueRenderingMixin(
  foundry.applications.sheets.ActiveEffectConfig
) {
  vueParts = {
    'archmage-active-effect-sheet-vue': {
      component: ArchmageActiveEffectSheetVue,
      template: `<archmage-active-effect-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-active-effect-sheet-vue>`
    }
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: [
      'archmage-appv2',
      'active-effect-config',
      'dialog-form',
      'standard-form'
    ],
    actions: {},
    position: {
      width: 550,
      height: 700
    },
    window: {
      resizable: true
    },
    tag: 'form',
    form: {
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    }
  }

  static TABS = {
    sheet: {
      tabs: [
        { id: 'details', icon: 'fa-solid fa-book' },
        { id: 'effects', icon: 'fa-solid fa-gears' }
      ],
      initial: 'effects',
      labelPrefix: 'EFFECT.TABS'
    }
  }

  /* -------------------------------------------- */

  async _prepareContext (options) {
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.isOwner,
      limited: this.document.limited,
      // Add the item document.
      document: this.document.toObject(),
      actor: this.actor?.toObject() ?? false,
      // Adding system and flags for easier access
      system: this.document.system,
      flags: this.document.flags,
      // Adding a pointer to CONFIG.ARCHMAGE
      config: CONFIG.ARCHMAGE,
      // Sequencer (module) support.
      sequencerEnabled: game.modules.get('sequencer')?.active,
      // Add tabs:
      tabs: {
        primary: {
          details: {
            key: 'details',
            label: game.i18n.localize('ARCHMAGE.details'),
            active: true
          },
          // bonuses: {
          //   key: 'bonuses',
          //   label: game.i18n.localize('ARCHMAGE.bonuses'),
          //   active: false
          // },
          effects: {
            key: 'effects',
            label: game.i18n.localize('ARCHMAGE.effects'),
            active: true
          }
        }
      },
      // Force re-renders. Defined in the vue mixin.
      _renderKey: this._renderKey ?? 0
      // @todo add this after switching to DataModel
      // fields: this.document.schema.fields,
      // systemFields: this.document.system.schema.fields
    }

    // Handle enriched fields.
    const enrichmentOptions = {
      // Whether to show secret blocks in the finished html
      secrets: this.document.isOwner,
      // Data to fill in for inline rolls
      rollData: this.item?.getRollData() ?? {},
      // Relative UUID resolution
      relativeTo: this.item
    }

    const editorOptions = {
      toggled: true,
      collaborate: true,
      documentUUID: this.document.uuid,
      height: 300
    }

    context.editors = {
      'document.description.value': {
        enriched: await wrapRolls(
          this.document.description.value ?? '',
          [],
          'short',
          {},
          'description',
          enrichmentOptions
        ),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          ...editorOptions,
          name: 'document.description.value',
          value: context.document.description?.value ?? ''
        })
      }
    }

    return context
  }
}
