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
    this.dataSet = duplicate(this._data);
    if (!this.dataSet.img) this.dataSet.img = CONST.DEFAULT_TOKEN;
    if (!this.dataSet.name) this.dataSet.name = "New " + this.entity;
    this.prepareBaseData();
    this.prepareEmbeddedEntities();

    this.prepareDerivedData();

    const actorData = this.dataSet;
    const dataSet = actorData.data;
    const flags = actorData.flags;


    // Prepare Character data
    if (actorData.type === 'character') {
      this._prepareCharacterData(dataSet);
    }
    else if (actorData.type === 'npc') {
      this._prepareNPCData(dataSet);
    }

    // Ability modifiers and saves
    for (let abl of Object.values(dataSet.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = Math.floor((abl.value - 10) / 2) + dataSet.attributes.level.value;
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
    
    var missingRecPenalty = Math.min(dataSet.attributes.recoveries.value, 0)

    var acBonus = missingRecPenalty;
    var mdBonus = missingRecPenalty;
    var pdBonus = missingRecPenalty;

    var hpBonus = 0;
    var recoveriesBonus = 0;

    var saveBonus = 0;
    var disengageBonus = 0;

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

          hpBonus += getBonusOr0(item.data.data.attributes.hp);
          recoveriesBonus += getBonusOr0(item.data.data.attributes.recoveries);

          saveBonus += getBonusOr0(item.data.data.attributes.save);
          disengageBonus += getBonusOr0(item.data.data.attributes.disengage);
        }
      });
    }

    // Attributes
    var improvedInit = 0;
    if (flags.archmage) {
      improvedInit = flags.archmage.improvedIniative ? 4 : 0;
    }
    dataSet.attributes.init.mod = dataSet.abilities.dex.mod + (dataSet.attributes.init.value || 0) + improvedInit + dataSet.attributes.level.value;
    // data.attributes.ac.min = 10 + data.abilities.dex.mod;

    // Set a copy of level in details in order to mimic 5e's data structure.
    dataSet.details.level = dataSet.attributes.level;

    if (actorData.type === 'character') {

      dataSet.attributes.attack = {
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

      function minimumOf0(num) {
        if (num < 0) return 0;
        return num;
      }

      dataSet.attributes.save = {
        easy: minimumOf0(6 - saveBonus),
        normal: minimumOf0(11 - saveBonus),
        hard: minimumOf0(16 - saveBonus)
      };

      dataSet.attributes.disengage = minimumOf0(11 - disengageBonus - (dataSet.attributes?.disengageBonus ?? 0));

      dataSet.attributes.ac.value = dataSet.attributes.ac.base + median([dataSet.abilities.dex.mod, dataSet.abilities.con.mod, dataSet.abilities.wis.mod]) + dataSet.attributes.level.value + acBonus;
      dataSet.attributes.pd.value = dataSet.attributes.pd.base + median([dataSet.abilities.dex.mod, dataSet.abilities.con.mod, dataSet.abilities.str.mod]) + dataSet.attributes.level.value + pdBonus;
      dataSet.attributes.md.value = dataSet.attributes.md.base + median([dataSet.abilities.int.mod, dataSet.abilities.cha.mod, dataSet.abilities.wis.mod]) + dataSet.attributes.level.value + mdBonus;

      // Add level ability mods.
      // Replace the ability attributes in the calculator with custom formulas.
      let levelMultiplier = 1;
      if (dataSet.attributes.level.value >= 5) {
        levelMultiplier = 2;
      }
      if (dataSet.attributes.level.value >= 8) {
        levelMultiplier = 3;
      }

      if (levelMultiplier > 0) {
        for (let prop in dataSet.abilities) {
          dataSet.abilities[prop].dmg = levelMultiplier * dataSet.abilities[prop].mod;
        }
      }

      dataSet.tier = levelMultiplier

      if (dataSet.attributes.hp.automatic) {
        let hpLevelModifier = [1, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28];
        let level = dataSet.attributes.level.value;
        if (dataSet.incrementals?.hp) level++;

        let toughness = 0;
        if (flags.archmage) {
          toughness = flags.archmage.toughness ? dataSet.attributes.hp.base : 0;
          if (level <= 4) {
            toughness /= 2
            toughness = Math.floor(toughness)
          } else if (level >= 8) {
            toughness *= 2
          }
        }

        dataSet.attributes.hp.max = Math.floor((dataSet.attributes.hp.base + minimumOf0(dataSet.abilities.con.mod)) * hpLevelModifier[level] + hpBonus + toughness);
      }

      if (dataSet.attributes.recoveries.automatic) {
        dataSet.attributes.recoveries.max = dataSet.attributes.recoveries.base + recoveriesBonus;
      }

      // Skill modifiers
      // for (let skl of Object.values(data.skills)) {
      //   skl.value = parseFloat(skl.value || 0);
      //   skl.mod = data.abilities[skl.ability].mod + Math.floor(skl.value * data.attributes.prof.value);
      // }


      // Coins
      if (!dataSet.coins) {
        dataSet.coins = {
          showRare: false,
          platinum: 0,
          gold: 0,
          silver: 0,
          copper: 0
        }
      }

      dataSet.coins.showRare = false;


      // Resources

      if (!dataSet.resources) {
        dataSet.resources = {
        };
      }
      if (!dataSet.resources.perCombat) {
        dataSet.resources.perCombat = {
          commandPoints: {
            current: 0,
            enabled: false
          },
          momentum: {
            current: 0,
            enabled: false
          }
        };
      }
      if (!dataSet.resources.spendable) {
        dataSet.resources.spendable = {
          ki: {
            current: 0,
            max: 0,
            enabled: false
          },
          custom1: {
            label: "",
            current: 0,
            max: 0,
            enabled: false
          },
          custom2: {
            label: "",
            current: 0,
            max: 0,
            enabled: false
          },
          custom3: {
            label: "",
            current: 0,
            max: 0,
            enabled: false
          },
        };
      }



      // Set an attribute for weapon damage.
      if (dataSet.attributes.weapon === undefined) {
        dataSet.attributes.weapon = {
          melee: {
            dice: 'd8',
            value: 'd8',
            abil: 'str',
            damageAbil: 'str'
          },
          ranged: {
            dice: 'd6',
            value: 'd6',
            abil: 'dex',
            damageAbil: 'dex'
          },
        };
      }
      // Handle some possibly unitialized variables. These can be tweaked through the sheet settings.
      dataSet.attributes.weapon.melee.miss = dataSet.attributes.weapon.melee.miss === undefined ? true : dataSet.attributes.weapon.melee.miss;
      dataSet.attributes.weapon.ranged.miss = dataSet.attributes.weapon.ranged.miss === undefined ? false : dataSet.attributes.weapon.ranged.miss;
      dataSet.attributes.weapon.melee.abil = dataSet.attributes.weapon.melee.abil === undefined ? 'str' : dataSet.attributes.weapon.melee.abil;
      dataSet.attributes.weapon.ranged.abil = dataSet.attributes.weapon.ranged.abil === undefined ? 'dex' : dataSet.attributes.weapon.ranged.abil;
      dataSet.attributes.weapon.melee.damageAbil = dataSet.attributes.weapon.melee.damageAbil === undefined ? 'str' : dataSet.attributes.weapon.melee.damageAbil;
      dataSet.attributes.weapon.ranged.damageAbil = dataSet.attributes.weapon.ranged.damageAbil === undefined ? 'dex' : dataSet.attributes.weapon.ranged.damageAbil;
      // Set calculated values.
      dataSet.attributes.weapon.melee.attack = dataSet.attributes.level.value + dataSet.abilities[dataSet.attributes.weapon.melee.abil].mod + dataSet.attributes.attack.melee.bonus;
      dataSet.attributes.weapon.melee.value = `${dataSet.attributes.level.value}${dataSet.attributes.weapon.melee.dice}`;
      dataSet.attributes.weapon.melee.mod = dataSet.abilities[dataSet.attributes.weapon.melee.abil].mod;
      dataSet.attributes.weapon.melee.dmg = dataSet.abilities[dataSet.attributes.weapon.melee.damageAbil].dmg + dataSet.attributes.attack.melee.bonus;

      dataSet.attributes.weapon.ranged.attack = dataSet.attributes.level.value + dataSet.abilities[dataSet.attributes.weapon.ranged.abil].mod + dataSet.attributes.attack.ranged.bonus;
      dataSet.attributes.weapon.ranged.value = `${dataSet.attributes.level.value}${dataSet.attributes.weapon.ranged.dice}`;
      dataSet.attributes.weapon.ranged.mod = dataSet.abilities[dataSet.attributes.weapon.ranged.abil].mod;
      dataSet.attributes.weapon.ranged.dmg = dataSet.abilities[dataSet.attributes.weapon.ranged.damageAbil].dmg + dataSet.attributes.attack.ranged.bonus;

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
      };
      for (let [key, value] of Object.entries(monkAttacks)) {
        let abil = value.abil.split('/');
        dataSet.attributes.attack[key] = dataSet.attributes.attack.melee;
        if (dataSet.attributes.weapon[key] === undefined) {
          dataSet.attributes.weapon[key] = mergeObject(value, {
            miss: true,
            abil: abil[0],
            attack: dataSet.attributes.level.value + dataSet.abilities[abil[0]].mod + dataSet.attributes.attack[key].bonus,
            value: `${dataSet.attributes.level.value}${value.dice}`,
            mod: dataSet.abilities[abil[0]].mod,
            dmg: levelMultiplier * Number(dataSet.abilities[abil[1]].mod)
          });
        }
      }

    }

    // Get the escalation die value.
    dataSet.attributes.escalation = {
      value: (game.combats != undefined && game.combat != null) ? ArchmageUtility.getEscalation(game.combat) : 0,
    };

    // Penalties to attack rolls
    dataSet.attributes.atkpen = missingRecPenalty;
    // TODO: handle dazed, weakened, etc. here

    if (actorData.type === 'character') {
      dataSet.attributes.standardBonuses = {
        value: dataSet.attributes.level.value + dataSet.attributes.escalation.value + dataSet.attributes.atkpen
      };
    }

    this.applyActiveEffects();

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


    // Find known classes
    if (!game.settings.get('archmage', 'automateBaseStatsFromClass')) {
      let classList = Object.keys(CONFIG.ARCHMAGE.classList);
      let classRegex = new RegExp(classList.join('|'), 'g');

      var classText = data.details.class?.value;
      classText = classText ? classText.toLowerCase() : '';

      var matchedClasses = classText.match(classRegex);
      data.details.detectedClasses = matchedClasses.sort();
    }

    // Enable resources based on detected classes
    if (data.details.detectedClasses && data.resources) {
      if (data.resources.perCombat) {
        data.resources.perCombat.momentum.enabled = data.details.detectedClasses.includes("rogue");
        data.resources.perCombat.commandPoints.enabled = data.details.detectedClasses.includes("commander");
      }
      if (data.resources.spendable) {
        data.resources.spendable.ki.enabled = data.details.detectedClasses.includes("monk");
      }
    }
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
    let abl = this.dataSet.data.abilities[abilityId];
    let terms = ['@mod', '@background'];
    let flavor = `${abl.label} Ability Test`;

    // Call the roll helper utility
    DiceArchmage.d20Roll({
      event: event,
      terms: terms,
      data: {
        mod: abl.mod + this.dataSet.data.attributes.level.value + (this.dataSet.data.incrementals?.skills ? 1 : 0),
        background: 0
      },
      backgrounds: this.dataSet.data.backgrounds,
      title: flavor,
      alias: this.actor,
    });
  }
}

/**
 * Character sheet update hook
 * Automates update of base stats based on class
 *
 * @return {undefined}
 */

function _preUpdateCharacterData(actor, data, options, id) {
  if (options.diff
    && data.data !== undefined
    && data.data.details !== undefined
    && data.data.details.class !== undefined
    && game.settings.get('archmage', 'automateBaseStatsFromClass')
    ) {
    // Here we received an update of the class name

    // Find known classes
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    let classText = data.data.details.class.value;
    classText = classText ? classText.toLowerCase() : '';
    let matchedClasses = classText.match(classRegex);

    if (matchedClasses !== null) {
      // Sort to avoid problems with future matches
      matchedClasses = matchedClasses.sort();

      // Check that the matched classes actually changed
      if (actor.data.data.details.matchedClasses !== undefined
        && JSON.stringify(actor.data.data.details.matchedClasses) == JSON.stringify(matchedClasses)
        ) {
        return
      }

      // Collect base stats for detected classes
      let base = {
        hp: new Array(),
        ac: new Array(),
        ac_hvy: new Array(),
        pd: new Array(),
        md: new Array(),
        rec: new Array(),
        mWpn: new Array(),
        rWpn: new Array(),
        skilledWarrior: new Array()
      }

      matchedClasses.forEach(function(item) {
        base.hp.push(CONFIG.ARCHMAGE.classes[item].hp);
        base.ac.push(CONFIG.ARCHMAGE.classes[item].ac_lgt);
        if (CONFIG.ARCHMAGE.classes[item].ac_hvy_pen < 0) {
          base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy_pen);
        } else {
          base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy);
        }
        base.pd.push(CONFIG.ARCHMAGE.classes[item].pd);
        base.md.push(CONFIG.ARCHMAGE.classes[item].md);
        base.rec.push(CONFIG.ARCHMAGE.classes[item].rec_die);
        base.mWpn.push(CONFIG.ARCHMAGE.classes[item].wpn_1h);
        base.rWpn.push(CONFIG.ARCHMAGE.classes[item].wpn_rngd);
        base.skilledWarrior.push(CONFIG.ARCHMAGE.classes[item].skilled_warrior);
      });

      // Combine base stats based on detected classes
      if (base.skilledWarrior.length == 1) base.skilledWarrior = true;
      else base.skilledWarrior = base.skilledWarrior.every(a => a);
      base.hp = (base.hp.reduce((a, b) => a + b, 0) / base.hp.length);
      base.ac = Math.max.apply(null, base.ac);
      if (Math.min.apply(null, base.ac_hvy) > 0) base.ac = Math.max.apply(null, base.ac_hvy);
      base.pd = Math.max.apply(null, base.pd);
      base.md = Math.max.apply(null, base.md);
      if (base.rec.length == 1) base.rec = base.rec[0];
      else base.rec = (Math.ceil(base.rec.reduce((a, b) => a/2 + b/2) / base.rec.length) * 2);
      base.mWpn = Math.max.apply(null, base.mWpn);
      base.rWpn = Math.max.apply(null, base.rWpn);
      let jabWpn = 6;
      let punchWpn = 8;
      let kickWpn = 10;
      if (!base.skilledWarrior) {
        base.mWpn = Math.max(base.mWpn - 2, 4);
        base.rWpn = Math.max(base.mWpn - 2, 4);
        jabWpn -= 2;
        punchWpn -= 2;
        kickWpn -= 2;
      }
      let lvl = actor.data.data.attributes.level.value;

      // Assign computed values
      data.data.attributes = {
        hp: {base: base.hp},
        ac: {base: base.ac},
        pd: {base: base.pd},
        md: {base: base.md},
        recoveries: {dice: `d${base.rec}`},
        weapon: {
          melee: {dice: `d${base.mWpn}`, value: `${lvl}d${base.mWpn}`},
          ranged: {dice: `d${base.rWpn}`, value: `${lvl}d${base.rWpn}`},
          jab: {dice: `d${jabWpn}`, value: `${lvl}d${jabWpn}`},
          punch: {dice: `d${punchWpn}`, value: `${lvl}d${punchWpn}`},
          kick: {dice: `d${kickWpn}`, value: `${lvl}d${kickWpn}`}
        }
      };
    }
    // Store matched classes for future reference
    data.data.details.detectedClasses = matchedClasses;
  }
}

Hooks.on('preUpdateActor', _preUpdateCharacterData);
