import { evaluateRoll, targetDefenseValue, targetCritDefenseValue, targetVulnerabilities, targetDefenses } from "./hit-rules.mjs";

export default class HitEvaluation {

	static processRowText(row_text, targets, $row_self, attacker, critMod) {
		// If the user currently has Targets selected, try and figure out if we hit or missed said target

		let targetsHit = [];
		let targetsCrit = [];
		let targetsMissed = [];
		let targetsFumbled = [];
		let defenses = [];
		const vulnerabilities = new Set();
		let hasHit = undefined;
		let hasMissed = undefined;
		// One entry per d20 roll, in roll order. Unlike the targetsHit/targetsMissed pairs below,
		// this keeps each roll's natural value, crit state and hit state together, which is what
		// trigger rows need to evaluate conditions like "natural even hit" against a single roll.
		let rollOutcomes = [];

		const targetedDefenses = targetDefenses(row_text);
		const baseCritrange = game.settings.get("archmage", "optionalBaseCritRange") ? 18 : 20;
		// Without an attacker (e.g. rolled from an unowned item) only the power's own modifier applies.
		const attackerConfig = attacker ? {
			critAtkMod: attacker?.system?.attributes.critMod.atk.value ?? 0,
			isBarbarian: attacker?.system?.details.detectedClasses?.includes("barbarian"),
			isSecondEdition: game.settings.get("archmage", "secondEdition"),
			isDualWield: attacker.type === "character"
				&& attacker?.system?.attributes?.weapon?.melee?.dualwield
		} : undefined;

		let $rolls = $row_self.find(".inline-result");
		if ($rolls.length == 0) {
			// No rolls means it's an auto-hit
			targetsHit = targets;
			hasHit = true;
			hasMissed = false;
			// A rollless outcome: enough to resolve "hit"/"miss" rows, not the roll-dependent ones.
			rollOutcomes.push(evaluateRoll({
				target: undefined,
				attacker: attackerConfig,
				critMod,
				baseCritRange: baseCritrange
			}));
		}
		else {
			let targetsToProcess = Math.min($rolls.length, targets.length);
			$rolls.each(function (roll_index) {
				let $roll_self = $(this);
				const roll_data = Roll.fromJSON(unescape($roll_self.data("roll")));

				// Skip if not a d20 roll
				const isD20 = roll_data.terms.some((p) => p.faces === 20);
				if (!isD20) return;

				// Add natural-roll tooltips
				const origTooltip = $roll_self.attr("data-tooltip");
				const naturalRolls = roll_data.terms.filter((p) => p.faces === 20)
					.flatMap((term) => term.results.map((die) => die.active ? die.result : `<s>${die.result}</s>`))
					.join(", ");
				const tooltipValue = game.i18n.format("ARCHMAGE.CHAT.NaturalRoll", { naturalRolls });
				$roll_self.attr("data-tooltip", `${origTooltip}<br>${tooltipValue}`);

				// Add and/or replace the natural-roll span
				if ($roll_self.next().attr("class") === "natural-rolls") $roll_self.next().remove();
				$roll_self.after(`<span class="natural-rolls" data-tooltip="${tooltipValue}">
              <i class="fas fa-n"></i>
              ${naturalRolls}
            </span>`);

				const target = (roll_index < targetsToProcess) ? targets[roll_index] : undefined;
				const targetConfig = {
					critDefMod: targetCritDefenseValue(target),
					defenseValue: targetDefenseValue(target, targetedDefenses),
					vulnerabilities: targetVulnerabilities(target)
				};

				// Crit/fumble/hit arithmetic, delegated to the pure evaluator.
				const result = evaluateRoll({
					rollData: roll_data,
					target: targetConfig,
					attacker: attackerConfig,
					critMod,
					baseCritRange: baseCritrange
				});

				// Apply the verdict to the DOM.
				if (result.crit) $roll_self.addClass("dc-crit");
				if (result.fumble) $roll_self.addClass("dc-fail");
				if (result.reroll) $roll_self.addClass("dc-reroll");
				$rolls[roll_index] = $roll_self[0];
				$rolls[roll_index].d20result = result.natural;

				// Record what we know about this roll on its own. A crit hits whatever the target's
				// defense turns out to be, so it settles the hit state by itself and a trigger row can
				// rely on it with nothing targeted. Any other roll stays undefined until there is a
				// target to resolve it against, below.
				const outcome = { natural: result.natural, total: result.total, hit: result.crit ? true : result.hit,
					crit: result.crit, fumble: result.fumble, target: target, defense: result.defense };
				rollOutcomes.push(outcome);

				// Target analysis, only perform if we actually have targets
				if (roll_index >= targetsToProcess) return;

				outcome.defense = result.defense;
				if (result.defense != undefined) {
					if (result.hit) {
						targetsHit.push(target);
						targetsCrit.push(result.crit);
						if (hasHit == undefined || !hasHit) hasHit = true;
						if (hasMissed == undefined) hasMissed = false;
					}
					else {
						targetsMissed.push(target);
						targetsFumbled.push(result.fumble);
						if (hasMissed == undefined || !hasMissed) hasMissed = true;
						if (hasHit == undefined) hasHit = false;
					}
				}
				defenses.push(result.defense);

				for (let v of result.vulnerabilities) {
					vulnerabilities.add(v);
				}
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
			rollOutcomes: rollOutcomes,
			defenses: defenses,
			vulnerabilities: Array.from(vulnerabilities),
			$rolls: $rolls
		};
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
