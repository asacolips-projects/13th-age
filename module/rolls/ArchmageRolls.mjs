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
    // TODO: handle localization?
    let nlpMap = {
      "two ": 2,
      "three ": 3,
      "four ": 4,
      "five ": 5,
      2: 2,
      3: 3,
      4: 4,
      5: 5
    }

    if (item.data.type == "power") {
      let targetLine = item.data.data.target.value;
      rolls = ArchmageRolls._getInlineRolls(targetLine, item.actor.getRollData());
      if (rolls !== undefined) {
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
          if (targetLine.includes(keys[x])) targets = nlpMap[keys[x]];
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
            if (targetLine.includes(keys[x])) targets = nlpMap[keys[x]];
          }
        }
      }
    }

    return {targets: targets, rolls: rolls, targetLine: newTargetLine};
  }

  static rollItemAdjustAttacks(item, numTargets) {
    let newAttackLine = item.data.data.attack.value;
    // Split string into first inline roll and vs, and repeat roll as needed
    let match = /(\[\[.+?\]\]).*(vs.*)/.exec(newAttackLine);
    if (match) {
      let roll = match[1];
      let vs = match[2];
      newAttackLine = roll
      for (let i=1; i<numTargets.targets; i++) {
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
        console.log(match);
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
