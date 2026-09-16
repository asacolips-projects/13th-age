import ITrigger from "./ITrigger.mjs";

/**
 * "Natural 1-5" - the natural roll has to fall inside an inclusive range.
 *
 * Common in monster stat blocks. Without this, the exact-score trigger used to read such a row
 * as "natural 1" and light it up on the wrong roll.
 */
export default class NaturalRangeTrigger extends ITrigger {
    appliesTo(label) {
        return this._range(label) !== undefined;
    }

    test(outcome, label) {
        if (outcome.natural === undefined) return undefined;
        const range = this._range(label);
        if (range === undefined) return undefined;
        return outcome.natural >= range.from && outcome.natural <= range.to;
    }

    _range(label) {
        const match = label.match(ITrigger.naturalRegex('\\s*(\\d+)\\s*-\\s*(\\d+)'));
        if (!match) return undefined;
        const from = parseInt(match[1]);
        const to = parseInt(match[2]);
        if (from > to) return undefined;
        return {from, to};
    }
}
