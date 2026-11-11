/**
 * Corpus tests for hit evaluation, driven by scenarios generated from the system
 * packs (test/corpus/scenarios.json - regenerate with npm run generateTestCorpus).
 *
 * Each scenario is a real PC and power from src/packs/src/pregen-characters rolled
 * against real monsters from src/packs/src/srd-monsters, at fixed d20 faces, with
 * expected outcomes authored in scripts/test-corpus/scenario-spec.mjs from the game
 * rules. The tests assert semantics, never serialized HTML.
 */
import { describe, it, expect, beforeEach } from "vitest";
import HitEvaluation from "../../src/module/rolls/HitEvaluation.mjs";
import { scenarios } from "./helpers.mjs";
import { setup } from "../setup.mjs";

/**
 * Mount rows in jsdom and run HitEvaluation.processRowText over the attack row.
 * @param {object} scenario Scenario record.
 * @returns {object} HitEvaluation's results.
 */
const evaluate = (scenario) => {
	const container = document.createElement("div");
	container.innerHTML = scenario.fixture.rows.join("");
	const $attackRow = window.jQuery(container).find(".card-prop")
		.filter((_, el) => el.textContent.startsWith("Attack:"))
		.first();

	// Attacker config mirrors HitEvaluation's read of the actor document.
	const actor = scenario.fixture.actor;
	const critMod = scenario.options.critMod;

	return HitEvaluation.processRowText(
		$attackRow.html(),
		scenario.fixture.targets,
		$attackRow,
		actor,
		critMod
	);
};

/**
 * Names helper for clean assertions.
 * @param {object[]} targets Target documents.
 * @returns {string[]} Their names.
 */
const names = (targets) => targets.map((t) => t.name);

for (const scenario of scenarios) {
	const hasAttack = scenario.fixture.rows.some((r) => r.includes("<strong>Attack:</strong>"));
	if (!hasAttack) continue;

	describe(`corpus: ${scenario.id}`, () => {
		beforeEach(() => {
			// Per-scenario settings, applied to the shared globals.
			for (const [key, value] of Object.entries(scenario.settings)) {
				setup.setSetting(key, value);
			}
		});

		it("matches the authored outcome", () => {
			const results = evaluate(scenario);
			const expected = scenario.expect;

			if (expected.outcome === "hit") {
				expect(results.hasHit).toBe(true);
				expect(results.hasMissed).toBe(false);
				if (expected.targetsHit) expect(names(results.targetsHit)).toEqual(expected.targetsHit);
			}
			else if (expected.outcome === "miss") {
				expect(results.hasHit).toBe(false);
				expect(results.hasMissed).toBe(true);
				if (expected.targetsMissed) expect(names(results.targetsMissed)).toEqual(expected.targetsMissed);
				if (expected.fumble) expect(results.targetsFumbled).toEqual([true]);
			}
			else if (expected.outcome === "crit") {
				expect(results.hasHit).toBe(true);
				expect(results.targetsCrit).toContain(true);
			}
			else if (expected.outcome === "undecided") {
				// No targets: hit and miss stay undefined.
				expect(results.hasHit).toBeUndefined();
				expect(results.hasMissed).toBeUndefined();
				expect(results.targetsHit).toEqual([]);
				expect(results.targetsMissed).toEqual([]);
			}

			if (expected.defense) {
				expect(results.defenses.every((d) => d !== undefined)).toBe(true);
			}
		});

		it("evaluates every d20 roll against its target", () => {
			const results = evaluate(scenario);
			const rollCount = scenario.fixture.rows.some((r) => r.includes("Automatic hit"))
				? 0
				: scenario.fixture.rolls.length;
			expect(results.rollOutcomes).toHaveLength(rollCount || 1); // auto-hits push one roll-less outcome
			if (expected2(scenario, "vulnerabilities")) {
				expect(results.vulnerabilities).toEqual(expected2(scenario, "vulnerabilities"));
			}
		});
	});
}

/**
 * Read an optional expectation without tripping exactOptionalPropertyTypes-style checks.
 * @param {object} scenario Scenario record.
 * @param {string} key Expectation key.
 * @returns {*|undefined}
 */
function expected2(scenario, key) {
	return scenario.expect[key];
}
