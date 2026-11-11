/**
 * Minimal Foundry V12-shaped globals for the chat-roll contract tests.
 *
 * Everything here is deliberately shallow: real objects from en.yaml where the code reads
 * localization or configuration (CONFIG.ARCHMAGE.REGEXP, effectDurationTypes, status effects),
 * and overridable fakes everywhere else. Tests reach for the helpers at the bottom to
 * substitute settings, targets, UUID lookups and Sequencer calls per test.
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import jQuery from "jquery";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Localization, straight from the source of truth.
// ---------------------------------------------------------------------------
const yamlPath = path.resolve(__dirname, "../src/languages/en.yaml");
const en = yaml.load(fs.readFileSync(yamlPath, "utf8"));

/**
 * Resolve a dotted ARCHMAGE.* key against en.yaml. Throws for unknown keys so that a
 * renamed translation fails loudly in tests instead of silently matching nothing.
 * @param {string} key
 * @returns {string}
 */
function lookup(key) {
	const value = key.split(".").reduce((node, part) => {
		if (node === undefined || node === null) throw new Error(`Unknown localization key: ${key}`);
		return node[part];
	}, en);
	if (typeof value !== "string") throw new Error(`Non-scalar localization key: ${key}`);
	return value;
}

const format = (key, data) => Object.entries(data ?? {})
	.reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), lookup(key));

globalThis.game = {
	i18n: {
		localize: (key) => lookup(key),
		format: (key, data) => format(key, data)
	},
	settings: {
		/** Defaults mirror the system's registered settings; tests override per case. */
		_values: {
			optionalBaseCritRange: false,
			secondEdition: false,
			multiTargetAttackRolls: false,
			showDefensesInChat: false,
			showVulnsInChat: false
		},
		get: (_namespace, key) => game.settings._values[key],
		set: (key, value) => {
			game.settings._values[key] = value;
		}
	},
	user: {
		targets: new Map()
	},
	modules: new Map([
		["sequencer", { active: false }]
	]),
	actors: {
		get: () => null
	}
};

// ---------------------------------------------------------------------------
// CONFIG.ARCHMAGE, reproduced from src/module/setup/config.js (only what the tests need).
// ---------------------------------------------------------------------------
const statusEffects = [
	{ id: "dead", name: "ARCHMAGE.EFFECT.StatusDead", img: "icons/svg/skull.svg", journal: "ig1kzvpojsk20dbt" },
	{ id: "staggered", name: "ARCHMAGE.EFFECT.StatusStaggered", img: "icons/svg/blood.svg", journal: "oqkyq1xn6xi2ajmi" },
	{ id: "vulnerable", name: "ARCHMAGE.EFFECT.StatusVulnerable", img: "icons/svg/vulnerable.svg", journal: "vulnerable" },
	{ id: "ongoing-damage", name: "ARCHMAGE.EFFECT.StatusOngoingDamage", img: "icons/svg/degen.svg", journal: "ongoing-damage" }
];

globalThis.CONFIG = {
	ARCHMAGE: {
		is2e: false,
		statusEffects,
		effectDurationTypes: {
			Unknown: "ARCHMAGE.DURATION.Unknown",
			Infinite: "ARCHMAGE.DURATION.Infinite",
			StartOfNextTurn: "ARCHMAGE.DURATION.StartOfNextTurn",
			EndOfNextTurn: "ARCHMAGE.DURATION.EndOfNextTurn",
			StartOfNextSourceTurn: "ARCHMAGE.DURATION.StartOfNextSourceTurn",
			EndOfNextSourceTurn: "ARCHMAGE.DURATION.EndOfNextSourceTurn",
			EasySaveEnds: "ARCHMAGE.DURATION.EasySaveEnds",
			NormalSaveEnds: "ARCHMAGE.DURATION.NormalSaveEnds",
			HardSaveEnds: "ARCHMAGE.DURATION.HardSaveEnds",
			EndOfCombat: "ARCHMAGE.DURATION.EndOfCombat",
			EndOfArc: "ARCHMAGE.DURATION.EndOfArc",
			EndOfRound: "ARCHMAGE.DURATION.EndOfRound",
			StartOfEachTurn: "ARCHMAGE.DURATION.StartOfEachTurn"
		},
		REGEXP: {
			// Static source from config.js:1277, re-anchored on en.yaml so a wording change fails
			// loudly here instead of silently skipping the feature in production.
			ONGOING_DAMAGE: new RegExp(
				`(<a (?:(?!<a ).)*?><i class="fas fa-dice-d20"><\\/i>)*(-?\\d+)(<\\/a>)* (?:${lookup("ARCHMAGE.ongoing")} ([a-zA-Z]*(?: [a-zA-Z]+)?) ?${lookup("ARCHMAGE.damage")}|([a-zA-Z]+(?: [a-zA-Z]+)?) ${lookup("ARCHMAGE.ongoing")} ${lookup("ARCHMAGE.damage")})(?:\\s*\\((\\w*) ?${lookup("ARCHMAGE.DURATION.SaveEnds")}(?:, \\d*\\+)?\\))?`,
				"ig"
			),
			// Populated from statusEffects with journal entries, mirroring the ready hook in
			// archmage.js:655 (condition word -> [effect, matcher]).
			CONDITIONS: new Map(
				statusEffects.filter((effect) => effect.journal).map((effect) => {
					const localized = lookup(effect.name);
					return [
						localized,
						[
							effect,
							new RegExp(`\\*?\\b(${localized})\\b\\*?(?:\\s*\\(?(\\w*\\s?${lookup("ARCHMAGE.DURATION.SaveEnds")}|${lookup("ARCHMAGE.DURATION.NextTurnFilter")})(?:,\\s\\d*\\+)?\\)?)?`, "ig")
						]
					];
				})
			),
			FLEXIBLE_KINDS: {
				melee: /melee/i,
				ranged: /ranged/i
			}
		}
	}
};

// ---------------------------------------------------------------------------
// Foundry canvas / utility hooks.
// ---------------------------------------------------------------------------
globalThis.canvas = {
	tokens: {
		get: () => null,
		controlled: []
	}
};

/** UUID lookup: tests register documents with `setup.fromUuid` (a Map). */
globalThis.fromUuidSync = (uuid) => setup.fromUuid.get(uuid) ?? null;

globalThis.Roll = {
	fromJSON: (json) => JSON.parse(json)
};

// ---------------------------------------------------------------------------
// jQuery and the Sequencer.
// ---------------------------------------------------------------------------
globalThis.$ = jQuery;
globalThis.jQuery = jQuery;

/** Records every builder call so tests can assert on files and miss flags. */
class SequenceSpy {
	constructor() {
		this.calls = [];
		this.steps = [];
	}

	effect() {
		const step = { atLocation: [], stretchTo: [], file: undefined, missed: undefined, wait: undefined };
		this.steps.push(step);
		const builder = {
			atLocation: (...args) => {
				this.calls.push(["atLocation", ...args]);
				step.atLocation.push(...args);
				return builder;
			},
			stretchTo: (...args) => {
				this.calls.push(["stretchTo", ...args]);
				step.stretchTo.push(...args);
				return builder;
			},
			file: (file) => {
				this.calls.push(["file", file]);
				step.file = file;
				return builder;
			},
			missed: (missed) => {
				this.calls.push(["missed", missed]);
				step.missed = missed;
				return builder;
			},
			wait: (ms) => {
				step.wait = ms;
				return builder;
			}
		};
		return builder;
	}
}

globalThis.Sequence = SequenceSpy;

// ---------------------------------------------------------------------------
// Per-test helpers. Tests import { setup } to rewire the globals above.
// ---------------------------------------------------------------------------
const setup = {
	/** Registered documents for fromUuidSync, keyed by UUID. */
	fromUuid: new Map(),

	/**
	 * Replace a setting for the duration of a test.
	 * @param {string} key
	 * @param {*} value
	 */
	setSetting(key, value) {
		game.settings.set(key, value);
	},

	/**
	 * Replace the user's targets for the duration of a test.
	 * @param {Array<{name: string, actor?: object}>} targets
	 */
	setTargets(targets) {
		game.user.targets = new Map(targets.map((target) => [target.id ?? target.name, target]));
	},

	/**
	 * Register a document for fromUuidSync lookup.
	 * @param {string} uuid
	 * @param {object} document
	 */
	setUuid(uuid, document) {
		setup.fromUuid.set(uuid, document);
	},

	/**
	 * Enable the sequencer module so handle() builds a Sequence.
	 */
	enableSequencer() {
		game.modules.get("sequencer").active = true;
	},

	SequenceSpy
};

globalThis.setup = setup;

// A stable, controllable clock region for tests that need one; nothing uses it yet.
export { statusEffects, SequenceSpy, vi };
