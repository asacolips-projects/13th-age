export default class ArchmageRolls {

  static async rollItem(item) {
    let rollData = {};

    let keys = Object.keys(item.data.data);
    for ( let x = 0; x < keys.length; x++) {
      let key = keys[x];
      let field = item.data.data[key];
      console.log(field);
      if (!field?.value) continue;

      let rolls = ArchmageRolls._getInlineRolls(field.value, item.actor.getRollData());

      if (rolls) {
        console.log(rolls);
        ArchmageRolls._roll(rolls, item.actor, key);
        rollData[key] = rolls;
      }
    }

    console.log(rollData);
    return rollData;
  }

  static async rollItemTargets(item) {
    let rolls = [];
    let newTargetLine = undefined;
    let targets = 1;
    let nlpMap = {}
    nlpMap[game.i18n.localize("ARCHMAGE.TARGETING.two")+" "] = 2;
    nlpMap[game.i18n.localize("ARCHMAGE.TARGETING.three")+" "] = 3;
    nlpMap[game.i18n.localize("ARCHMAGE.TARGETING.four")+" "] = 4;
    nlpMap[game.i18n.localize("ARCHMAGE.TARGETING.five")+" "] = 5;
    for (let i=2; i<=5; i++) {
      nlpMap[i.toString()] = i;
    }

    if (item.data.type == "power") {
      let targetLine = item.data.data.target.value;
      if (targetLine != null) {
        // First cleanup references to target HPs
        let lineToParse = targetLine.replace(/[0-9]+ hp/g, '');
        lineToParse = lineToParse.toLowerCase().replace(/\[\[.+?\]\] hp/g, '');
        rolls = ArchmageRolls._getInlineRolls(lineToParse, item.actor.getRollData());
        if (rolls != undefined) {
          // Roll the targets now
          ArchmageRolls._roll(rolls, item.actor);
          targets = 0;
          newTargetLine = duplicate(targetLine);
          rolls.forEach(r => {
            targets += r.total;
            // Save outcomes in target line string
            newTargetLine = newTargetLine.replace(/(\[\[.+?\]\])/, r.inlineRoll.outerHTML)
          });
        } else {
          // Try NLP to guess targets
          let keys = Object.keys(nlpMap);
          for (let x = 0; x < keys.length; x++) {
            if (lineToParse.includes(keys[x])) targets = nlpMap[keys[x]];
          }
          // Handle "each" or "all"
          if (targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.each")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.all")+" ")) {
            targets = Math.max(game.user.targets.size, 1);
          }
        }
      }
    }
    else if (item.data.type == "action") {
      // Get text between brackets, that's where targets are stored
      let targetLine = /(\(.*\))/.exec(item.data.data.attack.value);
      if (targetLine != null) {
        targetLine = targetLine[0];
        // First check for rolls
        rolls = ArchmageRolls._getInlineRolls(targetLine, item.actor.getRollData());
        if (rolls !== undefined) {
          // Roll the targets now
          ArchmageRolls._roll(rolls, item.actor);
          targets = 0;
          rolls.forEach(r => targets += r.total);
        } else {
          let keys = Object.keys(nlpMap);
          for (let x = 0; x < keys.length; x++) {
            if (targetLine.toLowerCase().includes(keys[x])) targets = nlpMap[keys[x]];
          }
          // Handle "each" or "all"
          if (targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.each")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.all")+" ")) {
            targets = Math.max(game.user.targets.size, 1);
          }
        }
      }
    }

    return {targets: targets, rolls: rolls, targetLine: newTargetLine};
  }

  static addAttackMod(item) {
    // Add @atk.mod modifier to the first inline roll, if it isn't 0
    let attackLine = item.data.data.attack.value;
    let atkMod = item.actor.getRollData().atk.mod;
    if (atkMod) {
      let match = /(\[\[.+?\]\])/.exec(attackLine);
      if (match) {
        let formula = match[1];
        let newFormula = formula.replace("]]", "+@atk.mod]]");
        attackLine = attackLine.replace(formula, newFormula);
      }
    }
    return attackLine;
  }

  static rollItemAdjustAttacks(item, newAttackLine, numTargets) {
    // If the user has targeted tokens, limit number of rolls by the lower of
    // selected targets or number listed on the power. If no targets are
    // selected, just use the number listed on the power.
    let selectedTargets = [...game.user.targets];
    let targetsCount = selectedTargets.length > 0 ? Math.min(numTargets.targets, selectedTargets.length) : numTargets.targets;

    // Handle the special case of the Crescendo spell
    if (item.data.data?.special?.value?.toLowerCase().includes(
      game.i18n.localize("ARCHMAGE.TARGETING.crescendoSpecial").toLowerCase())) {
        newAttackLine = ArchmageRolls._handleCrescendo(newAttackLine, numTargets);
        targetsCount = selectedTargets.length;
      }

    // Split string into first inline roll and vs, and repeat roll as needed
    let match = /(\[\[.+?\]\]).*(vs.*)/.exec(newAttackLine);
    if (match) {
      let roll = match[1];
      let vs = match[2];
      newAttackLine = roll
      for (let i = 1; i < targetsCount; i++) {
        newAttackLine += ", " + roll;
      }
      if (item.data.type == "action" && numTargets.rolls) {
        numTargets.rolls.forEach(r => {
          // Embed pre-rolled targets
          vs = vs.replace(/(\[\[.+?\]\])/, r.inlineRoll.outerHTML)
        });
      }
      newAttackLine += " " + vs;
    }
    return newAttackLine;
  }

  static _handleCrescendo(newAttackLine) {
    if (game.user.targets.size <= 1) return newAttackLine;
    // Special: You can choose more than one target for this spell,
    // but you take a –2 penalty when attacking two targets, a –3
    // penalty for three targets, and so on.
    return newAttackLine.replace("]]", ` -${game.user.targets.size}]]`)
  }

  static _roll(rolls, actor, key=undefined) {
    for (let i=0; i<rolls.length; i++) {
      rolls[i].evaluate({async: false});
      rolls[i].inlineRoll = ArchmageRolls._createInlineRollElementFromRoll(rolls[i]);
      if (key == "attack") rolls[i].critResult = ArchmageRolls._inlineRollCritTest(rolls[i], actor);
    }
  }

  static _getInlineRolls(text, data) {
    try {
      if (!text) return undefined;
      const regex = /\[\[(\/[a-zA-Z]+\s)?(.*?)([\]]{2,3})/gi;

      //if (!regex.test(text)) return undefined;
      let matches = [...text.matchAll(regex)];
      if (matches.length == 0) return undefined;

      //let matches = regex.exec(text);
      let rolls = [];
      for (let x = 0; x < matches.length; x++) {
        let match = matches[x];
        //console.log(match);
        let roll = new Roll(match[2], data);
        //roll.formula = match[2];
        rolls.push(roll);
      }
      return rolls;
    }
    catch (e) { return undefined; }
  }

  static _createInlineRollElementFromRoll(roll) {
    let data = {
      cls: ["inline-roll"],
      dataset: {}
    };

    try {
      data.cls.push("inline-result");
      // data.label = label ? `${label}: ${roll.total}` : roll.total;
      data.label = roll.total;
      data.title = roll.formula;
      data.dataset.roll = escape(JSON.stringify(roll));
    }
    catch(err) { return null; }

    // Construct and return the formed link element
    let a = document.createElement('a');
    a.classList.add(...data.cls);
    a.title = data.title;
    for (let [k, v] of Object.entries(data.dataset)) {
      a.dataset[k] = v;
    }
    a.innerHTML = `<i class="fas fa-dice-d20"></i> ${data.label}`;
    return a;
  }

  /**
   * Determine if roll includes a d20 crit.
   *
   * @param {object} roll
   *
   * @return {string} 'crit', 'fail', or 'normal'.
   */
  static _inlineRollCritTest(roll, actor = null) {

    for (let i = 0; i < roll.terms.length; i++) {
      var part = roll.terms[i];
      if (part.results) {
        let result = part.results.map((r) => {
          if (part.faces === 20) {
            // Natural 20.
            if (r.result === part.faces && !r.discarded) {
              return 'crit';
            }
            // Natural 1.
            else if (r.result === 1 && !r.discarded && !r.rerolled) {
              return 'fail';
            }
            // Barbarian crit.
            else if (actor && actor.data.data.details.class.value && actor.data.data.details.class.value.toLowerCase().match(/barbarian/g)
              && roll.formula.match(/^2d20kh/g) && part.results[0].result > 10 && part.results[1].result > 10) {
              return 'crit';
            }
            // Natural 2, if dual-wielding.
            else if (actor && actor.data.type === 'character'
              && actor.data.data.attributes.weapon.melee.dualwield
              && r.result === 2 && !r.discarded && !r.rerolled) {
              return 'reroll';
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
}
