import { ActorArchmageSheet } from './actor-sheet.js';

export class PowerTypesCharacterArchmageSheet extends ActorArchmageSheet {
    get template() {
      return "systems/archmage/templates/actors/power-types-character-sheet.html";
    }

    getData() {
      const sheetData = super.getData();

      sheetData.actor.features = sheetData.actor.powers.filter(power => power.data.powerType.value === "feature");
      sheetData.actor.talents = sheetData.actor.powers.filter(power => power.data.powerType.value === "talent");
      sheetData.actor.spells = sheetData.actor.powers.filter(power => power.data.powerType.value === "spell");
      sheetData.actor.powers = sheetData.actor.powers.filter(power => power.data.powerType.value === "power");
      sheetData.actor.maneuvers = sheetData.actor.powers.filter(power => power.data.powerType.value === "maneuver");
      sheetData.actor.other = sheetData.actor.powers.filter(power => power.data.powerType.value == undefined || power.data.powerType.value === "" || power.data.powerType.value === "other");

      return sheetData;
    }
    
  }
