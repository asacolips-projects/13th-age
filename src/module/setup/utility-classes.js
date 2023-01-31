

// CONFIG.debug.hooks = true;

/**
 * Class that defines utility methods for the Archmage system.
 * IMPORTANT: May be used by modules/macros. Handle changes with care!
 * (For example, the formatting methods are used in translation modules.)
 */
export class ArchmageUtility {

  /**
   * Get Escalation Die value.
   *
   * @param {object} combat
   *   (Optional) Combat to check the escalation for.
   *
   * @return {int} The escalation die value.
   */
  static getEscalation(combat = null) {
    // Get the current combat if one wasn't provided.
    if (!combat) {
      combat = game.combat;
    }

    // Assume the escalation die is 0 by default.
    let result = 0;

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.round;
      }
      // Format it for min/max values.
      if (round < 1) {
        result = 0;
      }
      else if (round > 6) {
        result = 6;
      }
      else {
        result = round - 1;
      }

      // Get the manual offset for this combat..
      let edOffset = combat.getFlag('archmage', 'edOffset') ?? 0;
      if (edOffset) {
        result = result + edOffset;

        // If the escalation die isn't unlimited, set a min/max.
        if (!game.settings.get('archmage', 'unboundEscDie')) {
          if (result > 6) {
            result = 6;
          }
          else if (result < 0) {
            result = 0;
          }
        }
      }
    }

    // Otherwise, return 0.
    return result;
  }

  /**
   * Set the Escalation Die offset for this combat.
   *
   * @param {object} combat
   *   (Optional) Combat to set the escalation die offset for.
   * @param {Boolean} isIncrease
   *   (Optional) If true, increase the esc. die, otherwise decrease it.
   */
  static setEscalationOffset(combat = null, isIncrease = true) {
    // Get the current combat if one wasn't provided.
    if (!combat) {
      combat = game.combat;
    }

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.round;
      }

      // Establish limits on the current round.
      if (round > 6) round = 6;
      if (round < 0) round = 0;

      // Retrieve the escalation die offset for this combat.
      let edOffset = combat.getFlag('archmage', 'edOffset') ?? 0;

      // By default, limit how far the escalation die can be adjusted.
      if (!game.settings.get('archmage', 'unboundEscDie')) {
        if (isIncrease) {
          if (round + edOffset < 7) edOffset++;
        }
        else {
          if (round + edOffset > 0) edOffset--;
        }
      }
      // If it's unbound, unlimited power!
      else {
        if (isIncrease) edOffset++;
        else edOffset--;
      }

      // Update the escalation die offset flag.
      combat.setFlag('archmage', 'edOffset', edOffset);
    }
  }

  static async updateCompendiums() {
    let pack = game.packs.get('archmage.monsters-core');
    let monsters = pack ? await pack.getContent() : null;

    if (monsters) {
      for (let actor of monsters) {
        let name = actor.name.toLowerCase();
        let update = {};

        // Handle size.
        let size = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureSizes)) {
          size += size == '' ? key : `|${key}`;
        }
        let sizeRegex = new RegExp(size);
        let sizeMatch = name.match(sizeRegex);
        if (sizeMatch && sizeMatch[0]) {
          update['system.details.size.value'] = sizeMatch[0];
          if (sizeMatch[0] == 'large') {
            update['prototypeToken.width'] = 2;
            update['prototypeToken.height'] = 2;
          }
          else if (sizeMatch[0] == 'huge') {
            update['prototypeToken.width'] = 3;
            update['prototypeToken.height'] = 3;
          }
        }
        else {
          update['system.details.size.value'] = 'normal';
        }
        // Handle role.
        let role = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureRoles)) {
          role += role == '' ? key : `|${key}`;
        }
        let roleRegex = new RegExp(role);
        let roleMatch = name.match(roleRegex);
        if (roleMatch && roleMatch[0]) {
          update['system.details.role.value'] = roleMatch && roleMatch[0];
        }
        // Handle type.
        let type = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureTypes)) {
          type += type == '' ? key : `|${key}`;
        }
        let typeRegex = new RegExp(type);
        let typeMatch = name.match(typeRegex);
        if (typeMatch && typeMatch[0]) {
          update['system.details.type.value'] = typeMatch[0];
        }
        if (Object.keys(update).length > 0) {
          update['_id'] = actor._id;
          update['name'] = actor.name.replace(/( |)\[.*\]/g, '');
          await pack.updateEntity(update);
        }
      };
    }
  }

  // Find known classes
  static detectClasses(className) {
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    className = className ? className.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    let matchedClasses = className.match(classRegex);
    if (matchedClasses !== null) matchedClasses = [...new Set(matchedClasses)].sort();
    return matchedClasses;
  }

  static formatNewItemName(itemType) {
    return game.i18n.format("ARCHMAGE.newItem",
      { item: game.i18n.localize(`ARCHMAGE.${itemType}`) });
  }

  static formatLevel(number) {
    return game.i18n.format("ARCHMAGE.levelFormat",
      { level: ArchmageUtility.ordinalSuffix(number) });
  }

  static ordinalSuffix(number) {
    if (game.i18n.lang !== "en") {
      return number;
    }
    var last = number % 10,
        teens = number % 100;
    if (last == 1 && teens != 11) {
        return number + "st";
    }
    if (last == 2 && teens != 12) {
        return number + "nd";
    }
    if (last == 3 && teens != 13) {
        return number + "rd";
    }
    return number + "th";
  }

  static cleanActiveEffectLabel(label) {
    return label
      .replace("data.attributes", "")
      .replace("system.attributes", "")
      .replace("attack", game.i18n.localize("ARCHMAGE.attack"))
      .replace("arcane", game.i18n.localize("ARCHMAGE.EFFECT.AE.arcane"))
      .replace("divine", game.i18n.localize("ARCHMAGE.EFFECT.AE.divine"))
      .replace("ranged", game.i18n.localize("ARCHMAGE.ranged"))
      .replace("melee", game.i18n.localize("ARCHMAGE.melee"))
      .replace("bonus", game.i18n.localize("ARCHMAGE.bonus"))
      .replace("md", game.i18n.localize("ARCHMAGE.md.label"))
      .replace("pd", game.i18n.localize("ARCHMAGE.pd.label"))
      .replace("hp", game.i18n.localize("ARCHMAGE.health"))
      .replace("save", game.i18n.localize("ARCHMAGE.ITEM.saveBonus"))
      .replace("disengage", game.i18n.localize("ARCHMAGE.ITEM.disengageBonus"))
      .replace("recoveries", game.i18n.localize("ARCHMAGE.recoveries"))
      .replace("critMod.atk", game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitBonus"))
      .replace("critMod.def", game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitDefense"))
      .replace("value", "")
      .replaceAll(".", " ")
      .replace("ac ", game.i18n.localize("ARCHMAGE.ac.label"));
  }
}

/**
 * Class that defines utility methods for macros.
 * IMPORTANT: this class is used in (possibly user-defined) macros, handle any changes with care.
 */
export class MacroUtils {
  /**
   * Generate durations for active effects
   * Done here to simplify future compatibility with core support for AE expiry
   * Currently relies on the times-up module
   * TODO: change to core Foundry when (if) support comes
   */
  static setDuration(data, duration, options={}) {
    let d = {
      combat: undefined,
      rounds: undefined,
      seconds: undefined,
      startRound: 0,
      startTime: 0,
      startTurn: 0,
      turns: undefined
    }
    switch(duration) {
      case CONFIG.ARCHMAGE.effectDurations.StartOfNextTurn:
        d.rounds = 1;
        data['flags.dae.specialDuration'] = ["turnStart"];
        break;
      case CONFIG.ARCHMAGE.effectDurations.EndOfNextTurn:
        d.rounds = 1;
        d.turns = 1;
        data['flags.dae.specialDuration'] = ["turnEnd"];
        break;
      case CONFIG.ARCHMAGE.effectDurations.StartOfNextSourceTurn:
        d.rounds = 1;
        data['flags.dae.specialDuration'] = ["turnStartSource"];
        data.origin = options.sourceTurnUuid;
        break;
      case CONFIG.ARCHMAGE.effectDurations.EndOfNextSourceTurn:
        d.rounds = 1;
        d.turns = 1;
        data['flags.dae.specialDuration'] = ["turnEndSource"];
        data.origin = options.sourceTurnUuid;
        break;
      case CONFIG.ARCHMAGE.effectDurations.SaveEnds:
        //TODO: not yet supported, roll a save with target threshold
        data['flags.dae.macroRepeat'] = "endEveryTurn";
        break;
    }
    data.duration = d;
    return data;
  }
}

/**
 * Keyboard Controls Reference Sheet
 * @type {Application}
 */
export class ArchmageReference extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "Archmage Inline Rolls Reference"
    options.id = "archmage-help";
    options.template = "systems/archmage/templates/sidebar/apps/archmage-help.html";
    options.width = 820;
    return options;
  }
}
