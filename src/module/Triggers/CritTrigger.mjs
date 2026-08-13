import ITrigger from "./ITrigger.mjs";

export default class CritTrigger extends ITrigger {
    appliesTo(label) {
        return ITrigger.mentions(label, ITrigger.word("crit"), ["s", "ical", "icals"]);
    }

    // The crit range is not fixed at 20: it moves with the optional 18+ rule, with attacker and
    // target crit modifiers, and with the 1e barbarian's double-crit. HitEvaluation already
    // resolves all of that per roll, so we just read its verdict.
    test(outcome) {
        if (outcome.crit === undefined) return undefined;
        return outcome.crit;
    }
}
