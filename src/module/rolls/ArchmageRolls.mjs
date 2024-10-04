const INLINE_ROLLS_FILTER = /(\[\[.+?\]\])/g

export default class ArchmageRolls {

  static async rollItemTargets(item) {
    let rolls = [];
    let newTargetLine = undefined;
    let targets = 1;
    let nlpMap = {}
    const actor = item.actor ?? game.user.character;
    for (let i=2; i<=9; i++) {
      nlpMap[game.i18n.localize(`ARCHMAGE.TARGETING.${i}`)+" "] = i;
      nlpMap[i.toString()] = i;
    }

    if (item.type == "power") {
      let targetLine = item.system.target.value;
      if (targetLine != null) {
        let lineToParse = targetLine.toLowerCase();
        // First cleanup references to target HPs
        const stringHP = game.i18n.localize("ARCHMAGE.CHAT.HP").toLowerCase();
        const regexHP = new RegExp("[0-9]+ " + stringHP, "g");
        const regexHPInline = new RegExp("\\[\\[.+?\\]\\] " + stringHP, "g");
        lineToParse = lineToParse.replace(regexHP, '');
        lineToParse = lineToParse.replace(regexHPInline, '');
        // Then remove negative numbers
        lineToParse = lineToParse.replace(/-[0-9]+/g, '');
        // Remove all numbers with at least 2 digits (so 10+)
        // except for inline rolls (by checking for preceding '[[')
        lineToParse = lineToParse.replace(/(?<!\[\[)[0-9]{2,}/g, '');
        rolls = ArchmageRolls.getInlineRolls(lineToParse, actor?.getRollData() ?? {});
        if (rolls != undefined) {
          // Roll the targets now
          await ArchmageRolls.rollAll(rolls, actor);
          targets = 0;
          newTargetLine = foundry.utils.duplicate(targetLine);
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
          // Handle "each" or "all" or "every" or the Crescendo spell
          if (targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.each")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.all")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.every")+" ")
            || item.system?.special?.value?.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.crescendoSpecial").toLowerCase())
            ) {
            targets = Math.max(game.user.targets.size, 1);
          }
        }
      }
    }
    else if (item.type == "action") {
      // Get text between brackets, that's where targets are stored
      let targetLine = /(\(.*\))/.exec(item.system.attack.value);
      if (targetLine != null) {
        targetLine = targetLine[0];
        // First check for rolls
        rolls = ArchmageRolls.getInlineRolls(targetLine, actor?.getRollData());
        if (rolls !== undefined) {
          // Roll the targets now
          await ArchmageRolls.rollAll(rolls, actor);
          targets = 0;
          rolls.forEach(r => targets += r.total);
        } else {
          let keys = Object.keys(nlpMap);
          for (let x = 0; x < keys.length; x++) {
            if (targetLine.toLowerCase().includes(keys[x])) targets = nlpMap[keys[x]];
          }
          // Handle "each" or "all" or "every"
          if (targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.each")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.all")+" ")
            || targetLine.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.every")+" ")) {
            targets = Math.max(game.user.targets.size, 1);
          }
        }
      }
    }

    return {targets: targets, rolls: rolls, targetLine: newTargetLine};
  }

  static addAttackMod(item) {
    // Add @atk.mod modifier to the first inline roll, if it isn't 0
    let attackLine = item.system.attack.value;
    const actor = item.actor ?? game.user.character;
    let atkMod = actor?.getRollData().atk.mod ?? 0;
    if (atkMod) {
      let matches = [...attackLine.matchAll(INLINE_ROLLS_FILTER)];
      if (matches) {
        for (let match of matches) {
          let formula = match[1];
          let newFormula = formula.replace("]]", " + @atk.mod]]");
          attackLine = attackLine.replace(formula, newFormula);
        }
      }
    }
    return attackLine;
  }

  static rollItemAdjustAttacks(item, newAttackLine, numTargets) {
    // If the user has targeted tokens, limit number of rolls by the lower of
    // selected targets or number listed on the power. If no targets are
    // selected, just use the number listed on the power.
    let targetsCount = numTargets.targets;
    if (game.settings.get("archmage", "hideExtraRolls")){
      let selectedTargets = [...game.user.targets];
      if (selectedTargets.length > 0) targetsCount = Math.min(numTargets.targets, selectedTargets.length);
    }

    // Handle the special case of the Crescendo spell
    if (item.system?.special?.value?.toLowerCase().includes(
      game.i18n.localize("ARCHMAGE.TARGETING.crescendoSpecial").toLowerCase())) {
        newAttackLine = ArchmageRolls._handleCrescendo(newAttackLine);
      }

    // Split string into first inline roll and vs, and repeat roll as needed
    let match = new RegExp(game.i18n.localize("ARCHMAGE.CHAT.triggerVsRegex")).exec(newAttackLine);
    if (match) {
      let roll = match[1];
      let vs = match[2];
      newAttackLine = roll
      for (let i = 1; i < targetsCount; i++) {
        newAttackLine += ", " + roll;
      }
      if (item.type == "action" && numTargets.rolls) {
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

  static async rollAll(rolls, actor, key=undefined) {
    for (let i=0; i<rolls.length; i++) {
      await rolls[i].evaluate();
      rolls[i].inlineRoll = ArchmageRolls._createInlineRollElementFromRoll(rolls[i]);
    }
  }

  static getInlineRolls(text, data) {
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
    a.innerHTML = `<i class="fas fa-dice-d20"></i>${data.label}`;
    return a;
  }

}
