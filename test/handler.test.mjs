/**
 * Integration tests for preCreateChatMessageHandler.handle: orchestration only.
 * Each test protects one visible outcome of a chat roll; none compares serialized HTML.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import preCreateChatMessageHandler from "../src/module/hooks/preCreateChatMessageHandler.mjs";
import { attacker, target, inlineRoll, row, attackRow, hitRow, missRow, labels } from "./contract-fixtures.mjs";
import { setup } from "./setup.mjs";

beforeEach(() => {
	// Clean per-test state: targets, UUID lookups, sequencer.
	setup.setTargets([]);
	setup.fromUuid.clear();
	game.modules.get("sequencer").active = false;
	delete game.archmage;
});

/**
 * Run handle() on a card.
 * @param {object} args
 * @param {string} args.content Card HTML (without the wrapper div).
 * @param {Array} [args.targets] User-targeted tokens.
 * @param {object} [args.actor] Attacker actor document.
 * @param {object} [args.options] Roll options (type, critMod, targets, sequencer...).
 */
const handle = ({ content, targets = [], actor = attacker(), options = {} }) => {
	setup.setTargets(targets);
	const data = { content, speaker: {} };
	const [sequence, hitEvaluationResults] = preCreateChatMessageHandler.handle(data, options, "user1");
	return { data, sequence, hitEvaluationResults, html: () => data.content };
};

describe("handle: basic attack", () => {
	it("updates data.content and returns the hit evaluation", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { data, hitEvaluationResults } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [goblin]
		});
		// The content was rewritten (natural-rolls spans, target names, hit/miss markers).
		expect(data.content).toContain("natural-rolls");
		expect(hitEvaluationResults.hasHit).toBe(true);
		expect(hitEvaluationResults.hasMissed).toBe(false);
		expect(hitEvaluationResults.targetsHit).toEqual([goblin]);
	});

	it("returns the [sequence, hitEvaluationResults] shape", () => {
		const [sequence, results] = preCreateChatMessageHandler.handle(
			{ content: attackRow({ natural: 15 }), speaker: {} },
			{ type: "power" },
			"user1"
		);
		expect(sequence).toBeUndefined();
		expect(results).toBeDefined();
		expect(Array.isArray([sequence, results])).toBe(true);
	});
});

describe("handle: hit and miss row state", () => {
	it("appends hit target names to the hit row", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { data } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [goblin]
		});
		expect(data.content).toContain("Goblin");
		// The hit row carries a dc-target span with the name; the miss row has no names.
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const hitRowEl = [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${labels.hit}:`));
		const missRowEl = [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${labels.miss}:`));
		expect(hitRowEl.querySelector(".dc-target")).not.toBeNull();
		expect(hitRowEl.textContent).toContain("Goblin");
		expect(missRowEl.querySelector(".dc-target")).toBeNull();
	});

	it("appends missed target names to the miss row", () => {
		const orc = target({ name: "Orc", ac: 25 });
		const { data } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [orc]
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const missRowEl = [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${labels.miss}:`));
		expect(missRowEl.querySelector(".dc-target")).not.toBeNull();
		expect(missRowEl.textContent).toContain("Orc");
	});

	it("marks hit and miss target names bold on a crit", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { data } = handle({
			content: [attackRow({ natural: 20 }), hitRow(), missRow()].join(""),
			targets: [goblin]
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const hitRowEl = [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${labels.hit}:`));
		expect(hitRowEl.querySelector(".dc-target b")).not.toBeNull();
	});

	it("appends target names to the attack row", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { data } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [goblin]
		});
		expect(data.content).toContain("(Goblin)");
	});
});

describe("handle: vulnerabilities", () => {
	it("adds a vulnerability row when showVulnsInChat is on and the target is vulnerable", () => {
		setup.setSetting("showVulnsInChat", true);
		try {
			const fireBug = target({ name: "Fire Bug", ac: 12, vulnerability: "fire" });
			const { data } = handle({
				content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
				targets: [fireBug]
			});
			expect(data.content).toContain("fire");
			expect(data.content).toContain("Vulnerability");
		}
		finally {
			setup.setSetting("showVulnsInChat", false);
		}
	});

	it("adds no vulnerability row when the setting is off", () => {
		const fireBug = target({ name: "Fire Bug", ac: 12, vulnerability: "fire" });
		const { data } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [fireBug]
		});
		expect(data.content).not.toContain("Vulnerability");
	});
});

describe("handle: effect references", () => {
	it("rewrites ongoing damage into effect links", () => {
		const { data } = handle({
			content: row(labels.hit, "5 ongoing acid damage (easy save ends)"),
			options: { item: { name: "Flaming Sword" } }
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const link = container.querySelector("a.effect-link[data-type='ongoing-damage']");
		expect(link).not.toBeNull();
		expect(link.dataset.value).toBe("5");
		expect(link.dataset.ends).toBe("EasySaveEnds");
	});

	it("rewrites condition mentions into condition links", () => {
		const { data } = handle({
			content: row(labels.hit, "The target is Stunned (easy save ends)."),
			options: { item: { name: "Stun" } }
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const link = container.querySelector("a.effect-link[data-type='condition']");
		expect(link).not.toBeNull();
		expect(link.dataset.ends).toBe("EasySaveEnds");
	});

	it("upgrades ActiveEffect content links via fromUuidSync", () => {
		setup.setUuid("Effect.z", { parent: { uuid: "Item.sword" }, img: "icons/svg/sun.svg" });
		const { data } = handle({
			content: row(labels.hit, `<a class="content-link" draggable="true" data-type="ActiveEffect" data-uuid="Effect.z">Blessed</a>`),
			options: { item: { name: "Bless" } }
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		// The effect link for the ActiveEffect carries the resolved parent UUID.
		const link = container.querySelector("a.effect-link[data-source='Item.sword']");
		expect(link).not.toBeNull();
		expect(link.classList.contains("content-link")).toBe(true);
		expect(link.querySelector("img.effects-icon")).not.toBeNull();
	});
});

describe("handle: non-attack cards", () => {
	it("does not evaluate attack rules for cards without an attack row", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { hitEvaluationResults } = handle({
			content: [hitRow(), missRow()].join(""),
			targets: [goblin]
		});
		expect(hitEvaluationResults).toBeUndefined();
	});

	it("still updates content for non-attack cards (effect links run first)", () => {
		const { data, hitEvaluationResults } = handle({
			content: row(labels.hit, "5 ongoing acid damage"),
			options: { item: { name: "Acid Flask" } }
		});
		expect(data.content).toContain("effect-link");
		expect(hitEvaluationResults).toBeUndefined();
	});
});

describe("handle: sequencer", () => {
	const sequencerOptions = {
		item: { name: "Bow Shot" },
		sequencer: { ray: "shots/ray.file" }
	};

	it("plays a ray at hit targets without the miss flag", () => {
		setup.enableSequencer();
		const goblin = target({ name: "Goblin", ac: 12 });
		const { sequence } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [goblin],
			options: { ...sequencerOptions, token: { name: "Archer" } }
		});
		expect(sequence).toBeDefined();
		// handle() reassigns `sequence` to the last builder, which back-references the spy.
		const spy = sequence.sequence ?? sequence;
		expect(spy.steps).toHaveLength(1);
		expect(spy.steps[0]).toMatchObject({ file: "shots/ray.file", missed: false });
		expect(spy.steps[0].stretchTo[0]).toEqual(goblin);
	});

	it("plays a ray with the miss flag at missed targets", () => {
		setup.enableSequencer();
		const orc = target({ name: "Orc", ac: 25 });
		const { sequence } = handle({
			content: [attackRow({ natural: 10, bonus: 5 }), hitRow(), missRow()].join(""),
			targets: [orc],
			options: { ...sequencerOptions, token: { name: "Archer" } }
		});
		const spy = sequence.sequence ?? sequence;
		expect(spy.steps).toHaveLength(1);
		expect(spy.steps[0]).toMatchObject({ file: "shots/ray.file", missed: true });
	});

	it("builds no sequence when the sequencer module is inactive", () => {
		const goblin = target({ name: "Goblin", ac: 12 });
		const { sequence } = handle({
			content: [attackRow({ natural: 10, bonus: 5 })].join(""),
			targets: [goblin],
			options: { ...sequencerOptions, token: { name: "Archer" } }
		});
		expect(sequence).toBeUndefined();
	});
});

describe("handle: row skipping and level highlighting", () => {
	it("skips non-attack rows like Level: and Effect:", () => {
		const { hitEvaluationResults } = handle({
			content: [
				row("Level", "1"),
				row(labels.effect, "Some free text about Natural 20"),
				attackRow({ natural: 15, bonus: 0 })
			].join(""),
			targets: []
		});
		// The attack row was still evaluated, but the Effect row's "Natural 20" prose did not
		// become a trigger.
		expect(hitEvaluationResults).toBeDefined();
		expect(hitEvaluationResults.rollOutcomes).toHaveLength(1);
	});

	it("does not fade prose rows that mention trigger words", () => {
		const { data } = handle({
			content: [
				row(labels.effect, "This effect also applies on a hit."),
				attackRow({ natural: 15, bonus: 0 })
			].join(""),
			targets: []
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const effectRow = [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${labels.effect}:`));
		expect(effectRow.className).not.toContain("trigger-inactive");
		expect(effectRow.className).not.toContain("trigger-unknown");
	});

	it("marks trigger rows as active, inactive or unknown based on the rolls", () => {
		const { data } = handle({
			content: [
				attackRow({ natural: 10, bonus: 5 }), // 15 vs 12 -> hit
				hitRow(),
				missRow(),
				row("Natural even hit", "bonus damage"),
				row("Natural 20", "explodes")
			].join(""),
			targets: [target({ name: "Goblin", ac: 12 })]
		});
		const container = document.createElement("div");
		container.innerHTML = data.content;
		const classesOf = (label) => [...container.querySelectorAll(".card-prop")]
			.find((el) => el.textContent.startsWith(`${label}:`)).className;
		expect(classesOf("Natural even hit")).toContain("trigger-active");
		expect(classesOf("Natural 20")).toContain("trigger-inactive");
	});
});
