import ITrigger from "./ITrigger.mjs";

/**
 * "When the escalation die is 2+" - the escalation die has to meet or beat a threshold.
 *
 * The die is read when the row is evaluated, not when the attack was rolled, so a reroll in a
 * later round sees that round's die.
 */
export default class EscalationTrigger extends ITrigger {
	get group() {
		return "escalation";
	}

	appliesTo(label) {
		return this._threshold(label) !== undefined;
	}

	test(outcome, label) {
		const threshold = this._threshold(label);
		if (threshold === undefined) return undefined;
		return game.archmage.ArchmageUtility.getEscalation() >= threshold;
	}

	_threshold(label) {
		const match = label.match(ITrigger.escalationRegex());
		return match ? parseInt(match[1]) : undefined;
	}
}
