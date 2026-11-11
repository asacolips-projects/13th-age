/**
 * Contract tests for the pure hit-evaluation rules
 * (src/module/rolls/hit-rules.mjs), plus the DOM aggregate built by
 * HitEvaluation.processRowText around them.
 *
 * Assertions are structured verdicts, never serialized HTML.
 */
import { describe, it, expect } from "vitest";
import { evaluateRoll, targetDefenseValue, targetCritDefenseValue, targetVulnerabilities, targetDefenses } from "../src/module/rolls/hit-rules.mjs";
import HitEvaluation from "../src/module/rolls/HitEvaluation.mjs";
import { attacker, target, inlineRoll, row, labels } from "./contract-fixtures.mjs";
import { setup } from "./setup.mjs";

/** Build the rollData shape evaluateRoll reads, mirroring Roll.fromJSON output. */
function rollData({ natural = 10, bonus = 0, naturals, discarded = [], rerolled = [] } = {}) {
	const escaped = inlineRoll({ natural, bonus, naturals, discarded, rerolled }).match(/data-roll="([^"]*)/)[1];
	return { ...JSON.parse(unescape(escaped)), formula: naturals ? "2d20kh" : undefined };
}

describe("evaluateRoll", () => {
	it("auto-hits without inline rolls", () => {
		const result = evaluateRoll({ rollData: undefined });
		expect(result).toMatchObject({ natural: undefined, hit: true, crit: undefined, fumble: undefined });
	});

	it("hits when the total meets the defense", () => {
		const targetConfig = { defenseValue: 16 };
		const result = evaluateRoll({ rollData: rollData({ natural: 11, bonus: 5 }), target: targetConfig });
		expect(result).toMatchObject({ natural: 11, total: 16, hit: true, crit: false, fumble: false, defense: 16 });
	});

	it("misses when the total falls short of the defense", () => {
		const result = evaluateRoll({ rollData: rollData({ natural: 8, bonus: 3 }), target: { defenseValue: 16 } });
		expect(result).toMatchObject({ natural: 8, total: 11, hit: false, crit: false, fumble: false });
	});

	it("leaves hit undefined with a target but no defense value", () => {
		const result = evaluateRoll({ rollData: rollData({ natural: 15 }), target: {} });
		expect(result.hit).toBeUndefined();
		expect(result.defense).toBeUndefined();
	});

	it("leaves hit undefined with no target", () => {
		const result = evaluateRoll({ rollData: rollData({ natural: 15 }) });
		expect(result.hit).toBeUndefined();
	});

	it("crits on a natural 20 regardless of the total", () => {
		const result = evaluateRoll({ rollData: rollData({ natural: 20, bonus: 0 }), target: { defenseValue: 40 } });
		expect(result).toMatchObject({ natural: 20, hit: true, crit: true });
	});

	it("does not crit on 18 with the default crit range", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 18 }),
			target: { defenseValue: 40 },
			baseCritRange: 20
		});
		expect(result.crit).toBe(false);
	});

	it("honors the optional 18+ base crit range", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 18 }),
			target: { defenseValue: 40 },
			baseCritRange: 18
		});
		expect(result.crit).toBe(true);
	});

	it("does not crit at the default 20 base range when the optional rule is off", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 19 }),
			target: { defenseValue: 40 },
			baseCritRange: 20
		});
		expect(result.crit).toBe(false);
	});

	it("widens the crit range by the attacker's crit modifier", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 18 }),
			target: { defenseValue: 40 },
			attacker: { critAtkMod: 2 },
			baseCritRange: 20
		});
		expect(result.crit).toBe(true); // 20 - 2 = 18
	});

	it("widens the crit range by the target's crit defense", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 17 }),
			target: { defenseValue: 40, critDefMod: 3 },
			baseCritRange: 20
		});
		expect(result.crit).toBe(true); // 20 - 3 = 17
	});

	it("crit override: a crit hits even when the total is below the defense", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 20, bonus: 0 }),
			target: { defenseValue: 30 }
		});
		expect(result).toMatchObject({ hit: true, crit: true });
	});

	it("natural 1 misses even when the total beats the defense", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 1, bonus: 30 }),
			target: { defenseValue: 10 }
		});
		expect(result).toMatchObject({ hit: false, fumble: true, crit: false });
	});

	it("flags a natural 2 reroll for dual-wielding characters", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 2 }),
			attacker: { isDualWield: true }
		});
		expect(result.reroll).toBe(true);
	});

	it("does not flag a natural 2 reroll without dual wield", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 2 }),
			attacker: { isDualWield: false }
		});
		expect(result.reroll).toBe(false);
	});

	it("does not flag a natural 2 reroll for non-character attackers", () => {
		// The production adapter only sets isDualWield for character actors, so an NPC
		// attacker never carries the flag; assert the rule respects its absence.
		const result = evaluateRoll({
			rollData: rollData({ natural: 2 }),
			attacker: {}
		});
		expect(result.reroll).toBe(false);
	});

	it("does not flag a natural 2 reroll on discarded (lower) dice", () => {
		const result = evaluateRoll({
			rollData: rollData({ naturals: [2, 15], discarded: [true, false] }),
			attacker: { isDualWield: true }
		});
		expect(result.reroll).toBe(false);
	});

	it("crits a barbarian 2d20kh roll when both dice are above 10", () => {
		const result = evaluateRoll({
			rollData: rollData({ naturals: [11, 12] }),
			attacker: { isBarbarian: true, isSecondEdition: false }
		});
		expect(result).toMatchObject({ crit: true, natural: 12 });
	});

	it("does not crit a barbarian 2d20kh roll when a die is 10 or below", () => {
		const result = evaluateRoll({
			rollData: rollData({ naturals: [10, 12] }),
			attacker: { isBarbarian: true, isSecondEdition: false }
		});
		expect(result.crit).toBe(false);
	});

	it("does not apply the barbarian double-crit in second edition", () => {
		const result = evaluateRoll({
			rollData: rollData({ naturals: [11, 12] }),
			attacker: { isBarbarian: true, isSecondEdition: true }
		});
		expect(result.crit).toBe(false);
	});

	it("does not apply the barbarian double-crit without the 2d20kh formula", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 11 }),
			attacker: { isBarbarian: true, isSecondEdition: false }
		});
		expect(result.crit).toBe(false);
	});

	it("reports vulnerabilities for the target", () => {
		const result = evaluateRoll({
			rollData: rollData({ natural: 5 }),
			target: { vulnerabilities: ["fire"] }
		});
		expect(result.vulnerabilities).toEqual(["fire"]);
	});
});

describe("targetDefenseValue", () => {
	it("returns the single defense value", () => {
		expect(targetDefenseValue(target({ ac: 17 }), ["ac"])).toBe(17);
	});

	it("returns the lowest of several defenses", () => {
		expect(targetDefenseValue(target({ ac: 18, pd: 12, md: 14 }), ["pd", "md"])).toBe(12);
	});

	it("skips missing and non-numeric values", () => {
		const t = { actor: { system: { attributes: { ac: "", pd: { value: "nope" } } } } };
		expect(targetDefenseValue(t, ["ac", "pd", "md"])).toBeUndefined();
	});

	it("returns undefined without a target", () => {
		expect(targetDefenseValue(null, ["ac"])).toBeUndefined();
	});
});

describe("targetCritDefenseValue", () => {
	it("reads the target's crit defense modifier", () => {
		expect(targetCritDefenseValue(target({ critDef: 2 }))).toBe(2);
	});

	it("returns 0 without a target", () => {
		expect(targetCritDefenseValue(null)).toBe(0);
	});
});

describe("targetVulnerabilities", () => {
	it("splits and normalizes actor vulnerability text", () => {
		expect(targetVulnerabilities(target({ vulnerability: " Fire , Cold " }))).toEqual(["fire", "cold"]);
	});

	it("returns empty without actor text", () => {
		expect(targetVulnerabilities(target())).toEqual([]);
	});

	it("extracts the type from a 'vulnerable to <type>' condition", () => {
		const t = target({ effects: [{ name: "Vulnerable to fire", statuses: ["vulnerable"] }] });
		expect(targetVulnerabilities(t)).toEqual(["fire"]);
	});

	it("falls back to the bare 'vulnerable' condition", () => {
		const t = target({ effects: [{ name: "Vulnerable", statuses: ["vulnerable"] }] });
		expect(targetVulnerabilities(t)).toEqual(["vulnerable"]);
	});

	it("combines actor text with the condition", () => {
		const t = target({ vulnerability: "cold", effects: [{ name: "Vulnerable to fire", statuses: ["vulnerable"] }] });
		expect(targetVulnerabilities(t)).toEqual(["cold", "fire"]);
	});
});

describe("targetDefenses", () => {
	it("finds a single defense", () => {
		expect(targetDefenses("Attack: 10 vs. AC")).toEqual(["ac"]);
	});

	it("finds defenses in row order", () => {
		expect(targetDefenses("Attack: 10 vs. MD or AC")).toEqual(["md", "ac"]);
	});

	it("returns empty without a defense mention", () => {
		expect(targetDefenses("Attack: 10")).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// processRowText aggregate (DOM layer over the rules)
// ---------------------------------------------------------------------------

/** Mount a row in the jsdom document and process it. */
function process({ rowHtml, targets = [], attacker: attackerDoc, critMod = 0 }) {
	document.body.innerHTML = `<div>${rowHtml}</div>`;
	const $row = window.jQuery(document.body).find(".card-prop");
	return HitEvaluation.processRowText("Attack: vs. AC", targets, $row, attackerDoc, critMod);
}

describe("HitEvaluation.processRowText aggregate", () => {
	it("auto-hits all targets without inline rolls", () => {
		const t1 = target({ name: "Goblin" });
		const results = process({ rowHtml: row(labels.attack, "2 damage"), targets: [t1] });
		expect(results.targetsHit).toEqual([t1]);
		expect(results.hasHit).toBe(true);
		expect(results.hasMissed).toBe(false);
		expect(results.rollOutcomes[0]).toMatchObject({ natural: undefined, hit: true });
		expect(results.defenses).toEqual([]);
	});

	it("aggregates hit and miss across multiple rolls and targets", () => {
		const t1 = target({ name: "Goblin", ac: 12 });
		const t2 = target({ name: "Orc", ac: 20 });
		const rowHtml = row(labels.attack, [
			inlineRoll({ natural: 10, bonus: 5 }), // 15 vs 12: hit
			inlineRoll({ natural: 10, bonus: 2 }) // 12 vs 20: miss
		].join(" "));
		const results = process({ rowHtml, targets: [t1, t2] });
		expect(results.targetsHit).toEqual([t1]);
		expect(results.targetsMissed).toEqual([t2]);
		expect(results.hasHit).toBe(true);
		expect(results.hasMissed).toBe(true);
		expect(results.defenses).toEqual([12, 20]);
		expect(results.rollOutcomes).toHaveLength(2);
	});

	it("marks a crit roll's outcome as an immediate hit", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 20 }));
		const results = process({ rowHtml, targets: [] });
		expect(results.rollOutcomes[0]).toMatchObject({ natural: 20, hit: true, crit: true });
	});

	it("leaves non-crit outcomes undecided without targets", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 15, bonus: 0 }));
		const results = process({ rowHtml, targets: [] });
		expect(results.rollOutcomes[0]).toMatchObject({ natural: 15, hit: undefined, crit: false });
	});

	it("stops processing rolls beyond the number of targets", () => {
		const t1 = target({ name: "Goblin", ac: 12 });
		const rowHtml = row(labels.attack, [
			inlineRoll({ natural: 20 }),
			inlineRoll({ natural: 5 })
		].join(" "));
		const results = process({ rowHtml, targets: [t1] });
		expect(results.targetsHit).toEqual([t1]);
		// The second roll had no target: no missed entry.
		expect(results.targetsMissed).toEqual([]);
		expect(results.rollOutcomes).toHaveLength(2);
	});

	it("collects vulnerabilities across targets", () => {
		const t1 = target({ name: "A", vulnerability: "fire" });
		const t2 = target({ name: "B", vulnerability: "cold" });
		const rowHtml = row(labels.attack, [
			inlineRoll({ natural: 10 }),
			inlineRoll({ natural: 10 })
		].join(" "));
		const results = process({ rowHtml, targets: [t1, t2] });
		expect(results.vulnerabilities.sort()).toEqual(["cold", "fire"]);
	});

	it("ignores rolls without a d20 term", () => {
		const roll = { class: "Roll", options: {}, dice: [], formula: "5", terms: [{ class: "NumericTerm", number: 5, options: {}, evaluated: true }], total: 5, evaluated: true };
		const numericRow = `<div class="card-prop"><strong>${labels.attack}:</strong> <a class="inline-result" data-roll="${encodeURI(JSON.stringify(roll))}"><i class="fas fa-dice-d20"></i>5</a> vs. AC</div>`;
		const results = process({ rowHtml: numericRow, targets: [target()] });
		expect(results.rollOutcomes).toEqual([]);
		expect(results.hasHit).toBeUndefined();
	});

	it("widens the crit range with the attacker's critMod option", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 18 }));
		const results = process({ rowHtml, targets: [], attacker: attacker({ critAtk: 0 }), critMod: 2 });
		expect(results.rollOutcomes[0].crit).toBe(true);
	});

	it("adds the dc-crit class to crit rolls", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 20 }));
		process({ rowHtml, targets: [] });
		expect(document.querySelector(".inline-result").classList.contains("dc-crit")).toBe(true);
	});

	it("adds the dc-fail class to fumbled rolls", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 1 }));
		process({ rowHtml, targets: [] });
		expect(document.querySelector(".inline-result").classList.contains("dc-fail")).toBe(true);
	});

	it("adds the dc-reroll class to dual-wield natural 2 rolls", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 2 }));
		process({ rowHtml, targets: [], attacker: attacker({ dualwield: true }) });
		expect(document.querySelector(".inline-result").classList.contains("dc-reroll")).toBe(true);
	});

	it("appends a natural-rolls span with the natural values", () => {
		const rowHtml = row(labels.attack, inlineRoll({ natural: 20 }));
		process({ rowHtml, targets: [] });
		const span = document.querySelector(".natural-rolls");
		expect(span).not.toBeNull();
		expect(span.textContent).toContain("20");
	});

	it("uses the 18+ base crit range when the setting is enabled", () => {
		setup.setSetting("optionalBaseCritRange", true);
		try {
			const rowHtml = row(labels.attack, inlineRoll({ natural: 18 }));
			const results = process({ rowHtml, targets: [] });
			expect(results.rollOutcomes[0].crit).toBe(true);
		}
		finally {
			setup.setSetting("optionalBaseCritRange", false);
		}
	});

	it("applies the barbarian double-crit through the adapter", () => {
		const rowHtml = row(labels.attack, inlineRoll({ naturals: [11, 12] }));
		const results = process({ rowHtml, targets: [], attacker: attacker({ classes: ["barbarian"] }) });
		expect(results.rollOutcomes[0].crit).toBe(true);
		expect(document.querySelector(".inline-result").classList.contains("dc-crit")).toBe(true);
	});

	it("resolves multiple defenses to the lowest one through the adapter", () => {
		const t = target({ ac: 18, pd: 12, md: 15 });
		// processRowText reads defenses from the row text it is given.
		document.body.innerHTML = `<div>${row(labels.attack, inlineRoll({ natural: 10, bonus: 3 }))}</div>`;
		const $row = window.jQuery(document.body).find(".card-prop");
		const results = HitEvaluation.processRowText("Attack: 13 vs. PD or MD", [t], $row, null, 0);
		expect(results.defenses).toEqual([12]);
		expect(results.targetsHit).toEqual([t]); // 13 >= 12
	});
});
