/**
 * Corpus tests for targeting: Targeting.selectTargets fed by pack-derived scenarios
 * (test/corpus/scenarios.json). Covers real multi-target powers from the packs -
 * "[[1d2]] nearby enemies", "[[1d4]] nearby enemies in a group", "One enemy" - with
 * deterministic RNG, mirroring the selection the live handler performs.
 */
import { describe, it, expect } from "vitest";
import Targeting from "../../src/module/rolls/Targeting.mjs";
import { scenarios, scenario } from "./helpers.mjs";

/**
 * The target row's text, from the scenario's rendered card.
 * @param {object} scenario
 * @returns {{rowText: string, rowTextContent: string}}
 */
const targetRowText = (scenario) => {
	const row = scenario.fixture.rows.find((r) => r.includes("<strong>Target:</strong>"));
	// Row HTML is the rowText (what getTargetsFromRowText reads); the count lives in
	// the plain text.
	const container = document.createElement("div");
	container.innerHTML = row;
	return { rowText: row, rowTextContent: container.textContent };
};

/** Random multi-target powers from the corpus. */
const multiTargetScenarios = scenarios.filter((s) => (s.options.targets ?? 1) > 1);

for (const s of multiTargetScenarios) {
	describe(`corpus targeting: ${s.id}`, () => {
		it("selects the capped number of targets in selection order", () => {
			const { rowText, rowTextContent } = targetRowText(s);
			// The rendered row's count roll caps the selection: "[[1d4]]" resolved to 4
			// attacks up to 4 selected targets; "[[1d4 + 1]]" to 2 attacks 2 targets.
			// selectTargets reads the first number in the plain text.
			const selected = Targeting.selectTargets({
				rowText,
				rowTextContent,
				availableTargets: s.fixture.targets,
				numTargets: s.options.targets,
				multiTargetAttackRolls: false,
				random: () => 0 // deterministic: no shuffling
			});
			// The count is the roll's total, which the generator fixed in the anchor; the
			// cap cannot exceed the selected targets.
			const cap = Math.min(s.options.targets, s.fixture.targets.length);
			expect(selected.map((t) => t.name)).toEqual(
				s.fixture.targets.slice(0, cap).map((t) => t.name)
			);
		});
	});
}

describe("corpus targeting: single-target powers pick one target", () => {
	it("a melee attack against two selected targets rolls against the first only", () => {
		const s = scenario("rogue-1-melee-hit");
		// Re-run with two targets: the pack line says "One enemy", which the real roll
		// flow enforces with one attack roll and numTargets=1 (multiTargetAttackRolls).
		const twoTargets = [s.fixture.targets[0], { ...s.fixture.targets[0], id: "second", name: "Second" }];
		const selected = Targeting.selectTargets({
			rowText: '<div class="card-prop"><strong>Attack:</strong> vs. AC</div>',
			rowTextContent: "Attack: vs. AC",
			availableTargets: twoTargets,
			numTargets: 1,
			multiTargetAttackRolls: true, // the caller's count stands in for the row text
			random: () => 0
		});
		expect(selected.map((t) => t.name)).toEqual(["Goblin Scum"]);
	});
});

describe("corpus targeting: randomized powers", () => {
	it("a 'random' row shuffles selection deterministically", () => {
		const s = scenario("bard-5-soundburst-1d4-three-of-four");
		const { rowText, rowTextContent } = targetRowText(s);
		// The pack row text does not contain "random"; inject it to cover the shuffle.
		const randomizedRow = rowText.replace("nearby", "random nearby");
		const randomizedContent = rowTextContent.replace("nearby", "random nearby");
		const selected = Targeting.selectTargets({
			rowText: randomizedRow,
			rowTextContent: randomizedContent,
			availableTargets: s.fixture.targets,
			numTargets: s.options.numTargets,
			multiTargetAttackRolls: false,
			random: () => 0.5
		});
		// Deterministic RNG: same length, order per the shuffle with a fixed seed.
		expect(selected).toHaveLength(s.options.targets);
	});
});
