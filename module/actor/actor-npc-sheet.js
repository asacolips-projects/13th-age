import { ActorArchmageSheet } from './actor-sheet.js';

export class ActorArchmageNPCSheet extends ActorArchmageSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage', 'actor', 'npc-sheet']),
      width: 640,
      height: 720
    });
    return options;
  }

  get template() {
    const path = 'systems/archmage/templates/actors/';
    if (!game.user.isGM && this.actor.limited) return path + "limited-npc-sheet.html";
    return path + "actor-npc-sheet.html";
  }

  getData() {
    const sheetData = super.getData();

    this._prepareCharacterItems(sheetData.actor);

    // Prepare select fields.
    sheetData.roles = CONFIG.ARCHMAGE.creatureRoles;
    sheetData.sizes = CONFIG.ARCHMAGE.creatureSizes;
    sheetData.types = CONFIG.ARCHMAGE.creatureTypes;

    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(actorData) {

    const actions = [];
    const traits = [];
    const nastierSpecials = [];

    // // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of actorData.items) {
      // i.img = i.img || DEFAULT_TOKEN;
      // Feats
      if (i.type === 'action') {
        let action = i;
        let properties = [
          'hit',
          'hit1',
          'hit2',
          'hit3',
          'hit4',
          'hit5',
          'miss'
        ];

        // Parse for simple markdown (italics and bold).
        for (var prop in i.data) {
          if (Object.prototype.hasOwnProperty.call(i.data, prop)) {
            if (properties.includes(prop)) {
              action.data[prop].formatted = parseMarkdown(i.data[prop].value);
            }
          }
        }

        actions.push(action);
      }
      else if (i.type === 'trait') {
        traits.push(i);
      }
      else if (i.type === 'nastierSpecial') {
        nastierSpecials.push(i);
      }
    }

    // Assign and return
    actorData.actions = actions;
    actorData.traits = traits;
    actorData.nastierSpecials = nastierSpecials;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.options.editable) return;
  }
}