/**
 * Pure hit-evaluation rules for attack rolls. No DOM, no jQuery, no Foundry globals:
 * every input arrives as an argument and every verdict leaves as structured data, so a
 * future rolling engine can reuse these without a chat card in sight.
 *
 * @typedef {object} HitEvaluationAttackerConfig
 * @property {number} [critAtkMod] Attacker crit-range modifier (positive widens the crit range).
 * @property {boolean} [isBarbarian] 1e barbarian double-crit on 2d20kh both above 10.
 * @property {boolean} [isSecondEdition] Disables the 1e barbarian double-crit.
 * @property {boolean} [isDualWield] Enables the natural 2 reroll for character attackers.
 */

/**
 * @typedef {object} HitEvaluationTargetConfig
 * @property {number} [critDefMod] Target crit-defense modifier (positive widens attacker crit range).
 * @property {number|undefined} [defenseValue] Lowest applicable defense value, if any.
 * @property {string[]} [vulnerabilities] Extracted vulnerability list.
 */

/**
 * Structured verdict for a single d20 roll against a single (or no) target.
 * @typedef {object} HitEvaluationRollResult
 * @property {number|undefined} natural The d20 face; undefined for roll-less auto-hits.
 * @property {number|undefined} total Full roll total.
 * @property {boolean|undefined} hit undefined until a target defense settles it.
 * @property {boolean|undefined} crit
 * @property {boolean|undefined} fumble
 * @property {boolean|undefined} reroll Natural 2 while dual-wielding.
 * @property {number|undefined} defense The target defense the roll resolved against.
 * @property {string[]} vulnerabilities
 */

/**
 * Resolve one d20 roll against one target: crit, fumble, reroll, and (given a defense value)
 * hit or miss.
 *
 * The natural roll can override the defense arithmetic in both directions: a crit always
 * counts as a hit even when the total falls short of the defense, and a natural 1 always
 * misses however high the total gets. Without this a natural 20 that doesn't beat the
 * defense reads as a crit *and* a miss, lighting up a "Crit:" and a "Miss:" row off the
 * same roll. Note this only decides hit/miss. What a fumble does to miss damage is left to
 * the GM, like the rest of damage application.
 *
 * @param {object} args
 * @param {object} [args.rollData] Deserialized Foundry roll: `terms` with d20 dice, `total`,
 *   `formula`. Omit for roll-less auto-hits.
 * @param {HitEvaluationTargetConfig} [args.target] Target config; omit for untargeted rolls.
 * @param {HitEvaluationAttackerConfig} [args.attacker] Attacker config.
 * @param {number} [args.critMod] Extra crit-range modifier from the roll options.
 * @param {number} [args.baseCritRange] d20 face that starts the crit range (18 or 20).
 * @returns {HitEvaluationRollResult}
 */
export function evaluateRoll({ rollData, target: targetConfig, attacker: attackerConfig, critMod = 0, baseCritRange = 20 }) {
	const critAtkMod = attackerConfig?.critAtkMod ?? 0;
	const critDefMod = targetConfig?.critDefMod ?? 0;
	// Without an attacker (e.g. rolled from an unowned item) only the power's own modifier applies.
	const critRangeMin = baseCritRange - critAtkMod - critMod - critDefMod;

	const d20Terms = (rollData?.terms ?? []).filter((term) => term.faces === 20);
	const d20Term = d20Terms[0];
	const total = rollData?.total;

	// No d20 in the roll: an auto-hit with no dice to evaluate.
	if (!d20Term) {
		return {
			natural: undefined, total, hit: true, crit: undefined, fumble: undefined,
			reroll: undefined, defense: undefined, vulnerabilities: targetConfig?.vulnerabilities ?? []
		};
	}
	const natural = d20Term.total;

	let crit = false;
	let fumble = false;
	let reroll = false;
	const isBarbarianDoubleCrit = attackerConfig?.isBarbarian
		&& !attackerConfig?.isSecondEdition
		&& typeof rollData.formula === "string"
		&& rollData.formula.match(/^2d20kh/g) !== null
		&& d20Term.results.length > 1
		&& d20Term.results[0].result > 10
		&& d20Term.results[1].result > 10;
	for (const die of d20Term.results) {
		if (die.result >= critRangeMin && !die.discarded) crit = true;
		// Natural 1.
		else if (die.result === 1 && !die.discarded && !die.rerolled) fumble = true;
		// Barbarian crit: both kept dice above 10, first edition only.
		else if (isBarbarianDoubleCrit) crit = true;
		// Natural 2, if dual-wielding.
		else if (attackerConfig?.isDualWield && die.result === 2 && !die.discarded && !die.rerolled) reroll = true;
	}

	const defenseValue = targetConfig?.defenseValue;
	const hasTarget = targetConfig !== undefined && defenseValue !== undefined;
	const hit = hasTarget ? (total >= defenseValue || crit) && !fumble : undefined;

	return {
		natural, total, hit, crit, fumble, reroll,
		defense: defenseValue, vulnerabilities: targetConfig?.vulnerabilities ?? []
	};
}

/**
 * Lowest applicable defense value for a target: with several defenses (e.g. "vs. PD or MD")
 * the attack resolves against the lowest one.
 * @param {object|null} target Target token document.
 * @param {string[]} defenses Defense keys, e.g. ["ac", "pd"].
 * @returns {number|undefined}
 */
export function targetDefenseValue(target, defenses) {
	const values = defenses
		.map((defense) => target?.actor?.system?.attributes?.[defense]?.value)
		.filter((value) => value !== undefined && value !== null && value !== "")
		.map(Number)
		.filter((value) => !Number.isNaN(value));
	if (values.length === 0) return undefined;
	return Math.min(...values);
}

/**
 * The target's crit-defense modifier: how much it widens the attacker's crit range.
 * @param {object|null} target
 * @returns {number}
 */
export function targetCritDefenseValue(target) {
	if (!target) return 0;
	return target?.actor?.system?.attributes?.critMod?.def?.value;
}

/**
 * Extract a target's vulnerabilities. Actor text is a comma-separated list; the "vulnerable"
 * condition contributes either its type ("vulnerable to fire" -> "fire") or the bare word
 * "vulnerable" when no type is specified.
 * @param {object|null} target
 * @returns {string[]}
 */
export function targetVulnerabilities(target) {
	// Actor vulnerabilities
	const vulnText = (target?.actor?.system?.details?.vulnerability?.value ?? "").trim();
	const ret = vulnText
		.split(",")
		.map((x) => x.trim().toLowerCase())
		.filter((x) => x);

	// the vulnerable condition
	const vulnerableCondition = target?.actor?.effects?.find?.((x) => x.statuses?.has("vulnerable"));
	if (vulnerableCondition !== undefined) {
		// If it matches "vulnerable to <type>", extract the type
		const m = vulnerableCondition.name.match(/vulnerable\s+to\s+([a-zA-Z]+)/i);
		if (m) {
			ret.push(m[1].toLowerCase());
		}
		else {
			// Otherwise, just add "vulnerable"
			ret.push("vulnerable");
		}
	}

	return ret;
}

/**
 * Defenses mentioned in the row text, in order of appearance. Attacks can target
 * or-separated combinations (e.g. "vs. PD or MD"), in which case every mentioned defense is
 * returned.
 * @param {string} rowText Plain text of the attack row.
 * @param {object} [localization] `localize(key)` callable, backed by game.i18n in production.
 * @returns {string[]}
 */
export function targetDefenses(rowText, localization = (key) => game.i18n.localize(key)) {
	const text = rowText.toUpperCase();
	return ["ac", "pd", "md"]
		.map((key) => ({ key, index: text.indexOf(` ${localization(`ARCHMAGE.${key}.key`)}`) }))
		.filter((x) => x.index >= 0)
		.sort((a, b) => a.index - b.index)
		.map((x) => x.key);
}
