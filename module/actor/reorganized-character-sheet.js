import { ActorArchmageSheet } from './actor-sheet.js';

export class ReorganizedCharacterArchmageSheet extends ActorArchmageSheet {
    get template() {
      return "systems/archmage/templates/actors/reorganized-character-sheet.html";
    }

    getData() {
      const sheetData = super.getData();

      sheetData.actor.class = sheetData.actor.powers.filter(power => power.data.actionType.value === "");
      sheetData.actor.actions = sheetData.actor.powers.filter(power => power.data.actionType.value !== "");

      return sheetData;
    }
    
  }
