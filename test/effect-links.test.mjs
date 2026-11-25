/**
 * Contract tests for effect-link HTML transformations
 * (src/module/rolls/effect-links.mjs).
 *
 * Every test parses the transformed HTML with querySelector and inspects semantics
 * (element type, data attributes, image presence) - never serialized markup.
 */
import { describe, it, expect } from "vitest";
import {
	durationKeyOf,
	normalizeItemName,
	replaceConditionReferencesInHtml,
	replaceOngoingEffectReferencesInHtml,
	replaceActiveEffectReferencesInHtml
} from "../src/module/rolls/effect-links.mjs";
import { setup } from "./setup.mjs";

const uuid = "Actor.abcd1234";
const conditions = CONFIG.ARCHMAGE.REGEXP.CONDITIONS;

/** Parse HTML in the jsdom document and return its first match. */
const parse = (html, selector) => {
	const container = document.createElement("div");
	container.innerHTML = html;
	return container.querySelector(selector);
};

describe("durationKeyOf", () => {
	it("maps save-ends variants", () => {
		expect(durationKeyOf("save ends")).toBe("NormalSaveEnds");
		expect(durationKeyOf("Save Ends")).toBe("NormalSaveEnds");
		expect(durationKeyOf("normal save ends")).toBe("NormalSaveEnds");
		expect(durationKeyOf("easy save ends")).toBe("EasySaveEnds");
		expect(durationKeyOf("hard save ends")).toBe("HardSaveEnds");
	});

	it("maps turn boundaries", () => {
		expect(durationKeyOf("until the start of the target's next turn")).toBe("StartOfNextTurn");
		expect(durationKeyOf("until the start of its next turn")).toBe("StartOfNextTurn");
		expect(durationKeyOf("until the end of the target's next turn")).toBe("EndOfNextTurn");
		expect(durationKeyOf("until the end of its next turn")).toBe("EndOfNextTurn");
		expect(durationKeyOf("until the start of your next turn")).toBe("StartOfNextSourceTurn");
		expect(durationKeyOf("until the end of your next turn")).toBe("EndOfNextSourceTurn");
	});

	it("returns Unknown for missing or unrecognized durations", () => {
		expect(durationKeyOf(undefined)).toBe("Unknown");
		expect(durationKeyOf("")).toBe("Unknown");
		expect(durationKeyOf("some made-up duration")).toBe("Unknown");
	});
});

describe("normalizeItemName", () => {
	it("strips a leading 'R: '", () => {
		expect(normalizeItemName("R: Mace of Smiting")).toBe("Mace of Smiting");
	});

	it("leaves other names alone", () => {
		expect(normalizeItemName("Mace of Smiting")).toBe("Mace of Smiting");
		expect(normalizeItemName("R:")).toBe("R:"); // prefix only, with the trailing space
	});
});

describe("replaceConditionReferencesInHtml", () => {
	it("links a condition without a duration as Unknown", () => {
		const link = parse(replaceConditionReferencesInHtml("The target is <strong>Stunned</strong>.", uuid, { conditions }), "a.effect-link");
		expect(link).not.toBeNull();
		expect(link.dataset.type).toBe("condition");
		expect(link.dataset.id).toBe("stunned");
		expect(link.dataset.source).toBe(uuid);
		expect(link.dataset.ends).toBe("Unknown");
	});

	it("keeps the matched text and strips emphasis markers", () => {
		const html = replaceConditionReferencesInHtml("The target is *Dazed* (save ends).", uuid, { conditions });
		const link = parse(html, "a.effect-link");
		expect(link.textContent).toContain("Dazed");
		expect(link.textContent).not.toContain("*");
	});

	it("records easy, normal, and hard save ends", () => {
		for (const [word, expected] of [["easy", "EasySaveEnds"], ["hard", "HardSaveEnds"], ["normal", "NormalSaveEnds"]]) {
			const link = parse(replaceConditionReferencesInHtml(`The target is Stunned (${word} save ends).`, uuid, { conditions }), "a.effect-link");
			expect(link.dataset.ends).toBe(expected);
		}
	});

	it("records plain '(save ends)' as NormalSaveEnds", () => {
		const link = parse(replaceConditionReferencesInHtml("The target is Stunned (save ends).", uuid, { conditions }), "a.effect-link");
		expect(link.dataset.ends).toBe("NormalSaveEnds");
	});

	it("records start and end of next turn", () => {
		// The possessive form has an apostrophe, which the NextTurnFilter branch does not
		// match ("until the \w* of \w* next turn" - the \w* slots take "the"/"its").
		const start = parse(replaceConditionReferencesInHtml("Stunned until the start of its next turn", uuid, { conditions }), "a.effect-link");
		expect(start.dataset.ends).toBe("StartOfNextTurn");
		const end = parse(replaceConditionReferencesInHtml("Stunned until the end of its next turn", uuid, { conditions }), "a.effect-link");
		expect(end.dataset.ends).toBe("EndOfNextTurn");
	});

	it("includes the condition's icon image", () => {
		const link = parse(replaceConditionReferencesInHtml("The target is Stunned.", uuid, { conditions }), "a.effect-link");
		const img = link.querySelector("img.effects-icon");
		expect(img).not.toBeNull();
		expect(img.getAttribute("src")).toBe("icons/svg/stun.svg");
	});

	it("resolves unknown duration text to Unknown", () => {
		const link = parse(replaceConditionReferencesInHtml("The target is Stunned (for a while).", uuid, { conditions }), "a.effect-link");
		expect(link.dataset.ends).toBe("Unknown");
	});
});

describe("replaceOngoingEffectReferencesInHtml", () => {
	const ongoing = (text) => replaceOngoingEffectReferencesInHtml(text, uuid, {
		ongoingRegexp: CONFIG.ARCHMAGE.REGEXP.ONGOING_DAMAGE,
		itemName: "Flaming Sword"
	});

	it("links positive ongoing damage with its value and type", () => {
		const link = parse(ongoing("5 ongoing acid damage"), "a.effect-link");
		expect(link).not.toBeNull();
		expect(link.dataset.type).toBe("ongoing-damage");
		expect(link.dataset.value).toBe("5");
		expect(link.dataset.damageType).toBe("acid ");
		expect(link.dataset.source).toBe(uuid);
		expect(link.dataset.name).toBe("Flaming Sword");
	});

	it("uses the degen icon for damage and regen for healing", () => {
		const damage = parse(ongoing("5 ongoing damage"), "a.effect-link img");
		expect(damage.getAttribute("src")).toBe("icons/svg/degen.svg");
		const healing = parse(ongoing("-3 ongoing damage"), "a.effect-link img");
		expect(healing.getAttribute("src")).toBe("icons/svg/regen.svg");
	});

	it("marks negative values (healing) with a negative data-value", () => {
		const link = parse(ongoing("-3 ongoing damage"), "a.effect-link");
		expect(link.dataset.value).toBe("-3");
	});

	it("reads the damage type before 'ongoing'", () => {
		const link = parse(ongoing("5 cold ongoing damage"), "a.effect-link");
		expect(link.dataset.damageType).toBe("cold ");
	});

	it("records save-ending metadata", () => {
		const easy = parse(ongoing("5 ongoing damage (easy save ends)"), "a.effect-link");
		expect(easy.dataset.ends).toBe("EasySaveEnds");
		const hard = parse(ongoing("5 ongoing damage (hard save ends)"), "a.effect-link");
		expect(hard.dataset.ends).toBe("HardSaveEnds");
		const normal = parse(ongoing("5 ongoing damage (save ends)"), "a.effect-link");
		expect(normal.dataset.ends).toBe("NormalSaveEnds");
	});

	it("reports Unknown-equivalent NormalSaveEnds without a save clause", () => {
		const link = parse(ongoing("5 ongoing damage"), "a.effect-link");
		expect(link.dataset.ends).toBe("NormalSaveEnds");
	});

	it("adds the localized save-ends label to the tooltip", () => {
		const link = parse(ongoing("5 ongoing damage (easy save ends)"), "a.effect-link");
		expect(link.dataset.tooltip).toContain("Easy Save Ends");
	});

	it("strips 'R: ' from the item name", () => {
		const html = replaceOngoingEffectReferencesInHtml("5 ongoing damage", uuid, {
			ongoingRegexp: CONFIG.ARCHMAGE.REGEXP.ONGOING_DAMAGE,
			itemName: "R: Flaming Sword"
		});
		expect(parse(html, "a.effect-link").dataset.name).toBe("Flaming Sword");
	});

	it("replaces inline-roll damage with the link text", () => {
		const link = parse(ongoing("<a class='inline-result'><i class='fas fa-dice-d20'></i>5</a> ongoing acid damage"), "a.effect-link");
		expect(link.dataset.value).toBe("5");
		expect(link.textContent).toContain("5 ongoing acid damage");
	});
});

describe("replaceActiveEffectReferencesInHtml", () => {
	const contentLink = (elementUuid) => `<a class="content-link" draggable="true" data-type="ActiveEffect" data-uuid="${elementUuid}">Stunned</a>`;

	it("upgrades a resolvable content link into an effect link", () => {
		setup.setUuid("Effect.x", { parent: { uuid: "Item.sword" }, img: "icons/svg/sun.svg" });
		try {
			const html = replaceActiveEffectReferencesInHtml(contentLink("Effect.x"), (u) => setup.fromUuid.get(u) ?? null);
			const link = parse(html, "a.effect-link");
			expect(link.dataset.source).toBe("Item.sword");
			expect(link.classList.contains("content-link")).toBe(true);
			const img = link.querySelector("img.effects-icon");
			expect(img).not.toBeNull();
			expect(img.getAttribute("src")).toBe("icons/svg/sun.svg");
		}
		finally {
			setup.fromUuid.delete("Effect.x");
		}
	});

	it("keeps existing text after the image", () => {
		setup.setUuid("Effect.x", { parent: { uuid: "Item.sword" }, img: "icons/svg/sun.svg" });
		try {
			const html = replaceActiveEffectReferencesInHtml(contentLink("Effect.x"), (u) => setup.fromUuid.get(u) ?? null);
			const link = parse(html, "a.effect-link");
			expect(link.textContent).toContain("Stunned");
		}
		finally {
			setup.fromUuid.delete("Effect.x");
		}
	});

	it("does not add a second image to links that already have one", () => {
		const html = `<a class="content-link" draggable="true" data-type="ActiveEffect" data-uuid="Effect.x"><img src="icons/svg/already.svg"/>Stunned</a>`;
		setup.setUuid("Effect.x", { parent: { uuid: "Item.sword" }, img: "icons/svg/sun.svg" });
		try {
			const result = replaceActiveEffectReferencesInHtml(html, (u) => setup.fromUuid.get(u) ?? null);
			expect(result.match(/<img/g)?.length).toBe(1);
			expect(parse(result, "a.effect-link img").getAttribute("src")).toBe("icons/svg/already.svg");
		}
		finally {
			setup.fromUuid.delete("Effect.x");
		}
	});

	it("leaves unresolvable UUIDs untouched", () => {
		const html = contentLink("Effect.missing");
		const result = replaceActiveEffectReferencesInHtml(html, () => null);
		expect(result).toBe(html);
	});

	it("leaves non-ActiveEffect content links alone", () => {
		const html = `<a class="content-link" draggable="true" data-type="Item" data-uuid="Item.x">Sword</a>`;
		const result = replaceActiveEffectReferencesInHtml(html, () => {
			throw new Error("should not be called");
		});
		expect(result).toBe(html);
	});
});
