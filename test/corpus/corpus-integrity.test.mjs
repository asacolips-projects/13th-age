/**
 * Corpus integrity: the generated scenarios.json is well-formed, traceable to pack
 * documents, and reproducible. Guards against hand-edits of the generated file and
 * against pack edits that silently invalidate a scenario's inputs.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { scenarios } from "./helpers.mjs";
import { SCENARIOS_JSON } from "./paths.mjs";
import { loadPackDoc } from "../../scripts/test-corpus/pack-loader.mjs";

describe("corpus integrity", () => {
	it("is committed and parseable", () => {
		expect(fs.existsSync(SCENARIOS_JSON)).toBe(true);
		expect(scenarios.length).toBeGreaterThan(0);
	});

	it("regenerates byte-identically from the pack sources", () => {
		const before = fs.readFileSync(SCENARIOS_JSON, "utf8");
		execFileSync("node", ["scripts/test-corpus/generate.mjs"], { cwd: process.cwd() });
		const after = fs.readFileSync(SCENARIOS_JSON, "utf8");
		expect(after).toBe(before);
	});

	it("references existing pack documents", () => {
		for (const s of scenarios) {
			if (s.source.pc) {
				const doc = loadPackDoc("pregen-characters", s.source.pc.file);
				expect(doc._id, s.id).toBe(s.source.pc.id);
			}
			for (const t of s.source.targets) {
				const doc = loadPackDoc("srd-monsters", t.monster);
				// The recorded name is the token name; a renamed token (mook multiples) is
				// "<pack name> 2" etc., so compare prefixes.
				expect(t.name.startsWith(doc.name), `${s.id}: ${t.name} from ${doc.name}`).toBe(true);
			}
		}
	});

	it("resolves the power named by each scenario", () => {
		for (const s of scenarios) {
			if (s.source.pc) {
				const doc = loadPackDoc("pregen-characters", s.source.pc.file);
				const power = (doc.items ?? []).find((i) => i.type === "power" && i.name === s.source.power.item);
				expect(power, `${s.id}: power ${s.source.power.item}`).toBeDefined();
				expect(power._id, s.id).toBe(s.source.powerId);
			}
			else {
				const doc = loadPackDoc(s.source.power.pack, s.source.power.file);
				expect(doc._id, s.id).toBe(s.source.powerId);
			}
		}
	});

	it("has expected outcomes that do not depend on production code", () => {
		for (const s of scenarios) {
			expect(s.expect, s.id).toBeDefined();
			expect([..."hit miss crit undecided".split(" "), undefined], s.id).toContain(s.expect.outcome);
		}
	});

	it("has stable settings on every scenario", () => {
		const defaults = {
			optionalBaseCritRange: false,
			secondEdition: false,
			multiTargetAttackRolls: false,
			showDefensesInChat: false,
			showVulnsInChat: false
		};
		for (const s of scenarios) {
			for (const [key, value] of Object.entries(s.settings)) {
				expect(defaults, `${s.id}: unknown setting ${key}`).toHaveProperty(key);
				expect(typeof value, `${s.id}: ${key}`).toBe("boolean");
			}
		}
	});

	it("uses no Foundry-runtime-specific fields", () => {
		const json = JSON.stringify(scenarios);
		// Ownership, folders and timestamps are pack-source noise the corpus must not carry.
		for (const banned of ["ownership", "folder:", "createdAt", "updatedAt"]) {
			expect(json.includes(banned), banned).toBe(false);
		}
	});

	it("covers the documented power shapes", () => {
		const ids = scenarios.map((s) => s.id);
		// Auto-hit
		expect(ids).toContain("wizard-5-magic-missile-auto-hit");
		// 2d20kh
		expect(ids).toContain("barbarian-5-rage-melee-2d20kh-crit");
		// Fumble
		expect(ids).toContain("barbarian-1-melee-natural-1-fumble");
		// Dual-wield reroll
		expect(ids).toContain("fighter-5-dualwield-natural-2-reroll");
		// Multi-target
		expect(ids).toContain("bard-5-soundburst-1d4-three-of-four");
		// Even trigger
		expect(ids).toContain("sorcerer-5-scorching-ray-even-trigger-active");
		// No attacker
		expect(ids).toContain("unowned-item-no-attacker");
		// No targets
		expect(ids).toContain("rogue-5-melee-no-targets");
		// Optional 18+ crit range
		expect(ids).toContain("fighter-5-melee-18-crit-range");
	});
});
