import ITrigger from "./ITrigger.mjs";

/**
 * "Natural 1" - the natural roll has to be exactly this score.
 *
 * The score has to follow the "natural" keyword, and must not be the start of a threshold
 * ("natural 16+") or of a range ("natural 1-5"), both of which have their own trigger.
 */
export default class NaturalExactTrigger extends ITrigger {
    appliesTo(label) {
        return this._score(label) !== undefined;
    }

    test(outcome, label) {
        if (outcome.natural === undefined) return undefined;
        const score = this._score(label);
        if (score === undefined) return undefined;
        return outcome.natural === score;
    }

    _score(label) {
        const match = label.match(ITrigger.naturalRegex('\\s*(\\d+)(?!\\d)(?!\\s*[+\\-])'));
        return match ? parseInt(match[1]) : undefined;
    }
}
