import ArchmageRolls from "../rolls/ArchmageRolls.mjs";

export default class HitEvaluation {

    static processRowText(row_text, targets, $row_self, attacker) {
        // If the user currently has Targets selected, try and figure out if we hit or missed said target

        let targetsHit = [];
        let targetsCrit = [];
        let targetsMissed = [];
        let targetsFumbled = [];
        let defenses = [];
        let hasHit = undefined;
        let hasMissed = undefined;

        let defense = HitEvaluation._getTargetDefense(row_text);
        let critRangeMin = 20 - attacker.system.attributes.critMod.atk.value;

        let $rolls = $row_self.find(".inline-result");
        if ($rolls.length == 0) {
          // No rolls means it's an auto-hit
          targetsHit = targets;
        }
 else {
          let targetsToProcess = Math.min($rolls.length, targets.length);
          $rolls.each(function (roll_index) {
            let $roll_self = $(this);
            let roll_data = Roll.fromJSON(unescape($roll_self.data("roll")));
            let rollTotal = roll_data.total;

            // Skip if not a d20 roll
            let isD20 = false;
            roll_data.terms.forEach((p) => {
if (p.faces === 20) isD20 = true;
});
            if (!isD20) return;

            // Crit/fumble check
            let rollResult = 0;
            let hasCrit = false;
            let hasFumbled = false;
            let target = (roll_index < targetsToProcess) ? targets[roll_index]: undefined;
            let critRangeMinTarget = critRangeMin - HitEvaluation._getTargetCritDefenseValue(target);
            for (let i = 0; i < roll_data.terms.length; i++) {
              var part = roll_data.terms[i];
              if (part.results) {
                let result = part.results.map((r) => {
                  if (part.faces === 20) {
                    rollResult = part.total;
                    // Crit
                    if (r.result >= critRangeMinTarget && !r.discarded) {
                      $roll_self.addClass("dc-crit");
                      hasCrit = true;
                    }
                    // Natural 1.
                    else if (r.result === 1 && !r.discarded && !r.rerolled) {
                      $roll_self.addClass("dc-fail");
                      hasFumbled = true;
                    }
                    // Barbarian crit.
                    else if (attacker?.system.details.detectedClasses?.includes("barbarian")
                      && roll_data.formula.match(/^2d20kh/g) && part.results[0].result > 10
                      && part.results[1].result > 10) {
                      $roll_self.addClass("dc-crit");
                      hasCrit = true;
                    }
                    // Natural 2, if dual-wielding.
                    else if (attacker && attacker.type === "character"
                      && attacker.system.attributes.weapon.melee.dualwield
                      && r.result === 2 && !r.discarded && !r.rerolled) {
                      $roll_self.addClass("dc-reroll");
                    }
                  }
                });
              }
            }
            $rolls[roll_index] = $roll_self[0];
            $rolls[roll_index].d20result = rollResult;

            // Target analysis, only perform if we actually have targets
            if (roll_index >= targetsToProcess) return;
            var targetDefense = HitEvaluation._getTargetDefenseValue(target, defense);
            if (targetDefense != undefined) {
              var hit = rollTotal >= targetDefense;
              if (hit) {
                targetsHit.push(target);
                targetsCrit.push(hasCrit);
                if (hasHit == undefined || !hasHit) hasHit = true;
                if (hasMissed == undefined) hasMissed = false;
              }
              else {
                targetsMissed.push(target);
                targetsFumbled.push(hasFumbled);
                if (hasMissed == undefined || !hasMissed) hasMissed = true;
                if (hasHit == undefined) hasHit = false;
              }
            }
            defenses.push(targetDefense);
          });
        }

        // Update row with roll classes
        $row_self.find(".inline-result").replaceWith($rolls);

        return {
            targetsHit: targetsHit,
            targetsCrit: targetsCrit,
            targetsMissed: targetsMissed,
            targetsFumbled: targetsFumbled,
            hasHit: hasHit,
            hasMissed: hasMissed,
            defenses: defenses,
            $rolls: $rolls
        };

    }

    // Get either the Token overridden value or the base sheet value
    static _getTargetDefenseValue(target, defense) {
        return target.actor.system.attributes[defense]?.value;
    }

    static _getTargetCritDefenseValue(target) {
      if (!target) return 0;
      return target.actor.system.attributes.critMod.def.value;
    }

    static _getTargetDefense(row_text) {
        if (row_text.toUpperCase().includes(` ${game.i18n.localize("ARCHMAGE.ac.key")}`)) {
            return "ac";
        }
        else if (row_text.toUpperCase().includes(` ${game.i18n.localize("ARCHMAGE.pd.key")}`)) {
            return "pd";
        }
        else if (row_text.toUpperCase().includes(` ${game.i18n.localize("ARCHMAGE.md.key")}`)) {
            return "md";
        }
    }

  static getNames(targets, targetsSpecial) {
    let res = "";
    for (let i = 0; i < targets.length; i++) {
      if (targetsSpecial[i]) res += "<b>";
      res += targets[i].name;
      if (targetsSpecial[i]) res += "</b>";
      if (i+1 < targets.length) res += ", ";
    }
    return res;
  }
}
