import { ActorArchmageSheet } from './actor-sheet.js';

export class ActorArchmageSheetV2 extends ActorArchmageSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: 800,
      height: 960
    });
    return options;
  }

  get template() {
    const type = this.actor.data.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-v2.html`;
  }

  getData() {
    const sheetData = super.getData();

    return sheetData;
  }
}