import ITrigger from "./ITrigger.mjs";

export default class EvenTrigger extends ITrigger {
    appliesTo(label) {
        return ITrigger.mentions(label, ITrigger.word("even"));
    }

    test(outcome) {
        if (outcome.natural === undefined) return undefined;
        return outcome.natural % 2 === 0;
    }
}
