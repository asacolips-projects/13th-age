import { ActorArchmageSheet } from './actor-sheet.js';

export class ActionsCharacterArchmageSheet extends ActorArchmageSheet {
    get template() {
      return "systems/archmage/templates/actors/actions-character-sheet.html";
    }

    getData() {
      const sheetData = super.getData();

      sheetData.actor.class = sheetData.actor.powers.filter(power => power.data.actionType.value === "");
      sheetData.actor.actions = sheetData.actor.powers.filter(power => power.data.actionType.value !== "");

      return sheetData;
    }
    
  }
