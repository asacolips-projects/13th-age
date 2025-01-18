import { ActorArchmageSheetV2 } from './actor-sheet-v2.js'

export class ActorTabFocusSheet extends ActorArchmageSheetV2 {
  /** @override */
  constructor (rootComponentClass, ...args) {
    super(...args)

    // Properties that we'll use for the Vue app.
    this.vueComponents = { 'root-component': rootComponentClass }
  }

  /** @override */
  // This allows multiples to be open, one for each actor + tab
  get id () {
    return `actor-tab-focus-sheet-${this.actor.id}-${this.vueComponents['root-component'].name}`
  }

  /** @override */
  static get defaultOptions () {
    const options = super.defaultOptions
    const compactMode = game.settings.get('archmage', 'compactMode')
    foundry.utils.mergeObject(options, {
      classes: options.classes
        .concat(['archmage-v2', 'sheet', 'actor', 'tab-focus-sheet', 'tab'])
        .filter(c => c !== 'archmage'),
      width: compactMode ? 550 : 640,
      height: compactMode ? 400 : 500
    })
    return options
  }

  /** @override */
  get template () {
    return 'systems/archmage/templates/actors/actor-tab-focus-sheet-vue.html'
  }

  /** @override */
  get title () {
    const component = this.vueComponents['root-component']
    const name = component.name ?? component.__name ?? ''
    return `${super.title} - ${name.replace('Char', '')}`
  }

  /** @override */
  getData (options) {
    const context = super.getData(options)
    context.cssClass = `${context.cssClass} archmage-v2-vue`
    return context
  }
}
