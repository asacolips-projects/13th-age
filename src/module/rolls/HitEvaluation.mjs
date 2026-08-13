import ArchmageRolls from "../rolls/ArchmageRolls.mjs";

export default class HitEvaluation {

    static processRowText(row_text, targets, $row_self, attacker, critMod) {
        // If the user currently has Targets selected, try and figure out if we hit or missed said target

        let targetsHit = [];
        let targetsCrit = [];
        let targetsMissed = [];
        let targetsFumbled = [];
        let defenses = [];
        let vulnerabilities = new Set();
        let hasHit = undefined;
        let hasMissed = undefined;
        // One entry per d20 roll, in roll order. Unlike the targetsHit/targetsMissed pairs below,
        // this keeps each roll's natural value, crit state and hit state together, which is what
        // trigger rows need to evaluate conditions like "natural even hit" against a single roll.
        let rollOutcomes = [];

        let targetedDefenses = HitEvaluation._getTargetDefenses(row_text);
        const baseCritrange = game.settings.get("archmage", "optionalBaseCritRange") ? 18 : 20;
        let critRangeMin = baseCritrange - attacker?.system?.attributes.critMod.atk.value - critMod;

        let $rolls = $row_self.find('.inline-result');
        if ($rolls.length == 0) {
          // No rolls means it's an auto-hit
          targetsHit = targets;
          hasHit = true;
          hasMissed = false;
          // A rollless outcome: enough to resolve "hit"/"miss" rows, not the roll-dependent ones.
          rollOutcomes.push({natural: undefined, total: undefined, hit: true, crit: undefined,
            fumble: undefined, target: undefined, defense: undefined});
        } else {
          let targetsToProcess = Math.min($rolls.length, targets.length);
          $rolls.each(function (roll_index) {
            let $roll_self = $(this);
            let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));
            let rollTotal = roll_data.total;

            // Skip if not a d20 roll
            let isD20 = false;
            roll_data.terms.forEach(p => {if (p.faces === 20) isD20 = true;});
            if (!isD20) return;

            // Add natural-roll tooltips
            const origTooltip = $roll_self.attr('data-tooltip');
            const naturalRolls = roll_data.terms.filter(p => p.faces === 20)
              .flatMap(term => term.results.map(die => die.active ? die.result : `<s>${die.result}</s>`))
              .join(', ');
            const tooltipValue = game.i18n.format('ARCHMAGE.CHAT.NaturalRoll', {naturalRolls});
            $roll_self.attr('data-tooltip', origTooltip + '<br>' + tooltipValue)

            // Add and/or replace the natural-roll span
            if ($roll_self.next().attr("class") === "natural-rolls") $roll_self.next().remove();
            $roll_self.after(`<span class="natural-rolls" data-tooltip="${tooltipValue}">
              <i class="fas fa-n"></i>
              ${naturalRolls}
            </span>`);

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
                      $roll_self.addClass('dc-crit');
                      hasCrit = true;
                    }
                    // Natural 1.
                    else if (r.result === 1 && !r.discarded && !r.rerolled) {
                      $roll_self.addClass('dc-fail');
                      hasFumbled = true;
                    }
                    // Barbarian crit.
                    else if (attacker?.system?.details.detectedClasses?.includes("barbarian")
                      && !game.settings.get("archmage", "secondEdition")
                      && roll_data.formula.match(/^2d20kh/g) && part.results[0].result > 10
                      && part.results[1].result > 10) {
                      $roll_self.addClass('dc-crit');
                      hasCrit = true;
                    }
                    // Natural 2, if dual-wielding.
                    else if (attacker && attacker?.type === 'character'
                      && attacker.system.attributes.weapon.melee.dualwield
                      && r.result === 2 && !r.discarded && !r.rerolled) {
                      $roll_self.addClass('dc-reroll');
                    }
                  }
                });
              }
            }
            $rolls[roll_index] = $roll_self[0];
            $rolls[roll_index].d20result = rollResult;

            // Record what we know about this roll on its own. Hit state is filled in below, and
            // stays undefined when there is no target to resolve it against.
            const outcome = {natural: rollResult, total: rollTotal, hit: undefined, crit: hasCrit,
              fumble: hasFumbled, target: target, defense: undefined};
            rollOutcomes.push(outcome);

            // Target analysis, only perform if we actually have targets
            if (roll_index >= targetsToProcess) return;
            var targetDefense = HitEvaluation._getTargetDefenseValue(target, targetedDefenses);
            outcome.defense = targetDefense;
            if (targetDefense != undefined) {
              // The natural roll can override the arithmetic in both directions: a crit always
              // counts as a hit even when the total falls short of the defense, and a natural 1
              // always misses however high the total gets. Without this a natural 20 that doesn't
              // beat the defense reads as a crit *and* a miss, lighting up a "Crit:" and a
              // "Miss:" row off the same roll.
              // Note this only decides hit/miss. What a fumble does to miss damage is left to the
              // GM, like the rest of damage application.
              var hit = (rollTotal >= targetDefense || hasCrit) && !hasFumbled;
              outcome.hit = hit;
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

            for (let v of HitEvaluation._getTargetVulnerabilities(target)) {
              vulnerabilities.add(v);
            }
          });
        }

        // Update row with roll classes
        $row_self.find('.inline-result').replaceWith($rolls);

        return {
            targetsHit: targetsHit,
            targetsCrit: targetsCrit,
            targetsMissed: targetsMissed,
            targetsFumbled: targetsFumbled,
            hasHit: hasHit,
            hasMissed: hasMissed,
            rollOutcomes: rollOutcomes,
            defenses: defenses,
            vulnerabilities: Array.from(vulnerabilities),
            $rolls: $rolls
        };
    }

    // Get either the Token overridden value or the base sheet value.
    // With several defenses (e.g. "vs. PD or MD") the attack resolves against the lowest one.
    static _getTargetDefenseValue(target, defenses) {
        const values = defenses
            .map(defense => target.actor?.system.attributes[defense]?.value)
            .filter(value => value !== undefined && value !== null && value !== '')
            .map(Number)
            .filter(value => !Number.isNaN(value));
        if (values.length === 0) return undefined;
        return Math.min(...values);
    }

    // Returns a list of vulnerabilities. If the "vulnerable" condition is present, it is included as "vulnerable".
    static _getTargetVulnerabilities(target) {
      // Actor vulnerabilities
      const vulnText = (target.actor?.system?.details?.vulnerability?.value ?? '').trim()
      const ret = vulnText
        .split(',')
        .map(x => x.trim().toLowerCase())
        .filter(x => x);

      // the vulnerable condition
      const vulnerableCondition = target.actor?.effects?.find?.(x => x.statuses?.has('vulnerable'))
      if (vulnerableCondition !== undefined) {
        // If it matches "vulnerable to <type>", extract the type
        const m = vulnerableCondition.name.match(/vulnerable\s+to\s+([a-zA-Z]+)/i);
        if (m) {
          ret.push(m[1].toLowerCase());
        } else {
          // Otherwise, just add "vulnerable"
          ret.push('vulnerable');
        }
      }

      return ret
    }

    static _getTargetCritDefenseValue(target) {
      if (!target) return 0;
      return target.actor?.system.attributes.critMod.def.value;
    }

    // Returns the list of defenses mentioned in the row text, in the order in which they appear.
    // Attacks can target or-separated combinations (e.g. "vs. PD or MD"), in which case every mentioned defense is returned.
    static _getTargetDefenses(row_text) {
        const text = row_text.toUpperCase();
        return ["ac", "pd", "md"]
            .map(key => ({key, index: text.indexOf(" " + game.i18n.localize(`ARCHMAGE.${key}.key`))}))
            .filter(x => x.index >= 0)
            .sort((a, b) => a.index - b.index)
            .map(x => x.key);
    }

  static getNames(targets, targetsSpecial) {
    let res = "";
    for (let i = 0; i < targets.length; i++) {
      if (targetsSpecial[i]) res += "<b>"
      res += targets[i].name;
      if (targetsSpecial[i]) res += "</b>"
      if (i+1 < targets.length) res += ", "
    }
    return res;
  }
}
