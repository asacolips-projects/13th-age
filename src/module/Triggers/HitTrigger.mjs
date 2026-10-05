import ITrigger from "./ITrigger.mjs";

export default class HitTrigger extends ITrigger {
	get group() {
		return "outcome";
	}

	appliesTo(label) {
		return ITrigger.mentions(label, ITrigger.word("hit"), ["s"]);
	}

	test(outcome) {
		if (outcome.hit === undefined) return undefined;
		return outcome.hit;
	}
}
