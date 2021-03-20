export default class ArchmageRolls {

  static async rollItem(item) {
    let attack = item.data.data.attack.value;
    let attackRolls = ArchmageRolls._getInlineRolls(attack, item.actor.getRollData());
    console.log(attackRolls);
    if (attackRolls && attackRolls.length > 0) {
      attackRolls[0].toMessage(item.actor.getRollData());
    }
  }

  static _getInlineRolls(text, data) {
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
