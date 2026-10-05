import ITrigger from "./ITrigger.mjs";

export default class OddTrigger extends ITrigger {
	get group() {
		return "parity";
	}

	appliesTo(label) {
		return ITrigger.mentions(label, ITrigger.word("odd"));
	}

	test(outcome) {
		if (outcome.natural === undefined) return undefined;
		return outcome.natural % 2 === 1;
	}
}
