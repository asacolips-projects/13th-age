import ITrigger from "./ITrigger.mjs";

export default class MissTrigger extends ITrigger {
    appliesTo(label) {
        return ITrigger.mentions(label, ITrigger.word("miss"), ["es"]);
    }

    test(outcome) {
        if (outcome.hit === undefined) return undefined;
        return !outcome.hit;
    }
}
