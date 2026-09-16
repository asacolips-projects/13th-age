import ITrigger from "./ITrigger.mjs";

/**
 * "Natural 16+" - the natural roll has to meet or beat a threshold.
 *
 * The threshold is read as "a number immediately followed by a +", rather than from a bare "+"
 * anywhere in the row: the latter also matched plus signs coming from damage formulas.
 */
export default class NaturalMatchTrigger extends ITrigger {
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
        const match = label.match(/(\d+)\s*\+/);
        return match ? parseInt(match[1]) : undefined;
    }
}
