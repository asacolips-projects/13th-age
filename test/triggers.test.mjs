/**
 * Contract tests for trigger labels: Triggers.labelOf, isTriggerRow and
 * evaluateRow (src/module/Triggers/*).
 *
 * Assertions are structured booleans or undefined, never generated card HTML.
 */
import { describe, it, expect } from "vitest";
import Triggers from "../src/module/Triggers/Triggers.mjs";
import { row, labels } from "./contract-fixtures.mjs";

/** A Triggers instance with a fresh set of registered triggers. */
const triggers = () => new Triggers();

/** Read the label of a row built from fixtures. */
const labelOf = (html) => {
	document.body.innerHTML = html;
	return Triggers.labelOf(window.jQuery(document.body).find(".card-prop"));
};

/** Mount a row and evaluate its trigger state against roll outcomes. */
const evaluate = (html, rollOutcomes) => {
	document.body.innerHTML = html;
	const $row = window.jQuery(document.body).find(".card-prop");
	const t = triggers();
	const label = Triggers.labelOf($row);
	return t.evaluateRow(label, rollOutcomes);
};

/**
 * A roll outcome with only the fields a trigger reads; unspecified booleans stay undefined.
 * @param {object} [options]
 */
const outcome = ({ natural, hit, crit, fumble } = {}) => ({ natural, hit, crit, fumble, target: undefined, defense: undefined });

describe("Triggers.labelOf", () => {
	it("reads the leading strong text, lowercased, without the colon", () => {
		expect(labelOf(row(labels.hit))).toBe("hit");
		expect(labelOf(row("Natural 16+"))).toBe("natural 16+");
	});

	it("returns null for rows without a label", () => {
		expect(labelOf("<div class='card-prop'>plain prose about a hit</div>")).toBeNull();
	});

	it("returns null when the strong does not end with a colon", () => {
		expect(labelOf("<div class='card-prop'><strong>Hit</strong> without colon</div>")).toBeNull();
	});
});

describe("isTriggerRow", () => {
	const cases = [
		["hit", true],
		["miss", true],
		["crit", true],
		["even", true],
		["odd", true],
		["natural 16+", true],
		["natural 1-5", true],
		["natural 5, 10, 15, or 20", true],
		["when the escalation die is 5+", true],
		["some free-form prose", false],
		[null, false]
	];
	for (const [label, expected] of cases) {
		it(`'${label}' -> ${expected}`, () => {
			expect(triggers().isTriggerRow(label)).toBe(expected);
		});
	}
});

describe("evaluateRow: hit and miss", () => {
	it("hit row activates on a hit", () => {
		expect(evaluate(row(labels.hit), [outcome({ hit: true })])).toBe(true);
	});

	it("hit row is inactive on a miss", () => {
		expect(evaluate(row(labels.hit), [outcome({ hit: false })])).toBe(false);
	});

	it("miss row activates on a miss", () => {
		expect(evaluate(row(labels.miss), [outcome({ hit: false })])).toBe(true);
	});

	it("hit row is undecided when no target settled the roll", () => {
		expect(evaluate(row(labels.hit), [outcome({ hit: undefined, natural: 10 })])).toBeUndefined();
	});

	it("hit or miss row activates on either outcome", () => {
		expect(evaluate(row("Hit / Miss"), [outcome({ hit: true })])).toBe(true);
		expect(evaluate(row("Hit / Miss"), [outcome({ hit: false })])).toBe(true);
	});
});

describe("evaluateRow: crit", () => {
	it("crit row activates on a crit", () => {
		expect(evaluate(row(labels.crit), [outcome({ crit: true, hit: true })])).toBe(true);
	});

	it("crit row is inactive on a normal roll", () => {
		expect(evaluate(row(labels.crit), [outcome({ crit: false, hit: true })])).toBe(false);
	});

	it("crit row is undecided before the roll is evaluated", () => {
		expect(evaluate(row(labels.crit), [outcome({ crit: undefined })])).toBeUndefined();
	});
});

describe("evaluateRow: even and odd", () => {
	it("even row activates on even naturals", () => {
		expect(evaluate(row("Natural even hit"), [outcome({ natural: 10, hit: true })])).toBe(true);
	});

	it("even row is inactive on odd naturals", () => {
		expect(evaluate(row("Natural even hit"), [outcome({ natural: 11, hit: true })])).toBe(false);
	});

	it("odd row activates on odd naturals", () => {
		expect(evaluate(row("Natural odd miss"), [outcome({ natural: 11, hit: false })])).toBe(true);
	});

	it("parity is undecided without a roll", () => {
		expect(evaluate(row("Natural even hit"), [outcome({ natural: undefined, hit: true })])).toBeUndefined();
	});

	it("a roll satisfies a conjunction on the same roll only", () => {
		// One even miss and one odd hit must not light up "natural even hit" (parity from the
		// first roll) - each clause has to hold for a single roll.
		expect(evaluate(row("Natural even hit"), [
			outcome({ natural: 12, hit: false }),
			outcome({ natural: 13, hit: true })
		])).toBe(false);
	});
});

describe("evaluateRow: natural exact values, ranges, and lists", () => {
	it("matches an exact natural", () => {
		expect(evaluate(row("Natural 20"), [outcome({ natural: 20 })])).toBe(true);
		expect(evaluate(row("Natural 20"), [outcome({ natural: 19 })])).toBe(false);
	});

	it("matches an inclusive range", () => {
		expect(evaluate(row("Natural 1-5"), [outcome({ natural: 5 })])).toBe(true);
		expect(evaluate(row("Natural 1-5"), [outcome({ natural: 6 })])).toBe(false);
		expect(evaluate(row("Natural 1–5"), [outcome({ natural: 1 })])).toBe(true); // en dash
	});

	it("matches lists with a final disjunction", () => {
		expect(evaluate(row("Natural 5, 10, 15, or 20"), [outcome({ natural: 15 })])).toBe(true);
		expect(evaluate(row("Natural 5, 10, 15, or 20"), [outcome({ natural: 16 })])).toBe(false);
	});

	it("matches lists without a final disjunction", () => {
		expect(evaluate(row("Natural 5, 6, 7, 8"), [outcome({ natural: 7 })])).toBe(true);
		expect(evaluate(row("Natural 5, 6, 7, 8"), [outcome({ natural: 9 })])).toBe(false);
	});
});

describe("evaluateRow: escalation thresholds", () => {
	it("activates when the escalation die meets the threshold", () => {
		// EscalationTrigger reads game.archmage.ArchmageUtility.getEscalation().
		game.archmage = { ArchmageUtility: { getEscalation: () => 5 } };
		try {
			expect(evaluate(row("When the escalation die is 5+"), [outcome({ natural: 10 })])).toBe(true);
			expect(evaluate(row("When the escalation die is 6+"), [outcome({ natural: 10 })])).toBe(false);
		}
		finally {
			delete game.archmage;
		}
	});
});

describe("evaluateRow: same-group alternatives and multiple clauses", () => {
	it("same-group alternatives activate on either condition", () => {
		// "hit or miss" is one clause with two same-group (outcome) alternatives.
		expect(evaluate(row("Hit or miss"), [outcome({ hit: false })])).toBe(true);
	});

	it("a new disjunction starts a second clause", () => {
		// "natural odd hit or miss OR natural even hit": two clauses. The first "or" stays
		// inside its clause (not followed by "natural"), the second starts a new one.
		const html = row("Natural odd hit or miss or natural even hit");
		expect(evaluate(html, [outcome({ natural: 11, hit: true })])).toBe(true); // clause 1: odd (hit or miss)
		expect(evaluate(html, [outcome({ natural: 11, hit: false })])).toBe(true); // clause 1: odd miss
		expect(evaluate(html, [outcome({ natural: 12, hit: true })])).toBe(true); // clause 2: even hit
		expect(evaluate(html, [outcome({ natural: 12, hit: false })])).toBe(false); // even miss: neither clause
	});

	it("unknown triggers are undecided, not inactive", () => {
		// A label with no recognizable condition never reports false.
		expect(triggers().evaluateRow("some unknown label", [outcome({ natural: 10 })])).toBeUndefined();
	});

	it("a row with no outcomes is undecided", () => {
		expect(evaluate(row(labels.hit), [])).toBeUndefined();
		expect(evaluate(row(labels.hit), undefined)).toBeUndefined();
	});

	it("multiple roll outcomes: any roll can activate the row", () => {
		const html = row("Natural 20");
		expect(evaluate(html, [outcome({ natural: 5 }), outcome({ natural: 20 })])).toBe(true);
		expect(evaluate(html, [outcome({ natural: 5 }), outcome({ natural: 19 })])).toBe(false);
	});

	it("an undecided roll does not hide another roll's positive verdict", () => {
		const html = row(labels.hit);
		expect(evaluate(html, [outcome({ hit: undefined }), outcome({ hit: true })])).toBe(true);
	});

	it("an undecided roll leaves an all-undecided row undecided", () => {
		const html = row(labels.hit);
		expect(evaluate(html, [outcome({ hit: undefined }), outcome({ natural: 8 })])).toBeUndefined();
	});
});
