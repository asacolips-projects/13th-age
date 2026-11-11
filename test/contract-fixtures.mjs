/**
 * Reusable game-state fixtures for the chat-roll contract tests.
 *
 * Every factory takes the inputs the rules actually read, so tests state meaningful game
 * numbers ("attack 10 vs defense 12") instead of opaque blobs.
 */

// ---------------------------------------------------------------------------
// Actors and targets
// ---------------------------------------------------------------------------

/** Attributes block shape the rules code reads. */
function attributes({ ac, pd, md, critAtk = 0, critDef = 0 }) {
	return {
		ac: { value: ac },
		pd: { value: pd },
		md: { value: md },
		critMod: {
			atk: { value: critAtk },
			def: { value: critDef }
		}
	};
}

/**
 * A target token: name plus the actor attributes hit evaluation reads.
 * @param {object} [options]
 * @param {string} [options.name]
 * @param {number} [options.ac]
 * @param {number} [options.pd]
 * @param {number} [options.md]
 * @param {number} [options.critDef] Target crit-defense modifier (widens attacker crit range).
 * @param {string} [options.vulnerability] Comma-separated actor vulnerability text.
 * @param {Array<{name: string, statuses?: string[]}>} [options.effects] Actor effects.
 * @returns {object}
 */
export function target(options = {}) {
	const {
		name = "Goblin",
		ac = 16,
		pd = 12,
		md = 10,
		critDef = 0,
		vulnerability = "",
		effects = [],
		id = name
	} = options;
	return {
		id,
		name,
		actor: {
			system: {
				attributes: attributes({ ac, pd, md, critDef }),
				details: { vulnerability: { value: vulnerability } }
			},
			effects: effects.map((effect) => ({ ...effect, statuses: new Set(effect.statuses ?? []) }))
		}
	};
}

/**
 * An attacker actor. `type: null` gives an environment without an attacker document, as when a
 * power is rolled from an unowned item.
 * @param {object} [options]
 * @param {string|null} [options.type] "character" or "npc"; null for no attacker.
 * @param {number} [options.critAtk] Attacker crit-range modifier (positive widens crit range).
 * @param {string[]} [options.classes] detectedClasses, e.g. ["barbarian"].
 * @param {boolean} [options.dualwield]
 * @param {number} [options.level]
 */
export function attacker(options = {}) {
	const {
		type = "character",
		critAtk = 0,
		classes = [],
		dualwield = false,
		level = 1,
		role = null,
		strength = null
	} = options;
	if (type === null) return null;
	return {
		type,
		system: {
			attributes: {
				...attributes({ ac: 16, pd: 12, md: 10, critAtk }),
				weapon: { melee: { dualwield } }
			},
			details: {
				detectedClasses: classes,
				role: { value: role },
				strength: { value: strength }
			}
		}
	};
}

// ---------------------------------------------------------------------------
// Inline rolls
// ---------------------------------------------------------------------------

/**
 * A serialized inline-roll anchor for card HTML, as Foundry renders it. `natural` is the d20
 * face; `bonus` is added on to make the total. For 2d20kh rows, pass `naturals` with both
 * faces: the highest die is kept (active), the rest discarded.
 * @param {object} [options]
 * @param {number} [options.natural]
 * @param {number} [options.bonus]
 * @param {number[]} [options.naturals] Multiple d20 dice (barbarian 2d20kh); `natural` ignored.
 * @param {boolean[]} [options.discarded] Per-die discard flags, same length as naturals.
 * @param {boolean[]} [options.rerolled]
 * @returns {string} HTML anchor with an escaped data-roll attribute.
 */
export function inlineRoll({ natural = 10, bonus = 0, naturals, discarded = [], rerolled = [] } = {}) {
	let results;
	let formula;
	if (naturals) {
		// Keep-highest (2d20kh): the best face stays active, the others are discarded.
		const keep = Math.max(...naturals);
		results = naturals.map((result, index) => ({
			result,
			active: !discarded[index] && result === keep,
			discarded: discarded[index] ?? result !== keep,
			rerolled: rerolled[index] ?? false
		}));
		formula = `${naturals.length}d20kh`;
	}
	else {
		results = [{ result: natural, active: true, discarded: discarded[0] ?? false, rerolled: rerolled[0] ?? false }];
		formula = `${natural + bonus}`;
	}
	const d20Total = results.filter((die) => die.active).reduce((sum, die) => sum + die.result, 0);
	const roll = {
		class: "Roll",
		options: {},
		dice: [],
		formula,
		terms: [
			{ class: "DiceTerm", faces: 20, number: results.length, options: {}, results, total: d20Total },
			{ class: "NumericTerm", number: bonus, options: {}, evaluated: true }
		],
		total: d20Total + bonus,
		evaluated: true
	};
	return `<a class="inline-result" data-roll="${escapeRoll(roll)}"><i class="fas fa-dice-d20"></i>${d20Total + bonus}</a>`;
}

/** Serialize a roll the way Foundry escapes data-roll attributes. */
export function escapeRoll(roll) {
	return globalThis.encodeURI(JSON.stringify(roll));
}

/** Deserialize a data-roll attribute the way the production code does. */
export function unescapeRoll(text) {
	return globalThis.unescape(text);
}

// ---------------------------------------------------------------------------
// Card rows
// ---------------------------------------------------------------------------

/** Localized row labels used across the suites. */
export const labels = {
	attack: "Attack",
	hit: "Hit",
	miss: "Miss",
	crit: "Crit",
	target: "Target",
	effect: "Effect"
};

/**
 * A chat card row. Label and body become `<strong>Label:</strong> body`.
 * @param {string} label Row label, without the colon.
 * @param {string} body Row HTML, appended after the label.
 * @returns {string}
 */
export function row(label, body = "") {
	return `<div class="card-prop"><strong>${label}:</strong> ${body}</div>`;
}

/**
 * A full chat-card content block with arbitrary rows.
 * @param {string[]} rowsHtml Row HTML, e.g. from row()/inlineRoll().
 * @returns {string}
 */
export function card(rowsHtml) {
	return `<div class="wrapper">${rowsHtml.join("")}</div>`;
}

/**
 * An attack row: "Attack: [[...]] vs. AC".
 * @param {object|object[]} rolls One or more inlineRoll options; each becomes an inline roll.
 * @param {string} [defense] Defense key ("AC", "PD", "MD") or combination ("PD or MD").
 * @returns {string}
 */
export function attackRow(rolls, defense = "AC") {
	const list = Array.isArray(rolls) ? rolls : [rolls];
	const body = list.map((options) => inlineRoll(options)).join(" ") + ` vs. ${defense}`;
	return row(labels.attack, body);
}

/** A plain hit row. */
export function hitRow() {
	return row(labels.hit);
}

/** A plain miss row. */
export function missRow() {
	return row(labels.miss);
}

/**
 * A "Target: [[1d3]] nearby enemies" row.
 * @param {number} count Number of targets mentioned in the row text.
 */
export function targetRow(count = 1) {
	return row(labels.target, `${count} nearby enemies`);
}
