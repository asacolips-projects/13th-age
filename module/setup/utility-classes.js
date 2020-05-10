

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

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.data.round;
      }
      // Format it for min/max values.
      if (round < 1) {
        return 0;
      }
      else if (round > 6) {
        return 6;
      }
      else {
        return round - 1;
      }
    }

    // Otherwise, return 0.
    return 0;
  }

  /**
   * Determine if roll includes a d20 crit.
   *
   * @param {object} roll
   *
   * @return {string} 'crit', 'fail', or 'normal'.
   */
  static inlineRollCritTest(roll) {
    for (let i = 0; i < roll.parts.length; i++) {
      var part = roll.parts[i];
      if (part.rolls) {
        let result = part.rolls.map((r) => {
          if (part.faces === 20) {
            if (r.roll === part.faces) {
              return 'crit';
            }
            else if (r.roll === 1) {
              return 'fail';
            }
            else {
              return 'normal';
            }
          }
          else {
            return 'normal';
          }
        });

        return result;
      }
      else {
        return 'none';
      }
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
    if (combatantPlayers.includes(game.user._id)) {
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
      return game.actors.entities.filter(a => name.includes(a.data.name));
    }
    else {
      return game.actors.entities.filter(a => a.data.name == name);
    }
  }

  static replaceRollData() {
    /**
     * Override the default getRollData() method to add abbreviations for the
     * abilities and attributes properties.
     */
    const original = Actor.prototype.getRollData;
    Actor.prototype.getRollData = function() {
      const data = original.call(this);
      const shorthand = game.settings.get("archmage", "macroShorthand");

      // Get the escalation die value.
      if (game.combats !== undefined && game.combat !== null) {
        data.attributes.escalation = {
          value: ArchmageUtility.getEscalation(game.combat)
        };

        if (data.attributes.standardBonuses) {
          data.attributes.standardBonuses = {
            value: data.attributes.level.value + data.attributes.escalation.value
          };
        }
      }

      // Re-map all attributes onto the base roll data
      if (!!shorthand) {
        let newData = mergeObject(data.attributes, data.abilities);
        delete data.init;
        for (let [k, v] of Object.entries(newData)) {
          switch (k) {
            case 'escalation':
              data.ed = v.value;
              break;

            case 'init':
              data.init = v.mod;
              break;

            case 'level':
              data.lvl = v.value;
              break;

            case 'weapon':
              data.wpn = {
                m: v.melee,
                r: v.ranged,
              };

              // Move the single die values from dice to die.
              data.wpn.m.die = data.wpn.m.dice;
              data.wpn.r.die = data.wpn.r.dice;

              // Move the multi die values from value to dice.
              data.wpn.m.dice = data.wpn.m.value;
              data.wpn.r.dice = data.wpn.r.value;

              // Copy the attack.
              data.wpn.m.atk = data.wpn.m.attack;
              data.wpn.r.atk = data.wpn.r.attack;

              // Delete unneeded keys.
              delete data.wpn.m.value;
              delete data.wpn.r.value;
              delete data.wpn.m.attack;
              delete data.wpn.r.attack;
              break;

            case 'attack':
              data.atk = {
                m: v.melee,
                r: v.ranged,
                a: v.arcane,
                d: v.divins
              };
              break;

            case 'standardBonuses':
              data.std = v.value;

            default:
              if (!(k in data)) data[k] = v;
              break;
          }
        }
      }

      // Old syntax shorthand.
      data.attr = data.attributes;
      data.abil = data.abilities;
      return data;
    };
  }
}

/**
 * Keyboard Controls Reference Sheet
 * @type {Application}
 */
export class ArchmageReference extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "13th Age Inline Rolls Reference"
    options.id = "archmage-help";
    options.template = "systems/archmage/templates/sidebar/apps/archmage-help.html";
    options.width = 600;
    return options;
  }
}

/**
 * Class that can be used to query toolkit13.com.
 */
export class ArchmagePrepopulate {
  constructor() {
    this.endpointBase = 'http://www.toolkit13.com/v1/json/powers';
  }

  async request(endpoint) {
    return await $.ajax({
      url: endpoint,
      type: 'GET',
      cache: false
    });
  }

  async getPowersList(powerClass = null, powerLevel = null) {
    let endpoint = `${this.endpointBase}/list/`;

    if (powerClass.length > 0) {
      endpoint += `${powerClass}/`;
    }

    if (powerLevel.length > 0) {
      endpoint += `${powerLevel}/`;
    }

    return this.request(endpoint);
  }

  async getPowersDetail(powerClass = null, powerLevel = null) {
    let endpoint = `${this.endpointBase}/detail/`;

    if (powerClass.length > 0) {
      endpoint += `${powerClass}/`;
    }

    if (powerLevel.length > 0) {
      endpoint += `${powerLevel}/`;
    }

    return this.request(endpoint);
  }

  async getPowerById(uuid) {
    let endpoint = `${this.endpointBase}/id/${uuid}`;
    return this.request(endpoint);
  }
}
