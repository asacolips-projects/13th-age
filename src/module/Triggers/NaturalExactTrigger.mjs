import ITrigger from "./ITrigger.mjs";

/**
 * "Natural 1" - the natural roll has to be exactly this score. A list ("Natural 5, 6, 7, 8",
 * "Natural 5, 10, 15, or 20") accepts any of its scores.
 *
 * The score has to follow the "natural" keyword, and must not be the start of a threshold
 * ("natural 16+") or of a range ("natural 1-5"), both of which have their own trigger.
 */
export default class NaturalExactTrigger extends ITrigger {
    get group() {
        return "natural";
    }

    appliesTo(label) {
        return this._scores(label) !== undefined;
    }

    test(outcome, label) {
        if (outcome.natural === undefined) return undefined;
        const scores = this._scores(label);
        if (scores === undefined) return undefined;
        return scores.includes(outcome.natural);
    }

    _scores(label) {
        const or = ITrigger.disjunctions();
        const separator = `(?:\\s*,\\s*(?:(?:${or})\\s+)?|\\s+(?:${or})\\s+)`;
        const match = label.match(ITrigger.naturalRegex(`\\s*(\\d+(?:${separator}\\d+)*)(?!\\d)(?!\\s*[+\\-\u2013])`));
        return match ? match[1].match(/\d+/g).map((score) => parseInt(score)) : undefined;
    }
}
