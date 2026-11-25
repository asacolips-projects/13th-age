export default class Targeting {

	/**
	 * Resolve the targets for an attack row. Reads Foundry globals (the user's targets, the
	 * row's DOM, localization and settings) and delegates to selectTargets.
	 * @param {string} row_text
	 * @param {jQuery} $row_self
	 * @param {number} numTargets
	 * @param {string[]} [cachedTargets] UUIDs from the damage applicator, in place of the
	 *   user's current targets.
	 * @returns {object[]}
	 */
	static getTargetsFromRowText(row_text, $row_self, numTargets, cachedTargets = []) {
		return Targeting.selectTargets({
			rowText: row_text,
			// jsdom (the test environment) does not implement innerText; in Foundry the
			// first branch always applies.
			rowTextContent: $row_self[0].innerText ?? $row_self[0].textContent,
			availableTargets: cachedTargets.length < 1
				? [...game.user.targets.values()]
				: cachedTargets.map((uuid) => fromUuidSync(uuid)),
			numTargets,
			multiTargetAttackRolls: game.settings.get("archmage", "multiTargetAttackRolls"),
			randomWord: game.i18n.localize("ARCHMAGE.TARGETING.random").toLowerCase()
		});
	}

	/**
	 * Mostly pure targeting: pick the documents an attack roll applies to, given the row's
	 * text and the targets the user has selected. Randomization goes through the injected
	 * `random` callable so tests stay deterministic without stubbing Math.random.
	 *
	 * The row can cap the target count: a power that hits "[[1d3]] nearby enemies" attacks
	 * that many targets even with more selected, in selection order (unless randomized).
	 * With `multiTargetAttackRolls`, the caller's target count stands in for that number.
	 *
	 * @param {object} args
	 * @param {string} args.rowText Row HTML text; searched for the localized "random" keyword.
	 * @param {string} args.rowTextContent Row plain text (innerText); source of the target
	 *   count ("1d3" contributes the 1).
	 * @param {object[]} args.availableTargets User-selected targets, in selection order.
	 * @param {number} [args.numTargets] Caller's target count, used with multiTargetAttackRolls.
	 * @param {boolean} [args.multiTargetAttackRolls] Use numTargets instead of the row text.
	 * @param {string} [args.randomWord] The localized "random" keyword, lowercased.
	 * @param {() => number} [args.random] RNG in [0,1); Math.random in production.
	 * @returns {object[]}
	 */
	static selectTargets({
		rowText,
		rowTextContent,
		availableTargets,
		numTargets = 1,
		multiTargetAttackRolls = false,
		randomWord = "random",
		random = Math.random
	}) {
		let targets = availableTargets;
		if (targets.length == 0) return [];

		if (rowText.toLowerCase().includes(randomWord)) {
			targets = Targeting._shuffle(targets, random);
		}

		// If there are 3 targets selected but the attack only can hit 2 (ex: result of 1d3 nearby targets), then we slice to that amount, in order of selection (unless randomized)

		// This regex just finds any numbers in the string, and we use the first one
		let numberOfTargets = 0;
		if (!multiTargetAttackRolls) {
			let regex = /\d+/;
			numberOfTargets = regex.exec(rowTextContent);
		}
		else numberOfTargets = [numTargets];

		if (numberOfTargets && numberOfTargets.length == 1) {
			let maxTargets = parseInt(numberOfTargets[0]);
			targets = targets.slice(0, maxTargets);
		}

		return targets;
	}

	static _shuffle(a, random = Math.random) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
}
