/**
 * Corpus tests for the full preCreateChatMessageHandler.handle pipeline, driven by
 * pack-derived scenarios (test/corpus/scenarios.json): real PC powers rendered to
 * chat-card rows, real monster targets, settings overrides, and expectations authored
 * in the scenario spec. Asserts semantics - row states, target names, effect links -
 * never serialized HTML.
 */
import { describe, it, expect, afterEach } from "vitest";
import preCreateChatMessageHandler from "../../src/module/hooks/preCreateChatMessageHandler.mjs";
import { scenarios, scenario, applySettings } from "./helpers.mjs";
import { setup } from "../setup.mjs";

/**
 * Run handle() over a scenario's card.
 * @param {object} s Scenario record.
 * @returns {{data: object, results: object|undefined, html: () => string}} The mutated
 *   message data, the hit evaluation, and a getter for the rewritten HTML.
 */
const run = (s) => {
	setup.setTargets(s.fixture.targets);
	const data = {
		content: s.fixture.rows.join(""),
		speaker: s.fixture.actor ? { actor: "pc" } : {}
	};
	// game.actors.get resolves the speaker's actor; register the PC when there is one.
	game.actors = { get: (id) => (id === "pc" ? s.fixture.actor : null) };
	try {
		const [, results] = preCreateChatMessageHandler.handle(
			data,
			{ ...s.options, actor: s.fixture.actor, item: { name: "corpus item" } },
			"user1"
		);
		return { data, results, html: () => data.content };
	}
	finally {
		game.actors = { get: () => null };
	}
};

/**
 * Parse a handler result's HTML into rows keyed by their leading label.
 * @param {string} html Chat-card HTML.
 * @returns {object} label -> row element.
 */
const rowsOf = (html) => {
	const container = document.createElement("div");
	container.innerHTML = html;
	const rows = {};
	for (const el of container.querySelectorAll(".card-prop")) {
		const strong = el.querySelector("strong");
		if (strong) rows[strong.textContent.replace(/:$/, "")] = el;
	}
	return rows;
};

// Reset settings after every scenario-bearing test.
let restore;
afterEach(() => {
	if (restore) restore();
	restore = undefined;
});

describe("corpus handler: outcomes and row states", () => {
	for (const s of scenarios) {
		const expects = s.expect;

		it(`${s.id}: ${expects.outcome}`, () => {
			restore = applySettings(s.settings);
			const { results, html } = run(s);

			if (!results) {
				// Non-attack cards (e.g. features without rolls) produce no evaluation.
				expect(expects.outcome).toBeUndefined();
				return;
			}

			const rows = rowsOf(html());

			// Hit / miss names appear on the matching rows.
			if (expects.outcome === "hit") {
				expect(results.hasHit).toBe(true);
				const hitRow = Object.values(rows).find((el) => el.textContent.startsWith("Hit:"));
				if (expects.targetsHit?.length && hitRow) {
					expect(hitRow.querySelector(".dc-target")).not.toBeNull();
					for (const name of expects.targetsHit) expect(hitRow.textContent).toContain(name);
				}
			}
			else if (expects.outcome === "miss") {
				expect(results.hasMissed).toBe(true);
				const missRow = Object.values(rows).find((el) => el.textContent.startsWith("Miss:"));
				if (expects.targetsMissed?.length) {
					expect(missRow?.querySelector(".dc-target")).not.toBeNull();
					for (const name of expects.targetsMissed) expect(missRow.textContent).toContain(name);
				}
			}
			else if (expects.outcome === "crit") {
				expect(results.hasHit).toBe(true);
				expect(results.targetsCrit).toContain(true);
				// Crit names are bold on the hit row.
				const hitRow = Object.values(rows).find((el) => el.textContent.startsWith("Hit:"));
				expect(hitRow?.querySelector(".dc-target b")).not.toBeNull();
			}
			else if (expects.outcome === "undecided") {
				expect(results.hasHit).toBeUndefined();
				expect(results.hasMissed).toBeUndefined();
			}

			// Trigger rows carry the expected active/inactive state.
			for (const trigger of expects.triggerRows ?? []) {
				const row = Object.values(rows).find((el) =>
					el.textContent.toLowerCase().startsWith(`${trigger.label}:`));
				expect(row, `trigger row '${trigger.label}' present`).not.toBeUndefined();
				expect(row.classList.contains(trigger.state)).toBe(true);
			}

			// Vulnerability row (setting-gated). Its HTML carries leading whitespace, so
			// match the strong element rather than the row's text prefix.
			if (expects.vulnRow) {
				const vulnRow = Object.values(rows).find((el) =>
					el.querySelector("strong")?.textContent.startsWith("Vulnerability"));
				expect(vulnRow, "vulnerability row present").not.toBeUndefined();
			}
		});
	}
});

describe("corpus handler: effect links from real power text", () => {
	it("Hold Monster's miss row links the dazed condition with its duration", () => {
		const s = scenario("wizard-5-hold-monster-md-miss-dazed");
		restore = applySettings(s.settings);
		const { html } = run(s);
		const rows = rowsOf(html());
		const missRow = Object.values(rows).find((el) => el.textContent.startsWith("Miss:"));
		const link = missRow?.querySelector("a.effect-link[data-type='condition']");
		expect(link).not.toBeNull();
		expect(link.dataset.id).toBe("dazed");
		expect(link.dataset.ends).toBe("EndOfNextSourceTurn"); // "until the end of your next turn"
		expect(link.textContent).toContain("dazed");
	});

	it("Soundburst's hit row links the dazed condition", () => {
		const s = scenario("bard-5-soundburst-1d4-three-of-four");
		restore = applySettings(s.settings);
		const { html } = run(s);
		const rows = rowsOf(html());
		const hitRow = Object.values(rows).find((el) => el.textContent.startsWith("Hit:"));
		const link = hitRow?.querySelector("a.effect-link[data-type='condition']");
		expect(link).not.toBeNull();
		expect(link.dataset.id).toBe("dazed");
		// "until end of your next turn" lacks "the", which the duration matcher requires:
		// the real card reports an unknown duration.
		expect(link.dataset.ends).toBe("Unknown");
	});

	it("Scorching Ray's even hit links ongoing fire damage", () => {
		const s = scenario("sorcerer-5-scorching-ray-even-trigger-active");
		restore = applySettings(s.settings);
		const { html } = run(s);
		const rows = rowsOf(html());
		const evenRow = Object.values(rows).find((el) => el.textContent.startsWith("Even Hit:"));
		const link = evenRow?.querySelector("a.effect-link[data-type='ongoing-damage']");
		expect(link).not.toBeNull();
		expect(link.dataset.value).toBe("8"); // [[1d8]] fixed to 8
		expect(link.dataset.damageType).toBe("fire ");
	});

	it("Breath of the Green links ongoing poison damage on the hit row", () => {
		const s = scenario("sorcerer-5-breath-green-ongoing-poison");
		restore = applySettings(s.settings);
		const { html } = run(s);
		const rows = rowsOf(html());
		const hitRow = Object.values(rows).find((el) => el.textContent.startsWith("Hit:"));
		const link = hitRow?.querySelector("a.effect-link[data-type='ongoing-damage']");
		expect(link).not.toBeNull();
		expect(link.dataset.value).toBe("25"); // 15 + cha.dmg 10
		expect(link.dataset.damageType).toBe("poison ");
	});
});

describe("corpus handler: auto-hit power", () => {
	it("Magic Missile hits without rolls", () => {
		const s = scenario("wizard-5-magic-missile-auto-hit");
		restore = applySettings(s.settings);
		const { results, html } = run(s);
		expect(results.hasHit).toBe(true);
		expect(results.hasMissed).toBe(false);
		expect(results.targetsHit.map((t) => t.name)).toEqual(["Orc Rager"]);
		// No natural-rolls spans: nothing was rolled.
		expect(html()).not.toContain("natural-rolls");
	});
});
