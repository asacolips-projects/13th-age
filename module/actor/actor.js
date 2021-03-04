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
    this.data = duplicate(this._data);
    if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
    if (!this.data.name) this.data.name = "New " + this.entity;
    this.prepareBaseData();
    this.prepareEmbeddedEntities();

    this.prepareDerivedData();

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

    var missingRecPenalty = Math.min(data.attributes.recoveries.value, 0)

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

      function minimumOf0(num) {
        if (num < 0) return 0;
        return num;
      }

      data.attributes.save = {
        easy: minimumOf0(6 - saveBonus),
        normal: minimumOf0(11 - saveBonus),
        hard: minimumOf0(16 - saveBonus)
      };

      data.attributes.disengage = minimumOf0(11 - disengageBonus - (data.attributes?.disengageBonus ?? 0));

      data.attributes.ac.value = data.attributes.ac.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod]) + data.attributes.level.value + acBonus;
      data.attributes.pd.value = data.attributes.pd.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod]) + data.attributes.level.value + pdBonus;
      data.attributes.md.value = data.attributes.md.base + median([data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod]) + data.attributes.level.value + mdBonus;

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

      data.tier = levelMultiplier

      if (data.attributes.hp.automatic) {
        let hpLevelModifier = [1, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28];
        let level = data.attributes.level.value;
        if (data.incrementals?.hp) level++;

        let toughness = 0;
        if (flags.archmage) {
          toughness = flags.archmage.toughness ? data.attributes.hp.base : 0;
          if (level <= 4) {
            toughness /= 2
            toughness = Math.floor(toughness)
          } else if (level >= 8) {
            toughness *= 2
          }
        }

        data.attributes.hp.max = Math.floor((data.attributes.hp.base + minimumOf0(data.abilities.con.mod)) * hpLevelModifier[level] + hpBonus + toughness);
      }

      if (data.attributes.recoveries.automatic) {
        data.attributes.recoveries.max = data.attributes.recoveries.base + recoveriesBonus;
      }
      data.attributes.recoveries.avg = Math.floor(data.attributes.level.value * ((Number(data.attributes.recoveries.dice.replace('d', ''))+1) / 2)) + (data.abilities.con.mod * levelMultiplier);

      // Skill modifiers
      // for (let skl of Object.values(data.skills)) {
      //   skl.value = parseFloat(skl.value || 0);
      //   skl.mod = data.abilities[skl.ability].mod + Math.floor(skl.value * data.attributes.prof.value);
      // }


      // Coins
      if (!data.coins) {
        data.coins = {
          showRare: false,
          platinum: 0,
          gold: 0,
          silver: 0,
          copper: 0
        }
      }

      data.coins.showRare = false;


      // Resources

      if (!data.resources) {
        data.resources = {
        };
      }
      if (!data.resources.perCombat) {
        data.resources.perCombat = {
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
      if (!data.resources.spendable) {
        data.resources.spendable = {
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
      if (data.attributes.weapon === undefined) {
        data.attributes.weapon = {
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
      data.attributes.weapon.melee.miss = data.attributes.weapon.melee.miss === undefined ? true : data.attributes.weapon.melee.miss;
      data.attributes.weapon.ranged.miss = data.attributes.weapon.ranged.miss === undefined ? false : data.attributes.weapon.ranged.miss;
      data.attributes.weapon.melee.abil = data.attributes.weapon.melee.abil === undefined ? 'str' : data.attributes.weapon.melee.abil;
      data.attributes.weapon.ranged.abil = data.attributes.weapon.ranged.abil === undefined ? 'dex' : data.attributes.weapon.ranged.abil;
      data.attributes.weapon.melee.damageAbil = data.attributes.weapon.melee.damageAbil === undefined ? 'str' : data.attributes.weapon.melee.damageAbil;
      data.attributes.weapon.ranged.damageAbil = data.attributes.weapon.ranged.damageAbil === undefined ? 'dex' : data.attributes.weapon.ranged.damageAbil;
      // Set calculated values.
      data.attributes.weapon.melee.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.melee.abil].mod + data.attributes.attack.melee.bonus;
      data.attributes.weapon.melee.value = `${data.attributes.level.value}${data.attributes.weapon.melee.dice}`;
      data.attributes.weapon.melee.mod = data.abilities[data.attributes.weapon.melee.abil].mod;
      data.attributes.weapon.melee.dmg = data.abilities[data.attributes.weapon.melee.damageAbil].dmg + data.attributes.attack.melee.bonus;

      data.attributes.weapon.ranged.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.ranged.abil].mod + data.attributes.attack.ranged.bonus;
      data.attributes.weapon.ranged.value = `${data.attributes.level.value}${data.attributes.weapon.ranged.dice}`;
      data.attributes.weapon.ranged.mod = data.abilities[data.attributes.weapon.ranged.abil].mod;
      data.attributes.weapon.ranged.dmg = data.abilities[data.attributes.weapon.ranged.damageAbil].dmg + data.attributes.attack.ranged.bonus;

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
        data.attributes.attack[key] = data.attributes.attack.melee;
        if (data.attributes.weapon[key] === undefined) {
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

    }

    // Get the escalation die value.
    data.attributes.escalation = {
      value: (game.combats != undefined && game.combat != null) ? ArchmageUtility.getEscalation(game.combat) : 0,
    };

    // Penalties to attack rolls
    data.attributes.atkpen = missingRecPenalty;
    // TODO: handle dazed, weakened, etc. here

    if (actorData.type === 'character') {
      // TODO: This also calculated in ArchmageUtility.replaceRollData(). That
      // duplicate code needs to be retired from the utility class if possible.
      data.attributes.standardBonuses = {
        value: data.attributes.level.value + data.attributes.escalation.value + data.attributes.atkpen
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
      if (matchedClasses !== null) {matchedClasses = [...new Set(matchedClasses)].sort();}
      data.details.detectedClasses = matchedClasses;
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
   * Recovery roll dialog.
   *
   * @return {undefined}
   */

  rollRecovery() {
    let actorData = this.data.data;
    let rolled = false;
    let data = {bonus: ""};

    // Render modal dialog
    let template = 'systems/archmage/templates/chat/recovery-dialog.html';
    let dialogData = {
      formula: actorData.attributes.level.value.toString() + actorData.attributes.recoveries.dice + '+' + actorData.abilities.con.dmg.toString()+' ('+actorData.attributes.recoveries.avg.toString()+')',
      avg: this.getFlag('archmage', 'averageRecoveries') ? "checked" : ""
      };
    renderTemplate(template, dialogData).then(dlg => {
      new Dialog({
        title: "Recovery Roll",
        content: dlg,
        buttons: {
          normal: {
            label: 'Normal',
            callback: () => {
              rolled = true;
            }
          },
          free: {
            label: 'Free',
            callback: () => {
              data['label'] = 'Free';
              data['free'] = true;
              rolled = true;
            }
          },
          pot1: {
            label: 'Potion (Adv.)',
            callback: () => {
              data['label'] = 'Potion (Adv.)';
              data['bonus'] = "+1d8";
              data['max'] = 30;
              rolled = true;
            }
          },
          pot2: {
            label: 'Potion (Cha.)',
            callback: () => {
              data['label'] = 'Potion (Cha.)';
              data['bonus'] = "+2d8";
              data['max'] = 60;
              rolled = true;
            }
          },
          pot3: {
            label: 'Potion (Epic)',
            callback: () => {
              data['label'] = 'Potion (Epic)';
              data['bonus'] = "+3d8";
              data['max'] = 100;
              rolled = true;
            }
          },
          pot4: {
            label: 'Potion (Iconic)',
            callback: () => {
              data['label'] = 'Potion (Iconic)';
              data['bonus'] = "+4d8";
              data['max'] = 130;
              rolled = true;
            }
          },
        },
        default: 'normal',
        close: html => {
          if (rolled) {
            data['bonus'] += html.find('[name="bonus"]').val();
            data['apply'] = html.find('[name="apply"]').is(':checked');
            data['average'] = html.find('[name="average"]').is(':checked');
            this.setFlag('archmage', 'averageRecoveries', data['average'])
            this._rollRecovery(data, true);
          }
        }
      }).render(true);
    });
  }

  /* -------------------------------------------- */

  /**
   * Recovery roll.
   * @param data object{bonus: "+X", max: 0, free: false, label: ""}
   * @param print boolean
   *
   * @return {Int} The total rolled for the recovery
   */


  _rollRecovery(data, print = true) {
    let bonus = (data['bonus'] !== undefined) ? data['bonus'] : "";
    let max = (data['max'] !== undefined) ? data['max'] : 0;
    let free = (data['free'] !== undefined) ? data['free'] : false;
    let label = (data['label'] !== undefined) ? data['label']+" Recovery Roll" : "Recovery Roll";
    let apply = (data['apply'] !== undefined) ? data['apply'] : true;
    let average = (data['average'] !== undefined) ? data['average'] : false;
    let actorData = this.data.data;
    let totalRecoveries = actorData.attributes.recoveries.value;
    let formula = actorData.attributes.level.value.toString() + actorData.attributes.recoveries.dice + '+' + actorData.abilities.con.dmg.toString();

    if (this.getFlag('archmage', 'strongRecovery')) {
      // Handle strong recovery. Ignores average results if set!
      formula = (actorData.attributes.level.value + actorData.tier).toString() + actorData.attributes.recoveries.dice + 'k' + actorData.attributes.level.value.toString() + '+' + actorData.abilities.con.dmg.toString();
    } else if (average) {
      // Handle average results.
      formula = this.data.data.attributes.recoveries.avg;
    }

    // Add bonus if any
    if (bonus !== "") {
      // We assume to have signs INSIDE bonus, to handle negative bonuses
      formula = `${formula}${bonus}`;
    }

    // Half healing for recoveries we do NOT have
    if (Number(totalRecoveries) <= 0) {
      formula = `floor((${formula})/2)`;
    }

    // If max is set, handle italics
    if (max > 0) {
      formula = `min((${formula}), ${max})`;
    }

    // Perform the roll.
    let roll = new Roll(`${formula}`);
    roll.roll();

    if (print) {
      // Send to chat and reduce the number of recoveries.
      roll.toMessage({
        flavor: `<div class="archmage chat-card"><header class="card-header flexrow"><img src="${this.img}" title="${this.name}" width="36" height="36"/><h3 class="ability-usage">${label}${Number(totalRecoveries) < 1 ? ' (Half)' : ''}</h3></header></div>`, speaker: {
          actor: this._id,
          token: this.token,
          alias: this.name,
          scene: game.user.viewedScene
        }});
    }
    let newHp = this.data.data.attributes.hp.value;
    let newRec = this.data.data.attributes.recoveries.value;
    if (!free) {newRec -= 1;}
    if (apply) {newHp = Math.min(this.data.data.attributes.hp.max, Math.max(newHp, 0) + roll.total);}
    this.update({
      'data.attributes.recoveries.value': newRec,
      'data.attributes.hp.value': newHp
    });
    return roll.total;
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
    let terms = ['@mod', '@background'];
    let flavor = `${abl.label} Ability Test`;

    // Call the roll helper utility
    DiceArchmage.d20Roll({
      event: event,
      terms: terms,
      data: {
        mod: abl.mod + this.data.data.attributes.level.value + (this.data.data.incrementals?.skills ? 1 : 0),
        background: 0
      },
      backgrounds: this.data.data.backgrounds,
      title: flavor,
      alias: this.data.name,
      actor: this,
      ability: abl
    });
  }
}

/**
 * Character sheet update hook
 * Automates update of base stats based on class
 *
 * @return {undefined}
 */

export function archmagePreUpdateCharacterData(actor, data, options, id) {
  if (actor.data.type == 'character'
    && options.diff
    && data.data !== undefined
    && data.data.details !== undefined
    && data.data.details.class !== undefined
    && game.settings.get('archmage', 'automateBaseStatsFromClass')
    ) {
    // Here we received an update of the class name for a character

    // Find known classes
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    let classText = data.data.details.class.value;
    classText = classText ? classText.toLowerCase() : '';
    let matchedClasses = classText.match(classRegex);

    if (matchedClasses !== null) {
      // Remove duplicates and Sort to avoid problems with future matches
      matchedClasses = [...new Set(matchedClasses)].sort();

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
        shld_pen: new Array(),
        pd: new Array(),
        md: new Array(),
        rec: new Array(),
        mWpn_1h: new Array(),
        mWpn_2h: new Array(),
        rWpn: new Array(),
        skilledWarrior: new Array()
      }

      matchedClasses.forEach(function(item) {
        base.hp.push(CONFIG.ARCHMAGE.classes[item].hp);
        base.ac.push(CONFIG.ARCHMAGE.classes[item].ac_lgt);
        if (CONFIG.ARCHMAGE.classes[item].ac_hvy_pen < 0) {base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy_pen);}
        else {base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy);}
        base.shld_pen.push(CONFIG.ARCHMAGE.classes[item].shld_pen);
        base.pd.push(CONFIG.ARCHMAGE.classes[item].pd);
        base.md.push(CONFIG.ARCHMAGE.classes[item].md);
        base.rec.push(CONFIG.ARCHMAGE.classes[item].rec_die);
        base.mWpn_1h.push(CONFIG.ARCHMAGE.classes[item].wpn_1h);
        if (CONFIG.ARCHMAGE.classes[item].wpn_2h_pen < 0) {base.mWpn_2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h_pen);}
        else {base.mWpn_2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h);}
        base.rWpn.push(CONFIG.ARCHMAGE.classes[item].wpn_rngd);
        base.skilledWarrior.push(CONFIG.ARCHMAGE.classes[item].skilled_warrior);
      });

      // Combine base stats based on detected classes
      if (base.skilledWarrior.length == 1) base.skilledWarrior = true;
      else base.skilledWarrior = base.skilledWarrior.every(a => a);
      base.hp = (base.hp.reduce((a, b) => a + b, 0) / base.hp.length);
      base.ac = Math.max.apply(null, base.ac);
      if (Math.min.apply(null, base.ac_hvy) > 0) base.ac = Math.max.apply(null, base.ac_hvy);
      base.shld_pen = base.shld_pen.some(a => a < 0);
      base.pd = Math.max.apply(null, base.pd);
      base.md = Math.max.apply(null, base.md);
      if (base.rec.length == 1) base.rec = base.rec[0];
      else base.rec = (Math.ceil(base.rec.reduce((a, b) => a/2 + b/2) / base.rec.length) * 2);
      base.mWpn_1h = Math.max.apply(null, base.mWpn_1h);
      base.mWpn_2h_pen = base.mWpn_2h.some(a => a < 0);
      base.mWpn_2h = Math.max.apply(null, base.mWpn_2h);
      base.rWpn = Math.max.apply(null, base.rWpn);
      let jabWpn = 6;
      let punchWpn = 8;
      let kickWpn = 10;
      if (!base.skilledWarrior) {
        base.mWpn_1h = Math.max(base.mWpn_1h - 2, 4);
        base.mWpn_2h = Math.max(base.mWpn_2h - 2, 4);
        base.rWpn = Math.max(base.rWpn - 2, 4);
        jabWpn -= 2;
        punchWpn -= 2;
        kickWpn -= 2;
      }
      let lvl = actor.data.data.attributes.level.value;
      // Pick best weapon (and possibly shield)
      // if (!base.shld_pen) {base.ac += 1; base.mWpn = base.mWpn_1h;}
      // else if (!base.mWpn_2h_pen
        // && JSON.stringify(matchedClasses) != JSON.stringify(['ranger'])
        // ) {base.mWpn = base.mWpn_2h;}
      // else {base.mWpn = base.mWpn_1h;}
      base.mWpn = base.mWpn_1h;

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
