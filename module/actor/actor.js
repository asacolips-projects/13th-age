import { ArchmageUtility } from '../setup/utility-classes.js';
import { DiceArchmage } from './dice.js';

/**
 * Extend the base Actor class to implement additional logic specialized for D&D5e.
 */
export class ActorArchmage extends Actor {

  /** @override */
  async rollInitiative({createCombatants=false, rerollInitiative=false, initiativeOptions={}}={}) {
    // Obtain (or create) a combat encounter
    let combat = game.combat;
    if ( !combat ) {
      if ( game.user.isGM && canvas.scene ) {
        combat = await game.combats.object.create({scene: canvas.scene._id, active: true});
      }
      else {
        ui.notifications.warn(game.i18n.localize("COMBAT.NoneActive"));
        return null;
      }
    }

    // Create new combatants
    if ( createCombatants ) {
      const tokens = this.isToken ? [this.token] : this.getActiveTokens();
      const createData = tokens.reduce((arr, t) => {
        if ( t.inCombat ) return arr;
        arr.push({tokenId: t.id, hidden: t.data.hidden});
        return arr;
      }, []);
      await combat.createEmbeddedEntity("Combatant", createData);
    }

    // Iterate over combatants to roll for
    const combatantIds = combat.combatants.reduce((arr, c) => {
      if ( !c.actor ) return arr;
      if ( (c.actor.id !== this.id) || (this.isToken && (c.tokenId !== this.token.id)) ) return arr;
      if ( c.initiative && !rerollInitiative ) return arr;
      arr.push(c._id);
      return arr;
    }, []);
    return combatantIds.length ? combat.rollInitiative(combatantIds, initiativeOptions) : combat;
  }

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

    // Initialize the model for data calculations.
    let model = game.system.model.Actor[actorData.type];

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

    var acBonus = 0 + missingRecPenalty;
    var mdBonus = 0 + missingRecPenalty;
    var pdBonus = 0 + missingRecPenalty;

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
    data.attributes.init.mod = data.abilities.dex.mod + (data.attributes.init.value || 0) + improvedInit + (data.attributes.level.value || 0);

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

      if (!data.attributes.saves) data.attributes.saves = model.attributes.saves;

      data.attributes.saves.easy = minimumOf0(6 - saveBonus);
      data.attributes.saves.normal = minimumOf0(11 - saveBonus);
      data.attributes.saves.hard = minimumOf0(16 - saveBonus);
      data.attributes.disengage = minimumOf0(11 - disengageBonus - (data.attributes?.disengageBonus ?? 0));

      data.attributes.ac.value = Number(data.attributes.ac.base) + Number(median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod])) + Number(data.attributes.level.value) + Number(acBonus);
      data.attributes.pd.value = Number(data.attributes.pd.base) + Number(median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod])) + Number(data.attributes.level.value) + Number(pdBonus);
      data.attributes.md.value = Number(data.attributes.md.base) + Number(median([data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod])) + Number(data.attributes.level.value) + Number(mdBonus);

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

      // Get the recovery level and dice.
      let recoveryLevel = Number(data.attributes.level?.value) ?? 1;
      // Fall back to a d8 if the recovery dice is invalid.
      let recoveryDice = 'd8';
      if (typeof data.attributes?.recoveries?.dice == 'string') {
        recoveryDice = data.attributes.recoveries.dice;
      }

      // Calculate the average of the formula.
      let recoveryAvg = (Number(recoveryDice.replace('d', '')) + 1) / 2;
      if (isNaN(recoveryAvg)) recoveryAvg = 4.5;  // Averaged 1d8

      // Calculate the total average recovery.
      data.attributes.recoveries.avg = Math.floor(recoveryLevel * recoveryAvg) + (data.abilities.con.mod * levelMultiplier);

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

      if (data.attributes.weapon?.jab?.dice) monkAttacks.jab.dice = duplicate(data.attributes.weapon.jab.dice);
      if (data.attributes.weapon?.kick?.dice) monkAttacks.kick.dice = duplicate(data.attributes.weapon.kick.dice);
      if (data.attributes.weapon?.punch?.dice) monkAttacks.punch.dice = duplicate(data.attributes.weapon.punch.dice);

      for (let [key, value] of Object.entries(monkAttacks)) {
        let abil = value.abil ? value.abil.split('/') : ['dex', 'str'];
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
      value: (game.combats != undefined && game.combat != null) ? ArchmageUtility.getEscalation(game.combat) : 0,
    };

    // Fallback for attack modifier
    if (data.attributes.attackMod === undefined) data.attributes.attackMod = model.attributes.attackMod;
    data.attributes.attackMod.missingRecPenalty = missingRecPenalty;

    if (actorData.type === 'character') {
      // TODO: This also calculated in ArchmageUtility.replaceRollData(). That
      // duplicate code needs to be retired from the utility class if possible.
      data.attributes.standardBonuses = {
        value: data.attributes.level.value + data.attributes.escalation.value + data.attributes.attackMod.missingRecPenalty + data.attributes.attackMod.value
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
    let model = game.system.model.Actor.character;

    // Level, experience, and proficiency
    data.attributes.level.value = parseInt(data.attributes.level.value);

    // Build out the icon results structure if it hasn't been
    // previously initialized.
    if (data?.icons) {
      for (let [k,v] of Object.entries(data.icons)) {
        if (v.results && v.results.length != v.bonus.value) {
          let results = [];
          for (let i = 0; i < v.bonus.value; i++) {
            results[i] = v.results[i] ?? 0
          }
          v.results = results;
        }
      }
    }

    // Handle one unique thing.
    if (!data.details.out.value && data?.out?.value) {
      if (data.out.value.length > 0) data.details.out.value = data.out.value;

      delete data.out;
    }

    // Find known classes
    if (!game.settings.get('archmage', 'automateBaseStatsFromClass')) {
      let classList = Object.keys(CONFIG.ARCHMAGE.classList);
      let classRegex = new RegExp(classList.join('|'), 'g');

      var classText = data.details.class?.value;
      classText = classText ? classText.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';

      var matchedClasses = classText.match(classRegex);
      if (matchedClasses !== null) {matchedClasses = [...new Set(matchedClasses)].sort();}
      data.details.detectedClasses = matchedClasses;
    }

    // Fallbacks for missing melee weapon options
    if (data.attributes.weapon.melee.shield === undefined) data.attributes.weapon.melee.shield = model.attributes.weapon.melee.shield;
    if (data.attributes.weapon.melee.dualwield === undefined) data.attributes.weapon.melee.dualwield = model.attributes.weapon.melee.dualwield;
    if (data.attributes.weapon.melee.twohanded === undefined) data.attributes.weapon.melee.twohanded = model.attributes.weapon.melee.twohanded;

    // Fallbacks for missing custom resources
    if (!data.resources) data.resources = model.resources;
    if (!data.resources.spendable) data.resources.spendable = model.resources.spendable;
    if (!data.resources.spendable.custom1) data.resources.spendable.custom1 = model.resources.spendable.custom1;
    if (!data.resources.spendable.custom2) data.resources.spendable.custom2 = model.resources.spendable.custom2;
    if (!data.resources.spendable.custom3) data.resources.spendable.custom3 = model.resources.spendable.custom3;

    // Enable resources based on detected classes
    if (data.details.detectedClasses) {
      if (data.resources.perCombat) {
        // Momentum
        if (!data.resources.perCombat.momentum) data.resources.perCombat.momentum = model.resources.perCombat.momentum;
        data.resources.perCombat.momentum.enabled = data.details.detectedClasses.includes("rogue");
        // Command Points
        if (!data.resources.perCombat.commandPoints) data.resources.perCombat.commandPoints = model.resources.perCombat.commandPoints;
        data.resources.perCombat.commandPoints.enabled = data.details.detectedClasses.includes("commander");
        // Focus
        if (!data.resources.perCombat.focus) data.resources.perCombat.focus = model.resources.perCombat.focus;
        data.resources.perCombat.focus.enabled = data.details.detectedClasses.includes("occultist");
      }
      if (data.resources.spendable) {
        if (!data.resources.spendable.ki) data.resources.spendable.ki = model.resources.spendable.ki;
        data.resources.spendable.ki.enabled = data.details.detectedClasses.includes("monk");
      }
    }

    // Handle death saves.
    if (!data.attributes.saves) data.attributes.saves = model.attributes.saves;
    if (!data.attributes.saves.deathFails) data.attributes.saves.deathFails = model.attributes.saves.deathFails;
    if (!data.attributes.saves.lastGaspFails) data.attributes.saves.lastGaspFails = model.attributes.saves.lastGaspFails;

    // Update death save count.
    let deathCount = data.attributes.saves.deathFails.value;
    data.attributes.saves.deathFails.steps = [false, false, false, false];
    for (let i = 0; i < deathCount; i++) {
      data.attributes.saves.deathFails.steps[i] = true;
    }

    // Update last gasp save count.
    let lastGaspsCount = data.attributes.saves.lastGaspFails.value;
    data.attributes.saves.lastGaspFails.steps = [false, false, false, false];
    for (let i = 0; i < lastGaspsCount; i++) {
      data.attributes.saves.lastGaspFails.steps[i] = true;
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
    let model = game.system.model.Actor.npc;
  }

  /* -------------------------------------------- */

  /**
   * Recovery roll dialog.
   *
   * @return {undefined}
   */
  rollRecoveryDialog(event) {
    let actorData = this.data.data;
    let rolled = false;
    let avg = this.getFlag('archmage', 'averageRecoveries');
    let strRec = this.getFlag('archmage', 'strongRecovery');
    let data = {bonus: "", average: avg, createMessage: true};

    if (event.shiftKey) {
      this.rollRecovery(data);
      return;
    }

    // Render modal dialog
    let template = 'systems/archmage/templates/chat/recovery-dialog.html';
    let dialogData = {
      warning: strRec ? "Will ignore bonus from Strong Recovery." : "",
      avg: avg ? "checked" : ""
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
              data.label = 'Free';
              data.free = true;
              rolled = true;
            }
          },
          pot1: {
            label: 'Potion (Adv.)',
            callback: () => {
              data.label = 'Adventurer Potion';
              data.bonus = "+1d8";
              data.max = 30;
              rolled = true;
            }
          },
          pot2: {
            label: 'Potion (Cha.)',
            callback: () => {
              data.label = 'Champion Potion';
              data.bonus = "+2d8";
              data.max = 60;
              rolled = true;
            }
          },
          pot3: {
            label: 'Potion (Epic)',
            callback: () => {
              data.label = 'Epic Potion';
              data.bonus = "+3d8";
              data.max = 100;
              rolled = true;
            }
          },
          pot4: {
            label: 'Potion (Iconic)',
            callback: () => {
              data.label = 'Iconic Potion';
              data.bonus = "+4d8";
              data.max = 130;
              rolled = true;
            }
          },
        },
        default: 'normal',
        close: html => {
          if (rolled) {
            data.bonus += html.find('[name="bonus"]').val();
            data.apply = html.find('[name="apply"]').is(':checked');
            data.average = html.find('[name="average"]').is(':checked');
            this.setFlag('archmage', 'averageRecoveries', data.average);
            this.rollRecovery(data);
          }
        }
      }).render(true);
    });
  }

  /* -------------------------------------------- */

  /**
   * Recovery roll.
   * @param data object{bonus: "+X", max: 0, free: false, label: "", apply: true}
   * @param print boolean
   *
   * @return {Roll} The rolled roll for the recovery
   */
  async rollRecovery(data) {
    data.bonus = (data.bonus !== undefined) ? data.bonus : "";
    data.max = (data.max !== undefined) ? data.max : 0;
    data.free = (data.free !== undefined) ? data.free : false;
    data.label = (data.label !== undefined) ? data.label+" Recovery" : "Recovery";
    data.apply = (data.apply !== undefined) ? data.apply : true;
    data.average = (data.average !== undefined) ? data.average : this.getFlag('archmage', 'averageRecoveries');
    data.createMessage = (data.createMessage !== undefined) ? data.createMessage : false;
    let actorData = this.data.data;
    let totalRecoveries = actorData.attributes.recoveries.value;
    data.label += (Number(totalRecoveries) < 1) ? ' (Half)' : ''
    let formula = actorData.attributes.level.value.toString() + actorData.attributes.recoveries.dice + '+' + actorData.abilities.con.dmg.toString();

    if (data.average) {
      formula = this.data.data.attributes.recoveries.avg;
    } else if (this.getFlag('archmage', 'strongRecovery')) {
      // Handle strong recovery.
      formula = (actorData.attributes.level.value + actorData.tier).toString() + actorData.attributes.recoveries.dice + 'k' + actorData.attributes.level.value.toString() + '+' + actorData.abilities.con.dmg.toString();
    }

    // Add bonus if any
    if (data.bonus !== "") {
      if (!['+', '-'].includes(data.bonus[0]) || isNaN(parseInt(data.bonus))) {
        ui.notifications.error('"'+data.bonus+'" '+game.i18n.localize("ARCHMAGE.UI.errBonus"));
        return;
      }
      formula = `${formula}${data.bonus}`;
    }

    // Half healing for recoveries we do NOT have
    if (Number(totalRecoveries) <= 0) {
      formula = `floor((${formula})/2)`;
    }

    // If max is set, handle it
    if (data.max > 0) {
      formula = `min((${formula}), ${data.max})`;
    }

    let roll = new Roll(`${formula}`);

    if (data.createMessage) {
      // Basic template rendering data
      const template = `systems/archmage/templates/chat/recovery-card.html`
      const templateData = {actor: this, label: data.label, formula: formula};
      // Basic chat message data
      const chatData = {
        user: game.user._id, speaker: {actor: this._id, token: this.token,
        alias: this.name, scene: game.user.viewedScene}
      };

      // Toggle default roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
      if (rollMode === "blindroll") chatData["blind"] = true;

      // Render the template
      chatData["content"] = await renderTemplate(template, templateData);
      // Create the chat message
      let msg = await ChatMessage.create(chatData, {displaySheet: false});
      // Get the roll from the chat message
      let contentHtml = $(chatData.content);
      let row = $(contentHtml.find('.card-prop')[0]);
      let roll_html = $(row.find('.inline-result'));
      roll = Roll.fromJSON(unescape(roll_html.data('roll')));
    } else {
      // Perform the roll ourselves
      roll.roll();
    }

    // If 3d dice are enabled, handle them
    if (game.dice3d) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }

    let newHp = this.data.data.attributes.hp.value;
    let newRec = this.data.data.attributes.recoveries.value;
    if (!data.free) {newRec -= 1;}
    if (data.apply) {newHp = Math.min(this.data.data.attributes.hp.max, Math.max(newHp, 0) + roll.total);}
    this.update({
      'data.attributes.recoveries.value': newRec,
      'data.attributes.hp.value': newHp
    });
    return {roll: roll, total: roll.total};
  }

  async restQuick() {
    let templateData = {
      actor: this,
      usedRecoveries: 0,
      gainedHp: 0,
      resources: [],
      items: []
    };
    let updateData = {};

    // Recoveries & hp
    let baseHp = Math.max(this.data.data.attributes.hp.value, 0);

    while (baseHp + templateData.gainedHp < this.data.data.attributes.hp.max/2) {
      // Roll recoveries until we are above staggered
      let rec = await this.rollRecovery({apply: false}, false);
      templateData.gainedHp += rec.total;
      templateData.usedRecoveries += 1;
    }
    updateData['data.attributes.recoveries.value'] = this.data.data.attributes.recoveries.value - templateData.usedRecoveries;
    updateData['data.attributes.hp.value'] = Math.min(this.data.data.attributes.hp.max, Math.max(this.data.data.attributes.hp.value, 0) + templateData.gainedHp);

    // Update actor at this point (items are updated separately)
    if ( !isObjectEmpty(updateData) ) {
      this.update(updateData);
    }

    // Items (Powers)
    for (let i = 0; i < this.data.items.length; i++) {
      let item = this.data.items[i];
      let maxQuantity = item.data?.maxQuantity?.value ?? 1;
      if (item.type == "power" && maxQuantity) {
        // Recharge powers.
        let rechAttempts = maxQuantity - item.data.quantity.value;
        if (game.settings.get('archmage', 'rechargeOncePerDay')) {
          rechAttempts = Math.max(rechAttempts-item.data.rechargeAttempts.value, 0)
        }
        // Per battle powers.
        if (item.data.powerUsage.value == 'once-per-battle'
          && item.data.quantity.value < maxQuantity) {
          await this.updateOwnedItem({
            _id: item._id,
            data: {quantity: {value: maxQuantity}}
          });
          templateData.items.push({
            key: item.name,
            message: `${game.i18n.localize("ARCHMAGE.CHAT.ItemReset")} ${maxQuantity}`
          });
        } else if (item.data.recharge.value > 0 && rechAttempts > 0) {
          // This captures other as well
          let successes = 0;
          for (let j = 0; j < rechAttempts; j++) {
            let roll = await this.items.get(item._id).recharge({createMessage: false});
            if (roll.total >= item.data.recharge.value) {
              successes++;
              templateData.items.push({
                key: item.name,
                message: `${game.i18n.localize("ARCHMAGE.CHAT.RechargeSucc")} (${roll.total} >= ${item.data.recharge.value})`
              });
            } else {
              templateData.items.push({
                key: item.name,
                message: `${game.i18n.localize("ARCHMAGE.CHAT.RechargeFail")} (${roll.total} < ${item.data.recharge.value})`
              });
            }
          }
        }
      }
    }

    // Print outcomes to chat
    const template = `systems/archmage/templates/chat/rest-short-card.html`
    const chatData = {
      user: game.user._id, speaker: {actor: this._id, token: this.token,
      alias: this.name, scene: game.user.viewedScene}
    };
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
    if (rollMode === "blindroll") chatData["blind"] = true;
    chatData["content"] = await renderTemplate(template, templateData);
    let msg = await ChatMessage.create(chatData, {displaySheet: false});
  }

  async restFull() {
    let templateData = {
      actor: this,
      resources: [],
      items: []
    };
    let updateData = {}

    // Recoveries & hp
    updateData['data.attributes.recoveries.value'] = this.data.data.attributes.recoveries.max;
    updateData['data.attributes.hp.value'] = this.data.data.attributes.hp.max;

    // Resources
    if (this.data.data.resources.spendable.ki.enabled
      && this.data.data.resources.spendable.ki.current < this.data.data.resources.spendable.ki.max) {
      updateData['data.resources.spendable.ki.current'] = this.data.data.resources.spendable.ki.max;
      templateData.resources.push({
        key: game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.ki"),
        message: `${game.i18n.localize("ARCHMAGE.CHAT.KiReset")} ${this.data.data.resources.spendable.ki.max}`
      });
    }
    for (let idx of ["1", "2", "3"]) {
      let resourcePathName = "custom"+idx;
      let resourceName = this.data.data.resources.spendable[resourcePathName].label;
      let curr = this.data.data.resources.spendable[resourcePathName].current;
      let max = this.data.data.resources.spendable[resourcePathName].max;
      if (this.data.data.resources.spendable[resourcePathName].enabled && max && max && curr < max) {
        let path = `data.resources.spendable.${resourcePathName}.current`;
        updateData[path] = max;
        templateData.resources.push({
          key: resourceName,
          message: `${game.i18n.localize("ARCHMAGE.CHAT.KiReset")} ${max}`
        });
      }
    }

    // Update actor at this point (items are updated separately)
    if ( !isObjectEmpty(updateData) ) {
      this.update(updateData);
    }

    // Items (Powers)
    for (let i = 0; i < this.data.items.length; i++) {
      let item = this.data.items[i];

      if (item.type != 'power') continue;

      let usageArray = ['once-per-battle','daily','recharge'];
      let fallbackQuantity = usageArray.includes(item.data.powerUsage.value) || item.data.quantity.value !== null ? 1 : null;
      let maxQuantity = item.data?.maxQuantity?.value ?? fallbackQuantity;
      if (maxQuantity && item.data.quantity.value < maxQuantity) {
        await this.updateOwnedItem({
          _id: item._id,
          data: {
            quantity: {value: maxQuantity},
            rechargeAttempts: {value: 0}
            }
        });
        templateData.items.push({
          key: item.name,
          message: `${game.i18n.localize("ARCHMAGE.CHAT.ItemReset")} ${maxQuantity}`
        });
      }
    }

    // Print outcomes to chat
    const template = `systems/archmage/templates/chat/rest-full-card.html`
    const chatData = {
      user: game.user._id, speaker: {actor: this._id, token: this.token,
      alias: this.name, scene: game.user.viewedScene}
    };
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
    if (rollMode === "blindroll") chatData["blind"] = true;
    chatData["content"] = await renderTemplate(template, templateData);
    let msg = await ChatMessage.create(chatData, {displaySheet: false});
  }

  /* -------------------------------------------- */

  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param abilityId {String}    The ability id (e.g. "str")
   *
   * @return {undefined}
   */
  rollAbility(abilityId, background = null) {
    this.rollAbilityTest(abilityId, background);
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
  rollAbilityTest(abilityId, background = null) {
    let abl = null;
    let bg = null;
    let terms = ['@abil', '@lvl', '@bg'];
    let flavor = '';
    let abilityName = '';
    let backgroundName = '';

    if (abilityId) {
      abl = this.data.data.abilities[abilityId]  ?? null;
      flavor = abl ? `${abl.label} Ability Check` : 'Ability Check';
      abilityName = abl.label ? abl.label : '';
    }

    if (background) {
      bg = Object.entries(this.data.data.backgrounds).find(([k,v]) => {
        return v.name.value && (v.name.value.safeCSSId() == background.safeCSSId());
      });
      if (bg) {
        flavor = `${bg[1].name.value} Background Check`;
        backgroundName = Number(bg[1].bonus.value) >= 0 ? `+${bg[1].bonus.value} ${bg[1].name.value}` : `${bg[1].bonus.value} ${bg[1].name.value}`;
      }
      else {
        flavor = 'Background Check';
      }
    }

    // Call the roll helper utility
    DiceArchmage.d20Roll({
      event: event,
      terms: terms,
      data: {
        abil: abl ? abl.mod : 0,
        lvl: this.data.data.attributes.level.value + (this.data.data.incrementals?.skills ? 1 : 0),
        bg: bg ? bg[1].bonus.value : 0,
        abilityName: abilityName,
        backgroundName: backgroundName,
        abilityCheck: Boolean(abl),
        backgroundCheck: Boolean(bg)
      },
      abilities: this.data.data.abilities,
      backgrounds: this.data.data.backgrounds,
      title: flavor,
      alias: this.data.name,
      actor: this,
      ability: abl,
      background: bg
    });
  }

  /**
   * Auto levelup monsters
   * Creates a copy of an NPC actor with the requested delta in levels
   *
   * @return {undefined}
   */

  async autoLevelActor(delta) {
    if (!this.data.type == 'npc') return;

    let suffix = ` (+${delta})`;
    if (delta < 0) suffix = ` (-${delta})`;
    let level = this.data.data.attributes.level.value + delta;
    if (level < 0) {
      ui.notifications.warn("Level can't decrease below 0");
      return;
    } else if (level > 15) {
      ui.notifications.warn("Level can't increase above 15");
      return;
    }
    // TODO: replace with explicit coefficients from book?
    let mul = Math.pow(1.25, delta);
    let overrideData = {
      'name': this.data.name+suffix,
      'data.attributes.level.value': level,
      'data.attributes.ac.value': this.data.data.attributes.ac.value + delta,
      'data.attributes.pd.value': this.data.data.attributes.pd.value + delta,
      'data.attributes.md.value': this.data.data.attributes.md.value + delta,
      // Initiative already depends directly on level
      'data.attributes.hp.value': Math.round(this.data.data.attributes.hp.value * mul),
      'data.attributes.hp.max': Math.round(this.data.data.attributes.hp.max * mul),
    };
    let actor = await this.clone(overrideData);
    let manualCheck = false;

    // Fix attack and damage
    let atkFilter = /^\[\[1*d20\s*\+\s*(\d+)([\S\s]*)\]\]([\S\s]*)/;
    let hitFilter = /^(?:\[\[)?([\d+d]?\d+)(?:\]\])?([\S\s]*)/;
    let specialHitFilter = /^([\D]*?)(?:\[\[)?(\d+?d?\d+)(?:\]\])?([\S\s]*)/;
    let inlineRollFilter = /(\d+?d?\d+)/;
    for (let i = 0; i < actor.data.items.length; i++) {
      let item = this.data.items[i];
      overrideData = {'_id': item._id};
      if (item.type == 'action') {
        let atk = atkFilter.exec(item.data.attack.value);
        let newAtk = parseInt(atk[1])+delta;
        overrideData['data.attack.value'] = `[[d20+${newAtk}${atk[2]}]]${atk[3]}`;
        for (let key of ["hit", "miss"]) {
          if (!item.data[key].value) continue;
          let parsed = hitFilter.exec(item.data[key].value);
          if (parsed && parsed[1]) {
            let newDmg = Math.round(parseInt(parsed[1])*mul);
            overrideData[`data.${key}.value`] = `[[${newDmg}]]${parsed[2]}`;
          } else manualCheck = true;
          // Warn if we may have missed an inline roll
          if ((item.data[key].value.match(inlineRollFilter) || []).length > 1) manualCheck = true;
        }
        for (let key of ["hit1", "hit2", "hit3"]) {
          if (!item.data[key].value) continue;
          let parsed = specialHitFilter.exec(item.data[key].value);
          if (parsed && parsed[2]) {
            if (parsed[2].includes("d")) {
              // TODO: handle scaling dice
              manualCheck = true;
              continue;
            }
            let newDmg = Math.round(parseInt(parsed[2])*mul);
            overrideData[`data.${key}.value`] = `${parsed[1]}[[${newDmg}]]${parsed[3]}`;
          } else manualCheck = true;
          // Warn if we may have missed an inline roll
          if ((item.data[key].value.match(inlineRollFilter) || []).length > 1) manualCheck = true;
        }
      }
      else if (item.type == 'trait') { // TODO: or nastierspecial?
        // TODO
        continue;
      }
      else continue;
      actor.updateOwnedItem(overrideData);
    }
    if (manualCheck) ui.notifications.warn("Complex NPC, manual check required!");
  }
}


/**
 * Character sheet update hook
 * Automates update of base stats based on class
 *
 * @return {undefined}
 */

export function archmagePreUpdateCharacterData(actor, data, options, id) {
  if (!actor.data.type == 'character'
    || !options.diff
    || data.data === undefined) {
      return;
  }

  if (data.data.attributes !== undefined
    && data.data.attributes.weapon !== undefined
    && data.data.attributes.weapon.melee !== undefined
    && data.data.attributes.weapon.melee.dice === undefined) {
    // Here we received an update of the melee weapon checkboxes

    if (typeof actor.data.data.attributes.weapon.melee.dice !== 'string') {
        actor.data.data.attributes.weapon.melee.dice = "d8"; // Fallback
    }
    let mWpn = parseInt(actor.data.data.attributes.weapon.melee.dice.substring(1));
    if (isNaN(mWpn)) mWpn = 8; // Fallback
    let lvl = actor.data.data.attributes.level.value;
    data.data.attributes.attackMod = {value: actor.data.data.attributes.attackMod.value};
    let wpn = {shieldPen: 0, twohandedPen: 0};
    if (actor.data.data.attributes.weapon.melee.twohanded) {
      wpn.mWpn2h = mWpn;
      wpn.mWpn1h = Math.max(mWpn - 2, 4);
    } else {
      wpn.mWpn2h = Math.min(mWpn + 2, 12);
      wpn.mWpn1h = mWpn;
    }

    // Compute penalties due to equipment (if classes known)
    if (actor.data.data.details.detectedClasses) {
      let shieldPen = new Array();
      let twohandedPen = new Array();
      let mWpn1h = new Array();
      let mWpn2h = new Array();
      let skilledWarrior = new Array();
      actor.data.data.details.detectedClasses.forEach(function(item) {
        shieldPen.push(CONFIG.ARCHMAGE.classes[item].shld_pen);
        mWpn1h.push(CONFIG.ARCHMAGE.classes[item].wpn_1h);
        mWpn2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h);
        if (CONFIG.ARCHMAGE.classes[item].wpn_2h > CONFIG.ARCHMAGE.classes[item].wpn_1h
          && CONFIG.ARCHMAGE.classes[item].wpn_2h >= CONFIG.ARCHMAGE.classes.monk.wpn_2h) {
          // Handles special case of monk MC with classes that don't benefit from 2h
          twohandedPen.push(CONFIG.ARCHMAGE.classes[item].wpn_2h_pen);
        }
        skilledWarrior.push(CONFIG.ARCHMAGE.classes[item].skilled_warrior)
      });
      wpn.shieldPen = Math.max.apply(null, shieldPen);
      if (twohandedPen.length > 0) wpn.twohandedPen = Math.max.apply(null, twohandedPen);
      mWpn1h = Math.max.apply(null, mWpn1h);
      mWpn2h = Math.max.apply(null, mWpn2h);
      if (skilledWarrior.length > 1 && !skilledWarrior.every(a => a)) {
        mWpn1h = Math.max(mWpn1h - 2, 4);
        mWpn2h = Math.max(mWpn2h - 2, 4);
      }
      // Only use class values if the current values haven't been tampered with
      if (actor.data.data.attributes.weapon.melee.twohanded && wpn.mWpn2h == mWpn2h) {
        wpn.mWpn1h = mWpn1h;
      }
      else if (!actor.data.data.attributes.weapon.melee.twohanded && wpn.mWpn1h == mWpn1h) {
        wpn.mWpn2h = mWpn2h;
      }
      else { // Values differ from rules, don't do anything
        wpn.shieldPen = 0;
        wpn.twohandedPen = 0;
      }
    }

    if (data.data.attributes.weapon.melee.shield !== undefined) {
      // Here we received an update of the shield checkbox
      if (data.data.attributes.weapon.melee.shield) {
        // Adding a shield
        data.data.attributes.ac = {base: actor.data.data.attributes.ac.base + 1};
        data.data.attributes.attackMod.value += wpn.shieldPen;
        if (actor.data.data.attributes.weapon.melee.twohanded) {
          // Can't wield both a two-handed weapon and a shield
          mWpn = wpn.mWpn1h;
          data.data.attributes.weapon.melee.twohanded = false;
          data.data.attributes.attackMod.value -= wpn.twohandedPen;
        }
        else if (actor.data.data.attributes.weapon.melee.dualwield) {
          // Can't dual-wield with a shield
          data.data.attributes.weapon.melee.dualwield = false;
        }
      } else {
        data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
        data.data.attributes.attackMod.value -= wpn.shieldPen;
      }
    }

    else if (data.data.attributes.weapon.melee.dualwield !== undefined) {
      // Here we received an update of the dual wield checkbox
      if (data.data.attributes.weapon.melee.dualwield) {
        if (actor.data.data.attributes.weapon.melee.twohanded) {
          // Can't wield two two-handed weapons
          mWpn = wpn.mWpn1h;
          data.data.attributes.weapon.melee.twohanded = false;
          data.data.attributes.attackMod.value -= wpn.twohandedPen;
        }
        else if (actor.data.data.attributes.weapon.melee.shield) {
          // Can't duel-wield with a shield
          data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
          data.data.attributes.weapon.melee.shield = false;
          data.data.attributes.attackMod.value -= wpn.shieldPen;
        }
      }
    }

    else if (data.data.attributes.weapon.melee.twohanded !== undefined) {
      // Here we received an update of the two-handed checkbox
      if (data.data.attributes.weapon.melee.twohanded) {
        mWpn = wpn.mWpn2h;
        data.data.attributes.attackMod.value += wpn.twohandedPen;
        if (actor.data.data.attributes.weapon.melee.shield) {
          // Can't wield both a two-handed weapon and a shield
          data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
          data.data.attributes.weapon.melee.shield = false;
          data.data.attributes.attackMod.value -= wpn.shieldPen;
        }
        else if (actor.data.data.attributes.weapon.melee.dualwield) {
          // Can't wield two two-handed weapons
          data.data.attributes.weapon.melee.dualwield = false;
        }
      } else {
        mWpn = wpn.mWpn1h;
        data.data.attributes.attackMod.value -= wpn.twohandedPen;
      }
    }

    data.data.attributes.weapon.melee.dice = `d${mWpn}`;
    data.data.attributes.weapon.melee.value = `${lvl}d${mWpn}`;
  }

  else if (data.data.details !== undefined
    && data.data.details.class !== undefined
    && game.settings.get('archmage', 'automateBaseStatsFromClass')
    ) {
    // Here we received an update of the class name for a character

    // Find known classes
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    let classText = data.data.details.class.value;

    // Exit early if the class text is invalid.
    if (typeof classText !== 'string') return;

    classText = classText ? classText.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    let matchedClasses = classText.match(classRegex);

    if (matchedClasses !== null) {
      // Remove duplicates and Sort to avoid problems with future matches
      matchedClasses = [...new Set(matchedClasses)].sort();

      // Check that the matched classes actually changed
      if (actor.data.data.details.matchedClasses !== undefined
        && JSON.stringify(actor.data.data.details.matchedClasses) == JSON.stringify(matchedClasses)
        ) {
        return;
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
      base.mWpn_2h_pen = base.mWpn_2h.every(a => a < 0);
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
      let shield = false;
      let dualwield = false;
      let twohanded = false;
      // Pick best weapon (and possibly shield)
      base.mWpn = base.mWpn_1h;
      if (matchedClasses.includes("monk")) {
        dualwield = true;
      }
      else if (!base.shld_pen) {
        base.ac += 1;
        shield = true;
      }
      else if (!base.mWpn_2h_pen && base.mWpn_2h > base.mWpn_1h) {
        base.mWpn = base.mWpn_2h;
        twohanded = true;
      }

      // Assign computed values
      data.data.attributes = {
        hp: {base: base.hp},
        ac: {base: base.ac},
        pd: {base: base.pd},
        md: {base: base.md},
        recoveries: {dice: `d${base.rec}`},
        weapon: {
          melee: {
            dice: `d${base.mWpn}`,
            value: `${lvl}d${base.mWpn}`,
            shield: shield,
            dualwield: dualwield,
            twohanded: twohanded
          },
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
