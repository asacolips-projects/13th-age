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
        combat = await game.combats.object.create({scene: canvas.scene.id, active: true});
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
      await combat.createEmbeddedDocuments("Combatant", createData);
    }

    // Iterate over combatants to roll for
    const combatantIds = combat.combatants.reduce((arr, c) => {
      if ( !c.actor ) return arr;
      if ( (c.actor.id !== this.id) || (this.isToken && (c.tokenId !== this.token.id)) ) return arr;
      if ( c.initiative && !rerollInitiative ) return arr;
      arr.push(c.id);
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
    // Reset all derived and effects data.
    this.data.reset();
    this.overrides = {};

    // Apply active effects in group 0 (ability scores, base attributes).
    this.applyActiveEffects('pre');

    // Prepare data, items, derived data, and effects.
    this.prepareBaseData();
    this.prepareEmbeddedEntities();

    // Apply activeEffects in group 1 (most properties).
    this.applyActiveEffects('default');
    this.prepareDerivedData();

    // Apply activeEffects to group 2 (standardBonuses).
    this.applyActiveEffects('post');
  }

  /** @inheritdoc */
  prepareBaseData() {
    // Get the Actor's data object
    const actorData = this.data;
    if (!actorData.img) actorData.img = CONST.DEFAULT_TOKEN;
    if (!actorData.name) actorData.name = "New " + this.entity;

    const data = actorData.data;
    const flags = actorData.flags;

    // Initialize the model for data calculations.
    let model = game.system.model.Actor[actorData.type];

    // Level, experience, and proficiency
    data.attributes.level.value = parseInt(data.attributes.level.value);
    // Set a copy of level in details in order to mimic 5e's data structure.
    data.details.level = data.attributes.level;

    // Fallback for attack modifier and defenses
    if (data.attributes.attackMod === undefined) data.attributes.attackMod = model.attributes.attackMod;

    // Prepare Character data
    if (actorData.type === 'character') {
      this._prepareCharacterData(data, model, flags);
    }
    else if (actorData.type === 'npc') {
      this._prepareNPCData(data, model, flags);
    }

    // Initiative
    var improvedInit = 0;
    if (flags.archmage) improvedInit = flags.archmage.improvedIniative ? 4 : 0;
    data.attributes.init.mod = (data.abilities?.dex?.mod || 0) + data.attributes.init.value + improvedInit + data.attributes.level.value;

    // Get the escalation die value.
    data.attributes.escalation = {
      value: (game.combats != undefined && game.combat != null) ? ArchmageUtility.getEscalation(game.combat) : 0,
    };

  }

  /**
   * Override applyActiveEffects() to allow staggered updates.
   *
   * @param {string} weight Determines which set of effects to apply.
   */
  applyActiveEffects(weight = 'default') {
    const overrides = this.overrides ? foundry.utils.flattenObject(this.overrides): {};

    // Extract non-disabled and relevant changes
    let relevant = (c => {return true;});
    switch (weight) {
      // Handle ability scores and base attributes.
      case 'pre':
        relevant = (c => {return c.key.match(/data\.(abilities\..*\.value|attributes\..*\.base)/g);});
        break;
      // Handle the non-special active effects.
      case 'default':
        relevant = (c => {return !c.key.includes('standardBonuses') && !c.key.includes('escalation');});
        break;
      // Handle escalation die.
      case 'ed':
        relevant = (c => {return c.key == 'data.attributes.escalation.value';});
        break;
      // Handle standard bonuses.
      case 'std':
        relevant = (c => {return c.key == 'data.attributes.standardBonuses.value';});
        break;
      // Handle remaining active effects.
      case 'post':
        relevant = (c => {return true;})
        break;
    }
    const changes = this.effects.reduce((changes, e) => {
      if ( e.data.disabled ) return changes;
      return changes.concat(e.data.changes.map(c => {
        c = foundry.utils.duplicate(c);
        c.effect = e;
        c.name = e.data.label;
        c.priority = c.priority ?? (c.mode * 10);
        return c;
      })).filter(relevant);
    }, []);

    // Apply stacking rules:
    // - Only worst penalty applies
    // - Bonuses stack so long as their source is different
    // - Item bonuses don't stack, but they aren't AEs anyway
    let uniqueChanges = [];
    let uniquePenalties = {};
    let uniqueBonuses = {};
    let uniqueBonusLabels = {};
    for ( let change of changes ) {
      if (change.mode != CONST.ACTIVE_EFFECT_MODES.ADD) {
        // 13A effects should never fall here, but if they do handle them
        uniqueChanges.push(change);
        continue;
      }
      let chngVal = Number(change.value);
      if (chngVal <= 0) { // Penalty, doesn't stack
        if (!uniquePenalties[change.key]) uniquePenalties[change.key] = change;
        else { // Check if the new penalty is worse than the earlier one
          if (chngVal < Number(uniquePenalties[change.key].value)) {
            uniquePenalties[change.key].value = change.value;
          }
        }
      } else { // Bonus, stacks if name is different
        if (!uniqueBonuses[change.key]) {
          uniqueBonuses[change.key] = change;
          uniqueBonusLabels[change.key] = {};
          uniqueBonusLabels[change.key][change.name] = chngVal;
        } else { // Check if we have other bonuses with the same name
          if (uniqueBonusLabels[change.key][change.name]) {
            // An effect with the same name already exists, use better one
            chngVal = Math.max(chngVal, uniqueBonusLabels[change.key][change.name]);
            uniqueBonuses[change.key].value = chngVal.toString();
            uniqueBonusLabels[change.key][change.name] = chngVal;
          } else {
            // No other effect with this name exists, stack
            uniqueBonusLabels[change.key][change.name] = chngVal;
            uniqueBonuses[change.key].value = (Object.values(uniqueBonusLabels[change.key]).reduce((a, b) => a + b)).toString();
          }
        }
      }
    }
    // Merge stacked bonuses into penalties to get overall change
    for (let change of Object.values(uniqueBonuses)) {
      if (!uniquePenalties[change.key]) uniquePenalties[change.key] = change;
      else uniquePenalties[change.key].value = (Number(uniquePenalties[change.key].value) + Number(change.value)).toString();
    }
    // Put everything together into an array of changes, once per target value
    uniqueChanges = uniqueChanges.concat(Object.values(uniquePenalties));

    // Organize changes by their application priority
    uniqueChanges.sort((a, b) => a.priority - b.priority);

    // Apply all changes of this phase
    for ( let change of uniqueChanges ) {
      // Skip anything we already applied
      if (overrides[change.key]) continue;

      // Apply effect
      const result = change.effect.apply(this, change);
      // Remember we already applied change for everything but @ed and @std
      if ( result !== null && !change.key.includes('standardBonuses') && !change.key.includes('escalation')) {
        overrides[change.key] = result;
      }
    }

    // Expand the set of final overrides
    this.overrides = foundry.utils.expandObject(overrides);
  }

  /** @inheritdoc */
  prepareEmbeddedEntities() {
    const embeddedTypes = this.constructor.metadata.embedded || {};
    for ( let cls of Object.values(embeddedTypes) ) {
      const collection = cls.metadata.collection;
      for ( let e of this[collection] ) {
        e.prepareData();
      }
    }
  }

  /** @inheritdoc */
  prepareDerivedData() {
    // Get the Actor's data object
    const actorData = this.data;
    const data = actorData.data;

    // Get the escalation die value.
    if (game.combats !== undefined && game.combat !== null) {
      data.attributes.escalation = {
        value: ArchmageUtility.getEscalation(game.combat)
      };
    }
    else {
      data.attributes.escalation = { value: 0 };
    }

    this.applyActiveEffects('ed');

    // Must recompute this here because the e.d. might have changed.
    data.attributes.standardBonuses = {
      value: data.attributes.level.value + data.attributes.escalation.value
    };

    this.applyActiveEffects('std')
  }

  /* -------------------------------------------- */

  /**
   * Prepare Character type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareCharacterData(data, model, flags) {

    // Find known classes
    if (!data.details.detectedClasses && data.details.class?.value) {
      let matchedClasses = ArchmageUtility.detectClasses(data.details.class.value);
      data.details.detectedClasses = matchedClasses;
    }

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

    // Fallbacks for potentially missing data
    // Coins
    if (!data.coins) data.coins = model.coins;
    // Weapons
    if (!data.attributes.weapon) data.attributes.weapon = model.attributes.weapon;
    if (!data.attributes.weapon.jab) data.attributes.weapon.jab = model.attributes.weapon.jab;
    if (!data.attributes.weapon.punch) data.attributes.weapon.punch = model.attributes.weapon.punch;
    if (!data.attributes.weapon.kick) data.attributes.weapon.kick = model.attributes.weapon.kick;
    // Weapon options
    if (data.attributes.weapon.melee.shield === undefined) data.attributes.weapon.melee.shield = model.attributes.weapon.melee.shield;
    if (data.attributes.weapon.melee.dualwield === undefined) data.attributes.weapon.melee.dualwield = model.attributes.weapon.melee.dualwield;
    if (data.attributes.weapon.melee.twohanded === undefined) data.attributes.weapon.melee.twohanded = model.attributes.weapon.melee.twohanded;
    // Resources
    if (!data.resources) data.resources = model.resources;
    if (!data.resources.perCombat) data.resources.perCombat = model.resources.perCombat;
    if (!data.resources.perCombat.momentum) data.resources.perCombat.momentum = model.resources.perCombat.momentum;
    if (!data.resources.perCombat.commandPoints) data.resources.perCombat.commandPoints = model.resources.perCombat.commandPoints;
    if (!data.resources.perCombat.focus) data.resources.perCombat.focus = model.resources.perCombat.focus;
    if (!data.resources.spendable) data.resources.spendable = model.resources.spendable;
    if (!data.resources.spendable.ki) data.resources.spendable.ki = model.resources.spendable.ki;
    if (!data.resources.spendable.custom1) data.resources.spendable.custom1 = model.resources.spendable.custom1;
    if (!data.resources.spendable.custom2) data.resources.spendable.custom2 = model.resources.spendable.custom2;
    if (!data.resources.spendable.custom3) data.resources.spendable.custom3 = model.resources.spendable.custom3;
    if (!data.resources.spendable.custom1.rest) data.resources.spendable.custom1.rest = model.resources.spendable.custom1.rest;
    if (!data.resources.spendable.custom2.rest) data.resources.spendable.custom2.rest = model.resources.spendable.custom2.rest;
    if (!data.resources.spendable.custom3.rest) data.resources.spendable.custom3.rest = model.resources.spendable.custom3.rest;
    // Saves
    if (!data.attributes.saves) data.attributes.saves = model.attributes.saves;
    if (!data.attributes.saves.deathFails) data.attributes.saves.deathFails = model.attributes.saves.deathFails;
    if (!data.attributes.saves.lastGaspFails) data.attributes.saves.lastGaspFails = model.attributes.saves.lastGaspFails;

    // Enable resources based on detected classes
    if (data.details.detectedClasses) {
      // Momentum
      data.resources.perCombat.momentum.enabled = data.details.detectedClasses.includes("rogue");
      // Command Points
      data.resources.perCombat.commandPoints.enabled = data.details.detectedClasses.includes("commander");
      // Focus
      data.resources.perCombat.focus.enabled = data.details.detectedClasses.includes("occultist");
      // Ki
      data.resources.spendable.ki.enabled = data.details.detectedClasses.includes("monk");
    }

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

    // Ability modifiers
    for (let abl of Object.values(data.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = abl.mod + data.attributes.level.value;
    }

    // Bonuses
    var meleeAttackBonus = 0;
    var rangedAttackBonus = 0;
    var divineAttackBonus = 0;
    var arcaneAttackBonus = 0;

    var acBonus = 0;
    var mdBonus = 0;
    var pdBonus = 0;

    var hpBonus = 0;
    var recoveriesBonus = 0;

    var saveBonus = 0;
    var disengageBonus = 0;

    function getBonusOr0(type) {
      if (type && type.bonus) return type.bonus;
      return 0;
    }

    if (this.items) {
      this.items.forEach(function(item) {
        if (item.type === 'equipment' && item.data.data.isActive) {
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

    data.attributes.attack = {
      melee: { bonus: meleeAttackBonus },
      ranged: { bonus: rangedAttackBonus },
      divine: { bonus: divineAttackBonus },
      arcane: { bonus: arcaneAttackBonus }
    };

    // Saves
    data.attributes.saves.easy = Math.max((6 - saveBonus), 0);
    data.attributes.saves.normal = Math.max((11 - saveBonus), 0);
    data.attributes.saves.hard = Math.max((16 - saveBonus), 0);
    data.attributes.disengage = Math.max((11 - disengageBonus - (data.attributes?.disengageBonus ?? 0)), 0);

    // Defenses (second element of sorted triple equal median)
    data.attributes.ac.value = Number(data.attributes.ac.base) + Number([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod].sort()[1]) + Number(data.attributes.level.value) + Number(acBonus);
    data.attributes.pd.value = Number(data.attributes.pd.base) + Number([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod].sort()[1]) + Number(data.attributes.level.value) + Number(pdBonus);
    data.attributes.md.value = Number(data.attributes.md.base) + Number([data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod].sort()[1]) + Number(data.attributes.level.value) + Number(mdBonus);

    // Damage Modifiers
    data.tier = 1;
    if (data.attributes.level.value >= 5) data.tier = 2;
    if (data.attributes.level.value >= 8) data.tier = 3;
    for (let prop in data.abilities) {
      data.abilities[prop].dmg = data.tier * data.abilities[prop].mod;
    }

    // HPs
    if (data.attributes.hp.automatic) {
      let hpLevelModifier = [1, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28];
      let level = data.attributes.level.value;
      if (data.incrementals?.hp) level++;

      let toughness = 0;
      if (flags.archmage) {
        toughness = flags.archmage.toughness ? data.attributes.hp.base : 0;
        if (level <= 4) toughness = Math.floor(toughness / 2)
        else if (level >= 8) toughness = Math.floor(toughness * 2)
        else toughness = Math.floor(toughness)
      }

      data.attributes.hp.max = Math.floor((data.attributes.hp.base + data.abilities.con.mod) * hpLevelModifier[level] + hpBonus + toughness);
    }

    // Recoveries
    if (data.attributes.recoveries.automatic) {
      data.attributes.recoveries.max = data.attributes.recoveries.base + recoveriesBonus;
    }
    // Calculate recovery average.
    let recoveryLevel = Number(data.attributes.level?.value) ?? 1;
    let recoveryDie = 'd8'; // Fall back
    if (typeof data.attributes?.recoveries?.dice == 'string') {
      recoveryDie = data.attributes.recoveries.dice;
    }
    recoveryDie = Number(recoveryDie.replace('d', ''));
    if (isNaN(recoveryDie)) recoveryDie = 8;  // Fall back
    let recoveryAvg = (recoveryDie + 1) / 2;
    if (!this.getFlag('archmage', 'strongRecovery')) {
      data.attributes.recoveries.avg = Math.floor(recoveryLevel * recoveryAvg) + (data.abilities.con.mod * data.tier);
    } else {
      // Handle Strong Recovery special case
      // E[2dxkh] = (x + 1) (4x - 1) / 6x ~= 2x/3
      recoveryAvg = data.tier * (recoveryDie + 1) * (4 * recoveryDie - 1) / (6 * recoveryDie) + (recoveryLevel - data.tier) * recoveryAvg;
      data.attributes.recoveries.avg = Math.floor(recoveryAvg) + (data.abilities.con.mod * data.tier);
    }

    // Weapon dice
    for (let wpn of ["melee", "ranged", "jab", "punch", "kick"]) {
      data.attributes.weapon[wpn].value = `${data.attributes.level.value}${data.attributes.weapon[wpn].dice}`;
    }

  }

  /* -------------------------------------------- */

  /**
   * Prepare NPC type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareNPCData(data, model, flags) {
    // Nothing currently
  }

  /** @inheritdoc */
  getRollData(item) {
    // Use the actor by default.
    let actor = this;

    // Use the current token if possible.
    let token = canvas.tokens?.controlled?.find(t => t.actor.data._id == this.data._id);
    if (token) actor = token.actor;

    // Reapply post active effects.
    this.prepareDerivedData();

    // Retrieve the actor data.
    const origData = super.getRollData();
    const data = foundry.utils.deepClone(origData);

    // Prepare a copy of the weapon model for old chat messages with undefined weapon attacks.
    const model = game.system.model.Actor.character.attributes.weapon;

    // Re-map all attributes onto the base roll data
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
            m: v?.melee ?? model.melee,
            r: v?.ranged ?? model.ranged,
            j: v?.jab ?? model.jab,
            p: v?.punch ?? model.punch,
            k: v?.kick ?? model.kick
          };

          // Clean up weapon properties.
          let wpnTypes = ['m', 'r', 'j', 'p', 'k'];
          wpnTypes.forEach(wpn => {
            if (data.wpn[wpn].dice) {
              data.wpn[wpn].die = data.wpn[wpn].dice;
              data.wpn[wpn].dieNum = data.wpn[wpn].dice.replace('d', '');
            }
            data.wpn[wpn].dice = data.wpn[wpn].value;
            // data.wpn[wpn].atk = data.wpn[wpn].attack;
            // data.wpn[wpn].dmg = data.wpn[wpn].dmg;
            delete data.wpn[wpn].value;
            delete data.wpn[wpn].attack;
          });

          break;

        case 'attack':
          data.atk = mergeObject((data.atk || {}), {
            m: v.melee,
            r: v.ranged,
            a: v.arcane,
            d: v.divine,
          });
          break;

        case 'attackMod':
          data.atk = mergeObject((data.atk || {}), {
            mod: v.value
          });
          break;

        case 'standardBonuses':
          data.std = v.value;
          break;

        default:
          if (!(k in data)) data[k] = v;
          break;
      }
    }

    // Old syntax shorthand.
    data.attr = data.attributes;
    data.abil = data.abilities;

    if (item) {
      if (item.data.data.powerLevel?.value) {
        data.pwrlvl = item.data.data.powerLevel.value;
      }
    }

    return data;
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
    let data = {bonus: "", average: avg, createMessage: true};

    if (event.shiftKey) {
      this.rollRecovery(data);
      return;
    }

    // Render modal dialog
    let template = 'systems/archmage/templates/chat/recovery-dialog.html';
    let dialogData = {avg: avg ? "checked" : ""};
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
    data.label += (Number(totalRecoveries) <= 0 && !data.free) ? ' (Half)' : ''
    let formula = actorData.attributes.level.value.toString() + actorData.attributes.recoveries.dice + '+' + actorData.abilities.con.dmg.toString();

    if (data.average) {
      formula = this.data.data.attributes.recoveries.avg;
    } else if (this.getFlag('archmage', 'strongRecovery')) {
      // Handle strong recovery.
      formula = (actorData.attributes.level.value + actorData.tier).toString() + actorData.attributes.recoveries.dice + 'k' + actorData.attributes.level.value.toString() + '+' + actorData.abilities.con.dmg.toString();
    }

    // Add bonus if any
    if (data.bonus !== "") {
      if (isNaN(parseInt(data.bonus))) {
        ui.notifications.error('"'+data.bonus+'" '+game.i18n.localize("ARCHMAGE.UI.errNotInteger"));
        return;
      }
      formula = `${formula}+${data.bonus}`;
    }

    // Half healing for recoveries we do NOT have
    if (Number(totalRecoveries) <= 0 && !data.free) {
      formula = `floor((${formula})/2)`;
    }

    // If max is set, handle it
    if (data.max > 0) {
      formula = `min((${formula}), ${data.max})`;
    }

    let roll = new Roll(`${formula}`);

    if (data.createMessage) {
      // Basic template rendering data
      const template = "systems/archmage/templates/chat/recovery-card.html"
      const templateData = {actor: this, label: data.label, formula: formula};
      // Basic chat message data
      const chatData = {
        user: game.user.id, speaker: {actor: this.id, token: this.token,
        alias: this.name, scene: game.user.viewedScene},
        roll: new Roll("") // TODO: Refactor this, needed to silence an error in 0.8.x
      };

      // Toggle default roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
      if (rollMode === "blindroll") chatData["blind"] = true;

      // Render the template
      chatData.content = await renderTemplate(template, templateData);
      chatData.content = TextEditor.enrichHTML(chatData.content, { rollData: this.getRollData() });
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
    if (game.dice3d  && (!game.settings.get("dice-so-nice", "animateInlineRoll")
      || !data.createMessage)) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }

    let newHp = this.data.data.attributes.hp.value;
    let newRec = this.data.data.attributes.recoveries.value;
    if (!data.free) {newRec -= 1;}
    // Minimum of 0 handled in the actor update hook
    if (data.apply) {newHp = Math.min(this.data.data.attributes.hp.max, newHp + roll.total);}
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
    let rollsToAnimate = [];

    // Recoveries & hp
    let baseHp = Math.max(this.data.data.attributes.hp.value, 0);

    while (baseHp + templateData.gainedHp < this.data.data.attributes.hp.max/2) {
      // Roll recoveries until we are above staggered
      let rec = await this.rollRecovery({apply: false, free: true});
      templateData.gainedHp += rec.total;
      templateData.usedRecoveries += 1;
    }

    updateData['data.attributes.recoveries.value'] = this.data.data.attributes.recoveries.value - templateData.usedRecoveries;
    // Remove any prior negative hps from the amount healing to prevent double application
    updateData['data.attributes.hp.value'] = Math.min(this.data.data.attributes.hp.max, Math.max(this.data.data.attributes.hp.value, 0) + templateData.gainedHp + Math.min(this.data.data.attributes.hp.value, 0));

    // Resources
    // Focus, Momentum and Command Points handled on end combat hook
    for (let idx of ["1", "2", "3"]) {
      let resourcePathName = "custom"+idx;
      let resourceName = this.data.data.resources.spendable[resourcePathName].label;
      let curr = this.data.data.resources.spendable[resourcePathName].current;
      if (this.data.data.resources.spendable[resourcePathName].enabled
        && this.data.data.resources.spendable[resourcePathName].rest != "none") {
        let max = this.data.data.resources.spendable[resourcePathName].max;
        let path = `data.resources.spendable.${resourcePathName}.current`;
        if (this.data.data.resources.spendable[resourcePathName].rest == "quick"
          && max && curr < max) {
          updateData[path] = max;
        }
        else if (this.data.data.resources.spendable[resourcePathName].rest == "quickreset"
          && curr > 0) {
          updateData[path] = 0;
        }
        if (updateData[path] !== undefined) {
          templateData.resources.push({
            key: resourceName,
            message: `${game.i18n.localize("ARCHMAGE.CHAT.KiReset")} ${updateData[path]}`
          });
        }
      }
    }

    // Update actor at this point (items are updated separately)
    if ( !isObjectEmpty(updateData) ) {
      this.update(updateData);
    }

    // Items
    let items = this.items.map(i => i);
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let maxQuantity = item.data.data?.maxQuantity?.value ?? 1;
      if ((item.type == "power" || item.type == "equipment") && maxQuantity) {
        // Recharge powers.
        let rechAttempts = maxQuantity - item.data.data.quantity.value;
        let rechValue = Number(item.data.data.recharge.value) || 16;
        if (game.settings.get('archmage', 'rechargeOncePerDay')) {
          rechAttempts = Math.max(rechAttempts - item.data.data.rechargeAttempts.value, 0)
        }
        // Per battle powers.
        if ((item.data.data.powerUsage?.value == 'once-per-battle'
          || (item.data.data.powerUsage?.value == 'at-will'
          && item.data.data.quantity.value != null))
          && item.data.data.quantity.value < maxQuantity) {
          await item.update({
            'data.quantity': {value: maxQuantity}
          });
          templateData.items.push({
            key: item.name,
            message: `${game.i18n.localize("ARCHMAGE.CHAT.ItemReset")} ${maxQuantity}`
          });
        }
        else if ((item.data.data.powerUsage?.value == 'recharge') && rechAttempts > 0) {
          // This captures other as well
          let successes = 0;
          for (let j = 0; j < rechAttempts; j++) {
            let roll = await this.items.get(item.id).recharge({createMessage: false});
            rollsToAnimate.push(roll.roll);
            if (roll.total >= rechValue) {
              successes++;
              templateData.items.push({
                key: item.name,
                message: `${game.i18n.localize("ARCHMAGE.CHAT.RechargeSucc")} (${roll.total} >= ${rechValue})`
              });
            } else {
              templateData.items.push({
                key: item.name,
                message: `${game.i18n.localize("ARCHMAGE.CHAT.RechargeFail")} (${roll.total} < ${rechValue})`
              });
            }
          }
        }
      }
    };

    // Print outcomes to chat
    const template = `systems/archmage/templates/chat/rest-short-card.html`
    const chatData = {
      user: game.user.id, speaker: {actor: this.id, token: this.token,
      alias: this.name, scene: game.user.viewedScene},
      roll: new Roll("") // Needed to silence an error in 0.8.x
    };
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    if (rollMode === "blindroll") chatData["blind"] = true;
    chatData["content"] = await renderTemplate(template, templateData);
    // If 3d dice are enabled, handle them
    if (game.dice3d) {
      for (let roll of rollsToAnimate) {
        await game.dice3d.showForRoll(roll, game.user, true);
      }
    }
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
      if (this.data.data.resources.spendable[resourcePathName].enabled
        && this.data.data.resources.spendable[resourcePathName].rest != "none") {
        let max = this.data.data.resources.spendable[resourcePathName].max;
        let path = `data.resources.spendable.${resourcePathName}.current`;
        if ((this.data.data.resources.spendable[resourcePathName].rest == "full"
          || this.data.data.resources.spendable[resourcePathName].rest == "quick")
          && max && curr < max) {
          updateData[path] = max;
        }
        else if ((this.data.data.resources.spendable[resourcePathName].rest == "fullreset"
          || this.data.data.resources.spendable[resourcePathName].rest == "quickreset")
          && curr > 0) {
          updateData[path] = 0;
        }
        if (updateData[path] !== undefined) {
          templateData.resources.push({
            key: resourceName,
            message: `${game.i18n.localize("ARCHMAGE.CHAT.KiReset")} ${updateData[path]}`
          });
        }
      }
    }

    // Update actor at this point (items are updated separately)
    if ( !isObjectEmpty(updateData) ) {
      this.update(updateData);
    }

    // Items
    let items = this.items.map(i => i);
    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      if (item.type != 'power' && item.type != 'equipment') continue;

      let usageArray = ['once-per-battle','daily','recharge'];
      let fallbackQuantity = usageArray.includes(item.data.data.powerUsage?.value) || item.data.data.quantity.value !== null ? 1 : null;
      let maxQuantity = item.data.data?.maxQuantity?.value ?? fallbackQuantity;
      if (maxQuantity && item.data.data.quantity.value < maxQuantity) {
        await item.update({
          'data.quantity': {value: maxQuantity},
          'data.rechargeAttempts': {value: 0}
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
      user: game.user.id, speaker: {actor: this.id, token: this.token,
      alias: this.name, scene: game.user.viewedScene},
      roll: new Roll("") // Needed to silence an error in 0.8.x
    };
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
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
   * Actor update hook
   *
   * @return {undefined}
   */

  async _preUpdate(data, options, userId) {
    await super._preUpdate(data, options, userId);
    if (!options.diff || data.data === undefined) return; // Nothing to do

    if (data.data.attributes?.hp?.max !== undefined) {
      // Here we received an update of the max hp, check that the total matches
      let hp = data.data.attributes.hp.value || this.data.data.attributes.hp.value;
      data.data.attributes.hp.value = Math.min(hp, data.data.attributes.hp.max);
    }

    if (data.data.attributes?.hp?.value !== undefined
      && data.data.attributes?.hp?.temp == undefined) {
      // Here we received an update of the total hp but not the temp, check them
      let hp = duplicate(this.data.data.attributes.hp);
      if (data.data.attributes.hp.value === null
        || isNaN(data.data.attributes.hp.value)) {
        //If the update is nonsensical ignore it
        data.data.attributes.hp.value = hp.value;
      }
      let delta = data.data.attributes.hp.value - hp.value;
      if (delta < 0) { // Damage, check for temp hps
        let temp = hp.temp || 0;
        if (isNaN(temp)) temp = 0; // Fallback for erroneous data
        data.data.attributes.hp.temp = Math.max(0, temp + delta);
        delta = Math.min(delta + temp, 0);
      }
      else { // Healing, start from 0 if negative
        hp.value = Math.max(0, hp.value);
      }
      // Do not exceed max hps
      let max = data.data.attributes.hp.max || hp.max;
      // If max hp is ten assume this is a newly created npc
      if (max == 10 && this.data.type == 'npc') {
        data.data.attributes.hp.value = hp.value + delta;
        data.data.attributes.hp.max = hp.value + delta;
      } else {
        data.data.attributes.hp.value = Math.min(hp.value + delta, max);
      }

      // Handle hp-related conditions
      if (game.settings.get('archmage', 'automateHPConditions') && !game.modules.get("combat-utility-belt")?.active) {
        // Dead
        let filtered = this.effects.filter(x =>
          x.data.label === game.i18n.localize("ARCHMAGE.EFFECT.StatusDead"));
        if (filtered.length == 0 && data.data.attributes.hp.value <= 0) {
            let effectData = CONFIG.statusEffects.find(x => x.id == "dead");
            let createData = foundry.utils.deepClone(effectData);
            createData.label = game.i18n.localize(effectData.label);
            createData["flags.core.statusId"] = effectData.id;
            createData["flags.core.overlay"] = true;
            delete createData.id;
            const cls = getDocumentClass("ActiveEffect");
            await cls.create(createData, {parent: this});
        } else if (filtered.length > 0 && data.data.attributes.hp.value > 0) {
          for (let e of filtered) {
            await this.deleteEmbeddedEntity("ActiveEffect", e.id)
          }
        }
        // Staggered
        filtered = this.effects.filter(x =>
          x.data.label === game.i18n.localize("ARCHMAGE.EFFECT.StatusStaggered"));
        if (filtered.length == 0 && data.data.attributes.hp.value/max <= 0.5
          && data.data.attributes.hp.value > 0) {
            let effectData = CONFIG.statusEffects.find(x => x.id == "staggered");
            let createData = foundry.utils.deepClone(effectData);
            createData.label = game.i18n.localize(effectData.label);
            createData["flags.core.statusId"] = effectData.id;
            if (game.settings.get('archmage', 'staggeredOverlay')) {
              createData["flags.core.overlay"] = true;
            }
            delete createData.id;
            const cls = getDocumentClass("ActiveEffect");
            await cls.create(createData, {parent: this});
        } else if (filtered.length > 0 && (data.data.attributes.hp.value/max > 0.5
          || data.data.attributes.hp.value <= 0)) {
          for (let e of filtered) {
            await this.deleteEmbeddedEntity("ActiveEffect", e.id)
          }
        }
      }
    }

    if (!this.data.type == 'character') return; // Nothing else to do

    // if (data.data.attributes?.level?.value) {
      // Update of a PC level - make sure it's within [1, 10]
      // if (data.data.attributes.level.value < 1) data.data.attributes.level.value = 1;
      // if (data.data.attributes.level.value > 10) data.data.attributes.level.value = 10;
    // }

    if (data.data.attributes?.recoveries?.value) {
      // Here we received an update involving the number of remaining recoveries
      // Make sure we are not exceeding the maximum
      if (this.data.data.attributes.recoveries.max) {
        data.data.attributes.recoveries.value = Math.min(data.data.attributes.recoveries.value, this.data.data.attributes.recoveries.max);
      }
      // Clear previous effect, then recreate it if the at negative recoveries
      let effectsToDelete = [];
      this.effects.forEach(x => {
        if (x.data.label == "Negative Recovery Penalty") effectsToDelete.push(x.id);
      });
      await this.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete)

      let newRec = data.data.attributes.recoveries.value;
      if (data.data.attributes.recoveries.value < 0) {
        const effectData = {
          label: "Negative Recovery Penalty",
          changes: [
            {key: "data.attributes.ac.value",value: newRec, mode: CONST.ACTIVE_EFFECT_MODES.ADD},
            {key: "data.attributes.pd.value", value: newRec, mode: CONST.ACTIVE_EFFECT_MODES.ADD},
            {key: "data.attributes.md.value", value: newRec, mode: CONST.ACTIVE_EFFECT_MODES.ADD},
            {key: "data.attributes.attackMod.value", value: newRec, mode: CONST.ACTIVE_EFFECT_MODES.ADD}
          ]
        };
        this.createEmbeddedEntity("ActiveEffect", [effectData]);
      }
    }

    if (data.data.attributes?.weapon?.melee?.shield !== undefined
      || data.data.attributes?.weapon?.melee?.dualwield !== undefined
      || data.data.attributes?.weapon?.melee?.twohanded !== undefined) {
      // Here we received an update of the melee weapon checkboxes

      // Fallback for sheet closure bug
      if (typeof this.data.data.attributes.weapon.melee.dice !== 'string') {
          this.data.data.attributes.weapon.melee.dice = "d8";
      }

      let mWpn = parseInt(this.data.data.attributes.weapon.melee.dice.substring(1));
      if (isNaN(mWpn)) mWpn = 8; // Fallback
      let lvl = this.data.data.attributes.level.value;
      data.data.attributes.attackMod = {value: this.data.data.attributes.attackMod.value};
      let wpn = {shieldPen: 0, twohandedPen: 0};
      if (this.data.data.attributes.weapon.melee.twohanded) {
        wpn.mWpn2h = mWpn;
        wpn.mWpn1h = Math.max(mWpn - 2, 4);
      } else {
        wpn.mWpn2h = Math.min(mWpn + 2, 12);
        wpn.mWpn1h = mWpn;
      }

      // Compute penalties due to equipment (if classes known)
      if (this.data.data.details.detectedClasses) {
        let shieldPen = new Array();
        let twohandedPen = new Array();
        let mWpn1h = new Array();
        let mWpn2h = new Array();
        let skilledWarrior = new Array();
        this.data.data.details.detectedClasses.forEach(function(item) {
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
        if (this.data.data.attributes.weapon.melee.twohanded && wpn.mWpn2h == mWpn2h) {
          wpn.mWpn1h = mWpn1h;
        }
        else if (!this.data.data.attributes.weapon.melee.twohanded && wpn.mWpn1h == mWpn1h) {
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
          data.data.attributes.ac = {base: this.data.data.attributes.ac.base + 1};
          data.data.attributes.attackMod.value += wpn.shieldPen;
          if (this.data.data.attributes.weapon.melee.twohanded) {
            // Can't wield both a two-handed weapon and a shield
            mWpn = wpn.mWpn1h;
            data.data.attributes.weapon.melee.twohanded = false;
            data.data.attributes.attackMod.value -= wpn.twohandedPen;
          }
          else if (this.data.data.attributes.weapon.melee.dualwield) {
            // Can't dual-wield with a shield
            data.data.attributes.weapon.melee.dualwield = false;
          }
        } else {
          data.data.attributes.ac = {base: this.data.data.attributes.ac.base - 1};
          data.data.attributes.attackMod.value -= wpn.shieldPen;
        }
      }

      else if (data.data.attributes.weapon.melee.dualwield !== undefined) {
        // Here we received an update of the dual wield checkbox
        if (data.data.attributes.weapon.melee.dualwield) {
          if (this.data.data.attributes.weapon.melee.twohanded) {
            // Can't wield two two-handed weapons
            mWpn = wpn.mWpn1h;
            data.data.attributes.weapon.melee.twohanded = false;
            data.data.attributes.attackMod.value -= wpn.twohandedPen;
          }
          else if (this.data.data.attributes.weapon.melee.shield) {
            // Can't duel-wield with a shield
            data.data.attributes.ac = {base: this.data.data.attributes.ac.base - 1};
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
          if (this.data.data.attributes.weapon.melee.shield) {
            // Can't wield both a two-handed weapon and a shield
            data.data.attributes.ac = {base: this.data.data.attributes.ac.base - 1};
            data.data.attributes.weapon.melee.shield = false;
            data.data.attributes.attackMod.value -= wpn.shieldPen;
          }
          else if (this.data.data.attributes.weapon.melee.dualwield) {
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
      && data.data.details.class !== undefined) {
      // Here we received an update of the class name for a character

      let matchedClasses = ArchmageUtility.detectClasses(data.data.details.class.value);
      if (matchedClasses !== null
        && game.settings.get('archmage', 'automateBaseStatsFromClass')) {
        // Remove duplicates and Sort to avoid problems with future matches
        matchedClasses = [...new Set(matchedClasses)].sort();

        // Check that the matched classes actually changed
        if (this.data.data.details.matchedClasses !== undefined
          && JSON.stringify(this.data.data.details.matchedClasses) == JSON.stringify(matchedClasses)
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
        let lvl = this.data.data.attributes.level.value;
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

        // Handle extra recoveries for fighters
        if (matchedClasses.includes("fighter")) {
          data.data.attributes.recoveries.base = 9;
        } else {
          data.data.attributes.recoveries.base = 8;
        }
      }
      // Store matched classes for future reference
      data.data.details.detectedClasses = matchedClasses;
    }
  }

  /**
   * Auto levelup monsters
   * Creates a copy of an NPC actor with the requested delta in levels
   * @param delta {Integer}    The number of levels to add or remove
   *
   * @return {undefined}
   */

  async autoLevelActor(delta) {
    if (!this.data.type == 'npc' || delta == 0) return;
    // Conver delta back to a number, and handle + characters.
    delta = typeof delta == 'string' ? Number(delta.replace('+', '')) : delta;

    // Warning for out of bounds.
    if (Math.abs(delta) > 6) ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.tooManyLevels"));

    // Generate the prefix.
    let suffix = ` (+${delta})`;
    if (delta < 0) suffix = ` (${delta})`;

    // Set the level.
    let lvl = Number(this.data.data.attributes.level.value || 0) + delta;
    if (lvl < 0 || lvl > 15) {
      ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.levelLimits"));
      return;
    }

    // Set other overrides.
    let mul = Math.pow(1.25, delta); // use explicit coefficients from book?
    let overrideData = {
      'name': this.data.name+suffix,
      'data.attributes.level.value': lvl,
      'data.attributes.ac.value': Number(this.data.data.attributes.ac.value || 0) + delta,
      'data.attributes.pd.value': Number(this.data.data.attributes.pd.value || 0) + delta,
      'data.attributes.md.value': Number(this.data.data.attributes.md.value || 0) + delta,
      // Initiative already depends directly on level
      'data.attributes.hp.value': Math.round(this.data.data.attributes.hp.value * mul),
      'data.attributes.hp.max': Math.round(this.data.data.attributes.hp.max * mul),
    };

    // Create the new actor and save it.
    let actor = await this.clone(overrideData, {save: true, keepId: false});

    // Fix attack and damage
    let atkFilter = /\+\s*(\d+)([\S\s]*)/;
    let inlineRollFilter = /(\d+)?d?\d+(?!\+)/g;
    let itemUpdates = [];

    // Iterate over attacks and actions.
    for (let item of actor.items) {
      let itemOverrideData = {'_id': item.id};
      if (item.type == 'action') {
        // Add delta to attack
        let parsed = atkFilter.exec(item.data.data.attack.value);
        if (!parsed) continue;
        let newAtk = `[[d20+${parseInt(parsed[1])+delta}`;
        if (!parsed[2].match(/^\]\]/)) newAtk += "]]";
        itemOverrideData['data.attack.value'] = newAtk + parsed[2];
      }
      if (item.type == 'action' || item.type == 'trait' || item.type == 'nastierSpecial') {
        // Multiply damage
        for (let key of ["hit", "hit1", "hit2", "hit3", "miss", "description"]) {
          if (!item.data.data[key]?.value) continue;
          let rolls = [...(item.data.data[key].value.matchAll(inlineRollFilter))]
          let offset = 0;
          if (rolls.length > 0) {
            let newValue = item.data.data[key].value;
            rolls.forEach(r => {
              let orig = r[0];
              let newDmg = orig;
              let index = r.index + offset;
              if (orig.includes("d")) newDmg = _scaleDice(orig, mul);
              else newDmg = Math.round(parseInt(orig)*mul).toString();
              // Replace first instance at or around index, might be imprecise but good enough
              newValue = newValue.slice(0, index)+newValue.slice(index).replace(orig, newDmg);
              offset -= (newDmg.length - orig.length);
            });
            itemOverrideData[`data.${key}.value`] = newValue;
          }
        }
      }

      // Append updates to the item update array for later.
      itemUpdates.push(itemOverrideData);
    }

    // Apply all item updates to the new actor.
    actor.updateEmbeddedDocuments('Item', itemUpdates);
  }
}

function _scaleDice(exp, mul) {
  let y = parseInt(exp.split("d")[1])
  let diceAvg = (y + 1) / 2;
  let target = Math.max(Math.round(parseInt(exp.split("d")[0]) * diceAvg * mul * 2) / 2, 1);
  let diceCnt = 0;
  let correction = "";
  while (target > diceAvg) {
    diceCnt += 1;
    target -= diceAvg;
  }
  // Correct remainder with closest die, +/- 0.5 tolerance due to rounding
  if (target == 1) correction = "1";
  else if (!((target * 2) % 2) && target > 0) correction = `${target / 2}d3`;
  else if (target > 1){
    let corrDie = target * 2 - 1;
    if (corrDie % 2) corrDie -= 1;
    correction = `1d${corrDie}`;
  }
  if (!diceCnt) return correction;
  else if (!correction) return `${diceCnt}d${y}`;
  return `${diceCnt}d${y}+`+correction;
}
