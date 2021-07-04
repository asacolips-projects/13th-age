export default class ArchmageRolls {

  static async rollItemTargets(item) {
    let targets = 1;
    let targetLine = item.data.data.target.value;
    let rolls = ArchmageRolls._getInlineRolls(targetLine, item.actor.getRollData());
    if (rolls !== undefined) {
      // Roll the targets now
      await ArchmageRolls._roll(rolls, item.actor);
      targets = 0;
      rolls.forEach(r => targets += r.total);
    } else {
      // Try NLP to guess targets
      let nlpMap = {
        "two ": 2,
        "three ": 3,
        "four ": 4,
        "five ": 5
      } // TODO: handle localization?
      let keys = Object.keys(nlpMap);
      for ( let x = 0; x < keys.length; x++) {
        if (targetLine.includes(keys[x])) targets = nlpMap[keys[x]];
      }
    }

    console.log(targets);
    return targets;
  }

  static async _roll(rolls, actor, key=undefined) {
    for (let x of rolls) {
      await x.evaluate({async: true}).then(() => {
        x.data.inlineRoll = ArchmageRolls._createInlineRollElementFromRoll(x);
        if (key == "attack") {
          x.data.critResult = ArchmageRolls._inlineRollCritTest(x, actor);
        }
      });
    }
  }

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
    const data = {
      cls: ["inline-roll"],
      dataset: {}
    };

    try {
      data.cls.push("inline-result");
      data.label = label ? `${label}: ${roll.total}` : roll.total;
      data.title = roll.formula;
      data.dataset.roll = escape(JSON.stringify(roll));
    }
    catch(err) { return null; }

    // Construct and return the formed link element
    const a = document.createElement('a');
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
