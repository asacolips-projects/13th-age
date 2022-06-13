

// CONFIG.debug.hooks = true;

/**
 * Class that defines utility methods for the Archmage system.
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
        round = combat.data.round;
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
   * Set the Escalation Die offset for this combat..
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
        round = combat.data.round;
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


  /**
   * Determines if the player owns a combatant or not.
   */
  static userOwnsCombatant(combatant) {
    // Exit early.
    if (typeof combatant.players == 'undefined') {
      return false;
    }
    let combatantPlayers = combatant.players.map(c => {
      return c.data._id;
    });
    if (combatantPlayers.includes(game.user.id)) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * Get actors by name.
   *
   * @param {str|array} name
   *   Actor name or array of actor names to query.
   */
  static getActorsByName(name) {
    if (Array.isArray(name)) {
      return game.actors.filter(a => name.includes(a.data.name));
    }
    else {
      return game.actors.filter(a => a.data.name == name);
    }
  }

  static async updateCompendiums() {
    let pack = game.packs.get('archmage.monsters-core');
    let monsters = pack ? await pack.getContent() : null;

    if (monsters) {
      for (let actor of monsters) {
        let name = actor.data.name.toLowerCase();
        let update = {};

        // Handle size.
        let size = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureSizes)) {
          size += size == '' ? key : `|${key}`;
        }
        let sizeRegex = new RegExp(size);
        let sizeMatch = name.match(sizeRegex);
        if (sizeMatch && sizeMatch[0]) {
          update['data.details.size.value'] = sizeMatch[0];
          if (sizeMatch[0] == 'large') {
            update['data.token.width'] = 2;
            update['data.token.height'] = 2;
          }
          else if (sizeMatch[0] == 'huge') {
            update['data.token.width'] = 3;
            update['data.token.height'] = 3;
          }
        }
        else {
          update['data.details.size.value'] = 'normal';
        }
        // Handle role.
        let role = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureRoles)) {
          role += role == '' ? key : `|${key}`;
        }
        let roleRegex = new RegExp(role);
        let roleMatch = name.match(roleRegex);
        if (roleMatch && roleMatch[0]) {
          update['data.details.role.value'] = roleMatch && roleMatch[0];
        }
        // Handle type.
        let type = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureTypes)) {
          type += type == '' ? key : `|${key}`;
        }
        let typeRegex = new RegExp(type);
        let typeMatch = name.match(typeRegex);
        if (typeMatch && typeMatch[0]) {
          update['data.details.type.value'] = typeMatch[0];
        }
        if (Object.keys(update).length > 0) {
          update['_id'] = actor.data._id;
          update['name'] = actor.data.name.replace(/( |)\[.*\]/g, '');
          await pack.updateEntity(update);
        }
      };
    }
  }

  static async importClassCompendiums() {
    let validClasses = [
      'barbarian',
      'bard',
      'cleric',
      'commander',
      'fighter',
      'paladin',
      'ranger',
      'rogue',
      'sorcerer',
      'wizard'
    ];

    let preprop = new ArchmagePrepopulate();
    for (let className of validClasses) {
      let classObj = await preprop.getPowersDetail(className);
      let powers = [];
      // Helper function.
      function _getPowerClasses(inputString) {
        // Get the appropriate usage.
        let usage = 'other';
        let recharge = 0;
        let usageString = inputString !== null ? inputString.toLowerCase() : '';
        if (usageString.includes('will')) {
          usage = 'at-will';
        }
        else if (usageString.includes('recharge')) {
          usage = 'recharge';
          if (usageString.includes('16')) {
            recharge = 16;
          }
          else if (usageString.includes('11')) {
            recharge = 11;
          }
          else if (usageString.includes('6')) {
            recharge = 6;
          }
        }
        else if (usageString.includes('battle')) {
          usage = 'once-per-battle';
        }
        else if (usageString.includes('daily')) {
          usage = 'daily';
        }

        return [usage, recharge];
      }
      // Helper function.
      function _replaceLinks(inputString) {
        var outputString = inputString;
        if (inputString !== undefined && inputString !== null) {
          if (inputString.includes('"/srd')) {
            outputString = inputString.replace(/\/srd/g, 'https://www.toolkit13.com/srd');
          }
        }
        return outputString;
      }
      // Build the object.
      classObj?.powers.forEach(power => {
        let usageArray = _getPowerClasses(power.usage);
        let usage = usageArray[0];
        let recharge = usageArray[1];
        let action = 'standard';
        let actionString = power.action !== null ? power.action.toLowerCase() : '';
        if (actionString.includes('move')) {
          action = 'move';
        }
        else if (actionString.includes('quick')) {
          action = 'quick';
        }
        else if (actionString.includes('interrupt')) {
          action = 'interrupt';
        }
        else if (actionString.includes('free')) {
          action = 'free';
        }
        let powerType = Object.entries(CONFIG.ARCHMAGE.powerTypes).find(p => p[1] == power.powerType);
        powers.push({
          name: power.title,
          data: {
            'powerUsage.value': usage,
            'actionType.value': action,
            'powerType.value': powerType != undefined ? powerType[0] : null,
            'powerLevel.value': power.level,
            'range.value': power.type,
            'trigger.value': power.trigger,
            'target.value': power.target,
            'attack.value': power.attack,
            'hit.value': power.hit,
            'miss.value': power.miss,
            'missEven.value': power.missEven,
            'missOdd.value': power.missOdd,
            'cost.value': power.cost,
            'castBroadEffect.value': power.castBroadEffect,
            'castPower.value': power.castPower,
            'sustainedEffect.value': power.sustainedEffect,
            'finalVerse.value': power.finalVerse,
            'effect.value': _replaceLinks(power.effect),
            'special.value': _replaceLinks(power.special),
            'spellLevel3.value': power.spellLevel3,
            'spellLevel5.value': power.spellLevel5,
            'spellLevel7.value': power.spellLevel7,
            'spellLevel9.value': power.spellLevel9,
            'spellChain.value': power.spellChain,
            'breathWeapon.value': power.breathWeapon,
            'recharge.value': recharge,
            'feats.adventurer.description.value': power.featAdventurer,
            'feats.champion.description.value': power.featChampion,
            'feats.epic.description.value': power.featEpic,
          },
          type: 'power'
        });
      });
      // TODO: Uncomment this to create entities.
      // let pack = game.packs.get(`archmage.${className}`);
      // let items = await Item.create(powers, { temporary: true });
      // for (let item of items) {
      //   await pack.importEntity(item);
      // }
    }
  }

  // Generate durations for active effects
  // Done here to simplify future compatibility with core support for AE expiry
  // Currently relies on the times-up module
  // TODO: change to core Foundry when (if) support comes
  static addDuration(data, duration, options={}) {
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

  // Find known classes
  static detectClasses(className) {
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    className = className ? className.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    let matchedClasses = className.match(classRegex);
    if (matchedClasses !== null) matchedClasses = [...new Set(matchedClasses)].sort();
    return matchedClasses;
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