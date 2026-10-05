/**
 * A single condition that a trigger row can express, such as "even", "hit" or "natural 16+".
 *
 * Each trigger only answers for its own condition: whether a label mentions it (`appliesTo`) and
 * whether a given roll satisfies it (`test`). Combining them is Triggers' job, which joins the
 * conditions of different groups with AND ("natural even hit" is even AND hit) and those of the
 * same group with OR ("hit or miss", "natural 5, 10, 15, or 20").
 *
 * @interface ITrigger
 */
export default class ITrigger {

	/**
	 * Does the row label mention this trigger's condition?
	 * @param {string} label Lowercased row label, as returned by Triggers.labelOf.
	 * @returns {boolean}
	 */
	appliesTo(label) {
		throw new Error("A subclass of ITrigger must implement the appliesTo method");
	}

	/**
	 * Is this trigger's condition satisfied by a single roll outcome?
	 * @param {object} outcome One entry of HitEvaluation's rollOutcomes.
	 * @param {string} label Lowercased row label, as returned by Triggers.labelOf.
	 * @returns {boolean|undefined} undefined when the outcome carries no information to decide,
	 *   for example hit/miss when no target was selected.
	 */
	test(outcome, label) {
		throw new Error("A subclass of ITrigger must implement the test method");
	}

	/**
	 * The group of conditions this one belongs to: conditions of the same group that a label
	 * mentions are alternatives to each other, since a roll can only satisfy one at a time.
	 * @returns {string}
	 */
	get group() {
		return this.constructor.name;
	}

	/**
	 * Localized, lowercased keyword from the ARCHMAGE.CHAT block.
	 * @param {string} key
	 * @returns {string}
	 */
	static word(key) {
		return game.i18n.localize(`ARCHMAGE.CHAT.${key}`).toLowerCase();
	}

	/**
	 * Does `label` mention `word` as a whole word?
	 *
	 * Boundaries are expressed as "not a letter or a digit" rather than \b, so that translations
	 * containing accented characters behave. Inflections have to be listed explicitly - matching
	 * any suffix would make "miss" match "missile" and "hit" match "hitherto".
	 *
	 * @param {string} label
	 * @param {string} word
	 * @param {string[]} [suffixes] Optional trailing forms to also accept, e.g. ['s', 'es'].
	 * @returns {boolean}
	 */
	static mentions(label, word, suffixes = []) {
		const tail = suffixes.length > 0 ? `(?:${suffixes.join("|")})?` : "";
		const regex = new RegExp(
			`${ITrigger.NOT_ALPHANUM_BEFORE}${ITrigger._escape(word)}${tail}${ITrigger.NOT_ALPHANUM_AFTER}`, "u");
		return regex.test(label);
	}

	/**
	 * Builds a regex anchored on the localized "natural" keyword, so that the number-matching
	 * triggers can only read a score that actually follows it.
	 * @param {string} pattern Regex source appended right after the keyword.
	 * @returns {RegExp}
	 */
	static naturalRegex(pattern) {
		const natural = ITrigger._escape(ITrigger.word("natural"));
		return new RegExp(`${ITrigger.NOT_ALPHANUM_BEFORE}${natural}${pattern}`, "u");
	}

	/**
	 * The localized words that join alternatives (ARCHMAGE.CHAT.disjunctions, a comma separated
	 * list, such as "or, otherwise"), as a regexp alternation.
	 * @returns {string}
	 */
	static disjunctions() {
		return ITrigger.word("disjunctions").split(",")
			.map((word) => word.trim())
			.filter((word) => word)
			.map((word) => ITrigger._escape(word))
			.join("|");
	}

	/**
	 * A threshold on the escalation die, "escalation die is 2+", capturing the threshold. The
	 * words in between stay within the same sentence.
	 * @param {string} [flags]
	 * @returns {RegExp}
	 */
	static escalationRegex(flags = "u") {
		const escalation = ITrigger._escape(game.i18n.localize("ARCHMAGE.escalationDieLabel").toLowerCase());
		return new RegExp(`${ITrigger.NOT_ALPHANUM_BEFORE}${escalation}[^\\d.;]*?(\\d+)\\s*\\+`, flags);
	}

	static get NOT_ALPHANUM_BEFORE() {
		return "(?<![\\p{L}\\p{N}])";
	}

	static get NOT_ALPHANUM_AFTER() {
		return "(?![\\p{L}\\p{N}])";
	}

	static _escape(text) {
		return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
}
