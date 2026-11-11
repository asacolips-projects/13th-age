/**
 * Contract tests for targeting: Targeting.selectTargets (the injectable boundary) and
 * getTargetsFromRowText (the Foundry-facing wrapper).
 */
import { describe, it, expect, vi } from "vitest";
import Targeting from "../src/module/rolls/Targeting.mjs";
import { target, targetRow } from "./contract-fixtures.mjs";
import { setup } from "./setup.mjs";

const targets = (...names) => names.map((name) => target({ name }));

/** Named RNG: deterministic sequences for shuffle tests. */
const sequenceRng = (...values) => {
	let index = 0;
	return () => values[index++ % values.length];
};

describe("selectTargets", () => {
	it("returns empty with no available targets", () => {
		expect(Targeting.selectTargets({
			rowText: "Target: 1d3 nearby enemies",
			rowTextContent: "Target: 1d3 nearby enemies",
			availableTargets: []
		})).toEqual([]);
	});

	it("returns all targets when the row states no count", () => {
		const [a, b] = targets("A", "B");
		expect(Targeting.selectTargets({
			rowText: "Target: enemies",
			rowTextContent: "Target: enemies",
			availableTargets: [a, b]
		})).toEqual([a, b]);
	});

	it("caps targets at the count in the row text", () => {
		const [a, b] = targets("A", "B");
		expect(Targeting.selectTargets({
			rowText: targetRow(1),
			rowTextContent: "Target: 1 nearby enemies",
			availableTargets: [a, b]
		})).toEqual([a]);
	});

	it("reads the count from the first number in the row content", () => {
		const [a, b, c] = targets("A", "B", "C");
		// "1d3" contributes its first number, 1.
		expect(Targeting.selectTargets({
			rowText: targetRow(1),
			rowTextContent: "Target: 1d3 nearby enemies",
			availableTargets: [a, b, c]
		})).toEqual([a]);
	});

	it("replicates targets when there are more rolls than targets", () => {
		// Two rolls against one target: the caller handles replication by concatenating;
		// selectTargets only caps, never trims below the stated count.
		const [a] = targets("A");
		expect(Targeting.selectTargets({
			rowText: targetRow(2),
			rowTextContent: "Target: 2 nearby enemies",
			availableTargets: [a]
		})).toEqual([a]);
	});

	it("uses the caller's count with multiTargetAttackRolls", () => {
		const [a, b, c] = targets("A", "B", "C");
		expect(Targeting.selectTargets({
			rowText: targetRow(3),
			rowTextContent: "Target: 1d3 nearby enemies",
			availableTargets: [a, b, c],
			numTargets: 2,
			multiTargetAttackRolls: true
		})).toEqual([a, b]);
	});

	it("keeps selection order when randomization is disabled", () => {
		const [a, b, c] = targets("A", "B", "C");
		expect(Targeting.selectTargets({
			rowText: "Target: 3 random enemies",
			rowTextContent: "Target: 3 random enemies",
			availableTargets: [a, b, c],
			randomWord: "random",
			random: () => 0.99
		})).toEqual([a, b, c]);
	});

	it("shuffles when the row mentions the random word", () => {
		const [a, b] = targets("A", "B");
		// A sequence of 0s walks Fisher-Yates to swap index 0 repeatedly.
		const result = Targeting.selectTargets({
			rowText: "Target: 2 random enemies",
			rowTextContent: "Target: 2 random enemies",
			availableTargets: [a, b],
			random: () => 0
		});
		expect(result).toHaveLength(2);
		// Deterministic: with a constant RNG the result is stable across runs.
		const again = Targeting.selectTargets({
			rowText: "Target: 2 random enemies",
			rowTextContent: "Target: 2 random enemies",
			availableTargets: [a, b],
			random: () => 0
		});
		expect(result.map((t) => t.name)).toEqual(again.map((t) => t.name));
	});

	it("randomizes to a deterministic order with a fixed sequence", () => {
		const [a, b] = targets("A", "B");
		// Fisher-Yates walks i from the end: with 2 entries, i=1 draws first. j >= i is an
		// identity swap, so the order changes only when the draw lands below i. Feeding
		// 0.4 (j=0, swap) then 0.999 yields [B, A].
		const result = Targeting.selectTargets({
			rowText: "Target: 2 random enemies",
			rowTextContent: "Target: 2 random enemies",
			availableTargets: [a, b],
			random: sequenceRng(0.4, 0.999)
		});
		expect(result.map((t) => t.name)).toEqual(["B", "A"]);
	});

	it("does not randomize when the random word is absent, whatever the RNG returns", () => {
		const [a, b] = targets("A", "B");
		expect(Targeting.selectTargets({
			rowText: "Target: 2 enemies",
			rowTextContent: "Target: 2 enemies",
			availableTargets: [a, b],
			random: () => 0.999
		})).toEqual([a, b]);
	});

	it("matches the random word case-insensitively", () => {
		const [a, b] = targets("A", "B");
		const result = Targeting.selectTargets({
			rowText: "Target: 2 Random enemies",
			rowTextContent: "Target: 2 Random enemies",
			availableTargets: [a, b],
			random: sequenceRng(0.4, 0.999)
		});
		expect(result.map((t) => t.name)).toEqual(["B", "A"]);
	});
});

describe("getTargetsFromRowText (Foundry wrapper)", () => {
	it("delegates to selectTargets with the user's targets", () => {
		const [a, b] = targets("A", "B");
		setup.setTargets([a, b]);
		document.body.innerHTML = `<div>${targetRow(1)}</div>`;
		const $row = window.jQuery(document.body).find(".card-prop");
		const result = Targeting.getTargetsFromRowText("Target: 1 nearby enemies", $row, 1);
		expect(result).toEqual([a]);
	});

	it("resolves cached UUIDs through fromUuidSync", () => {
		const a = target({ name: "Cached" });
		setup.setUuid("Scene.1.Token.A", a);
		document.body.innerHTML = `<div>${targetRow(1)}</div>`;
		const $row = window.jQuery(document.body).find(".card-prop");
		const result = Targeting.getTargetsFromRowText("Target: 1 nearby enemies", $row, 1, ["Scene.1.Token.A"]);
		expect(result).toEqual([a]);
	});

	it("uses the multiTargetAttackRolls setting for the target count", () => {
		const [a, b] = targets("A", "B");
		setup.setSetting("multiTargetAttackRolls", true);
		try {
			setup.setTargets([a, b]);
			document.body.innerHTML = `<div>${targetRow(1)}</div>`;
			const $row = window.jQuery(document.body).find(".card-prop");
			const result = Targeting.getTargetsFromRowText("Target: 1 nearby enemies", $row, 2);
			expect(result).toEqual([a, b]); // numTargets=2 beats the row's 1
		}
		finally {
			setup.setSetting("multiTargetAttackRolls", false);
		}
	});

	it("reads the localized random keyword", () => {
		const [a, b] = targets("A", "B");
		setup.setTargets([a, b]);
		document.body.innerHTML = `<div>${targetRow(2)}</div>`;
		const $row = window.jQuery(document.body).find(".card-prop");
		// en.yaml has "random"; the wrapper lowercases it before injecting.
		expect(game.i18n.localize("ARCHMAGE.TARGETING.random")).toBe("random");
		const result = Targeting.getTargetsFromRowText("Target: 2 random enemies", $row, 2);
		expect(result).toHaveLength(2);
	});

	it("never calls Math.random when the row is not random", () => {
		const [a] = targets("A");
		setup.setTargets([a]);
		document.body.innerHTML = `<div>${targetRow(1)}</div>`;
		const $row = window.jQuery(document.body).find(".card-prop");
		const spy = vi.spyOn(Math, "random");
		Targeting.getTargetsFromRowText("Target: 1 nearby enemies", $row, 1);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});
