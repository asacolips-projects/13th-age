import ITrigger from "./ITrigger.mjs";

/**
 * "Natural 16+" - the natural roll has to meet or beat a threshold.
 *
 * The threshold is read as "a number immediately followed by a +", rather than from a bare "+"
 * anywhere in the row: the latter also matched plus signs coming from damage formulas. A threshold
 * on the escalation die ("when the escalation die is 2+") is not one on the natural roll: that is
 * EscalationTrigger's.
 */
export default class NaturalMatchTrigger extends ITrigger {
    get group() {
        return "natural";
    }

    appliesTo(label) {
        return this._threshold(label) !== undefined;
    }

    test(outcome, label) {
        if (outcome.natural === undefined) return undefined;
        const threshold = this._threshold(label);
        if (threshold === undefined) return undefined;
        return outcome.natural >= threshold;
    }

    _threshold(label) {
        const match = label.replace(ITrigger.escalationRegex("gu"), "").match(/(\d+)\s*\+/);
        return match ? parseInt(match[1]) : undefined;
    }
}
