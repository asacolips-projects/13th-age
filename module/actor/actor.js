import { ArchmageUtility } from '../setup/utility-classes.js';
import { DiceArchmage } from './dice.js';

/**
 * Extend the base Actor class to implement additional logic specialized for D&D5e.
 */
export class ActorArchmage extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  prepareData() {
    super.prepareData();

    // Get the Actor's data object
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Prepare Character data
    if (actorData.type === 'character') {
      this._prepareCharacterData(data);
    }
    else if (actorData.type === 'npc') {
      this._prepareNPCData(data);
    }

    // Ability modifiers and saves
    for (let abl of Object.values(data.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = Math.floor((abl.value - 10) / 2) + data.attributes.level.value;
    }

    /**
     * Determine the median value.
     * @param {Array} values array of values to tset.
     *
     * @return {Int} The median value
     */
    function median(values) {
      values.sort(function(a, b) {
        return a - b;
      });

      if (values.length === 0) {
        return 0;
      }

      var half = Math.floor(values.length / 2);

      if (values.length % 2) {
        return values[half];
      }
      else {
        return (values[half - 1] + values[half]) / 2.0;
      }
    }

    var meleeAttackBonus = 0;
    var rangedAttackBonus = 0;
    var divineAttackBonus = 0;
    var arcaneAttackBonus = 0;

    var acBonus = 0;
    var mdBonus = 0;
    var pdBonus = 0;

    function getBonusOr0(type) {
      if (type && type.bonus) {
        return type.bonus;
      }
      return 0;
    }

    if (this.items) {
      this.items.forEach(function(item) {
        if (item.type === 'equipment') {
          meleeAttackBonus += getBonusOr0(item.data.data.attributes.attack.melee);
          rangedAttackBonus += getBonusOr0(item.data.data.attributes.attack.ranged);
          divineAttackBonus += getBonusOr0(item.data.data.attributes.attack.divine);
          arcaneAttackBonus += getBonusOr0(item.data.data.attributes.attack.arcane);

          acBonus += getBonusOr0(item.data.data.attributes.ac);
          mdBonus += getBonusOr0(item.data.data.attributes.md);
          pdBonus += getBonusOr0(item.data.data.attributes.pd);
        }
      });
    }

    // Attributes
    var improvedInit = 0;
    if (flags.archmage) {
      improvedInit = flags.archmage.improvedIniative ? 4 : 0;
    }
    data.attributes.init.mod = data.abilities.dex.mod + (data.attributes.init.value || 0) + improvedInit + data.attributes.level.value;
    // data.attributes.ac.min = 10 + data.abilities.dex.mod;

    // Set a copy of level in details in order to mimic 5e's data structure.
    data.details.level = data.attributes.level;

    if (actorData.type === 'character') {

      data.attributes.attack = {
        melee: {
          bonus: meleeAttackBonus
        },
        ranged: {
          bonus: rangedAttackBonus
        },
        divine: {
          bonus: divineAttackBonus
        },
        arcane: {
          bonus: arcaneAttackBonus
        }
      };

      data.attributes.ac.value = data.attributes.ac.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod]) + data.attributes.level.value + acBonus;
      data.attributes.pd.value = data.attributes.pd.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod]) + data.attributes.level.value + pdBonus;
      data.attributes.md.value = data.attributes.md.base + median([data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod]) + data.attributes.level.value + mdBonus;

      // Skill modifiers
      // for (let skl of Object.values(data.skills)) {
      //   skl.value = parseFloat(skl.value || 0);
      //   skl.mod = data.abilities[skl.ability].mod + Math.floor(skl.value * data.attributes.prof.value);
      // }



      // Add level ability mods.
      // Replace the ability attributes in the calculator with custom formulas.
      let levelMultiplier = 1;
      if (data.attributes.level.value >= 5) {
        levelMultiplier = 2;
      }
      if (data.attributes.level.value >= 8) {
        levelMultiplier = 3;
      }

      if (levelMultiplier > 0) {
        for (let prop in data.abilities) {
          data.abilities[prop].dmg = levelMultiplier * data.abilities[prop].mod;
        }
      }

      // Set an attribute for weapon damage.
      if (data.attributes.weapon === undefined) {
        data.attributes.weapon = {
          melee: {
            dice: 'd8',
            value: 'd8',
            abil: 'str'
          },
          ranged: {
            dice: 'd6',
            value: 'd6',
            abil: 'dex'
          },
        };
      }
      // Handle some possibly unitialized variables. These can be tweaked through the sheet settings.
      data.attributes.weapon.melee.miss = data.attributes.weapon.melee.miss === undefined ? true : data.attributes.weapon.melee.miss;
      data.attributes.weapon.ranged.miss = data.attributes.weapon.ranged.miss === undefined ? false : data.attributes.weapon.ranged.miss;
      data.attributes.weapon.melee.abil = data.attributes.weapon.melee.abil === undefined ? 'str' : data.attributes.weapon.melee.abil;
      data.attributes.weapon.ranged.abil = data.attributes.weapon.ranged.abil === undefined ? 'dex' : data.attributes.weapon.ranged.abil;
      // Set calculated values.
      data.attributes.weapon.melee.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.melee.abil].mod + data.attributes.attack.melee.bonus;
      data.attributes.weapon.melee.value = `${data.attributes.level.value}${data.attributes.weapon.melee.dice}`;
      data.attributes.weapon.melee.mod = data.abilities[data.attributes.weapon.melee.abil].mod;
      data.attributes.weapon.melee.dmg = data.abilities[data.attributes.weapon.melee.abil].dmg + data.attributes.attack.melee.bonus;

      data.attributes.weapon.ranged.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.ranged.abil].mod + data.attributes.attack.ranged.bonus;
      data.attributes.weapon.ranged.value = `${data.attributes.level.value}${data.attributes.weapon.ranged.dice}`;
      data.attributes.weapon.ranged.mod = data.abilities[data.attributes.weapon.ranged.abil].mod;
      data.attributes.weapon.ranged.dmg = data.abilities[data.attributes.weapon.ranged.abil].dmg + data.attributes.attack.ranged.bonus;

      // Handle monk attacks.
      let monkAttacks = {
        jab: {
          dice: 'd6',
          value: 'd6',
          abil: 'dex/str'
        },
        punch: {
          dice: 'd8',
          value: 'd8',
          abil: 'dex/str'
        },
        kick: {
          dice: 'd10',
          value: 'd10',
          abil: 'dex/str'
        }
      }
      for (let [key, value] of Object.entries(monkAttacks)) {
        let abil = value.abil.split('/');
        data.attributes.attack[key] = data.attributes.attack.melee;
        data.attributes.weapon[key] = mergeObject(value, {
          miss: true,
          abil: abil[0],
          attack: data.attributes.level.value + data.abilities[abil[0]].mod + data.attributes.attack[key].bonus,
          value: `${data.attributes.level.value}${value.dice}`,
          mod: data.abilities[abil[0]].mod,
          dmg: levelMultiplier * Number(data.abilities[abil[1]].mod)
        });
      }

    }

    // Get the escalation die value.
    data.attributes.escalation = {
      value: (game.combats != undefined && game.combat != null) ? ArchmageUtility.getEscalation(game.combat) : game.settings.get('archmage', 'currentEscalation'),
    };

    if (actorData.type === 'character') {
      data.attributes.standardBonuses = {
        value: data.attributes.level.value + data.attributes.escalation.value
      };
    }

    // Return the prepared Actor data
    return actorData;
  }

  /* -------------------------------------------- */

  /**
   * Prepare Character type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareCharacterData(data) {

    // Level, experience, and proficiency
    data.attributes.level.value = parseInt(data.attributes.level.value);
  }

  /* -------------------------------------------- */

  /**
   * Prepare NPC type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareNPCData(data) {
  }

  /* -------------------------------------------- */

  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param abilityId {String}    The ability id (e.g. "str")
   *
   * @return {undefined}
   */
  rollAbility(abilityId) {
    this.rollAbilityTest(abilityId);
  }

  /* -------------------------------------------- */

  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any
   * Situational Bonus
   * @param abilityId {String}    The ability ID (e.g. "str")
   *
   * @return {undefined}
   */
  rollAbilityTest(abilityId) {
    let abl = this.data.data.abilities[abilityId];
    let parts = ['@mod', '@background'];
    let flavor = `${abl.label} Ability Test`;

    // Call the roll helper utility
    DiceArchmage.d20Roll({
      event: event,
      parts: parts,
      data: {
        mod: abl.mod + this.data.data.attributes.level.value,
        background: 0
      },
      backgrounds: this.data.data.backgrounds,
      title: flavor,
      alias: this.actor,
    });
  }
}