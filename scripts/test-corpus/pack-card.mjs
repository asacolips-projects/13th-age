/**
 * Render a pack power's fields into the chat-card row HTML the real system produces
 * (templates/chat/power-card.html + ArchmageRolls), with inline rolls pre-rolled to
 * fixed natural faces.
 *
 * This is the pack-to-card adapter the corpus tests exercise: pack YAML in, the same
 * `.card-prop` row markup out that Foundry renders before preCreateChatMessageHandler
 * sees it. Damage rolls are resolved to their expected averages so hit-row rows carry
 * realistic numbers.
 */
import { attackBonusOf, isDoubleD20, attackRollCount } from "./resolve-formula.mjs";

/**
 * Serialize a roll the way Foundry escapes data-roll attributes (test/contract-fixtures.mjs).
 * @param {object} roll
 * @returns {string}
 */
function escapeRoll(roll) {
	return globalThis.encodeURI(JSON.stringify(roll));
}

/**
 * An inline-roll anchor for a d20 attack with a fixed natural face.
 * @param {object} args
 * @param {number} args.natural The d20 face.
 * @param {number} args.bonus Attack bonus.
 * @param {boolean} [args.double] 2d20kh shape (barbarian rage): two dice, highest kept.
 * @param {number} [args.natural2] Second die face when double.
 * @returns {string}
 */
function d20Anchor({ natural, bonus, double = false, natural2 = 1 }) {
	let results;
	let formula;
	if (double) {
		const keep = Math.max(natural, natural2);
		results = [natural, natural2].map((result) => ({
			result,
			active: result === keep,
			discarded: result !== keep,
			rerolled: false
		}));
		formula = "2d20kh";
	}
	else {
		results = [{ result: natural, active: true, discarded: false, rerolled: false }];
		formula = "d20";
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

/**
 * An inline-roll anchor for a numeric or dice expression with a fixed total
 * (target counts like [[1d3]], damage like [[5]] or [[3d6]]).
 * @param {object} args
 * @param {string} args.formula e.g. "1d3", "3d6 + 2", "5".
 * @param {number} args.total The displayed (and deserialized) total.
 * @returns {string}
 */
function fixedAnchor({ formula, total }) {
	const isConstant = /^\d+$/.test(formula);
	const roll = isConstant
		? {
			class: "Roll", options: {}, dice: [], formula,
			terms: [{ class: "NumericTerm", number: total, options: {}, evaluated: true }],
			total, evaluated: true
		}
		: {
			class: "Roll", options: {}, dice: [], formula,
			terms: [{ class: "NumericTerm", number: total, options: {}, evaluated: true }],
			total, evaluated: true
		};
	return `<a class="inline-result" data-roll="${escapeRoll(roll)}"><i class="fas fa-dice-d20"></i>${total}</a>`;
}

/**
 * Replace the first [[...]] block of a line with an anchor.
 * @param {string} text
 * @param {string} anchor
 * @returns {string}
 */
function replaceFirstBrackets(text, anchor) {
	return text.replace(/\[\[.+?\]\]/, anchor);
}

/**
 * A card row, as templates/chat/power-card.html renders data.properties entries.
 * @param {string} label
 * @param {string} body
 * @returns {string}
 */
function propRow(label, body = "") {
	return `<div class="card-prop"><strong>${label}:</strong> ${body}</div>`;
}

/**
 * Render a power into chat-card rows, in the order power-card.html lists properties:
 * trigger, sustainOn, target, always, attack, hit, hitEven, hitOdd, crit, miss,
 * missEven, missOdd, resources.
 *
 * Attack rolls are placed at fixed natural faces; target counts and damage rolls are
 * resolved to stated totals. Powers with no attack line ("Automatic hit") render their
 * text verbatim.
 *
 * @param {object} args
 * @param {object} args.power The raw power item document from a pregen actor.
 * @param {object} args.actor Resolved actor numbers (pack-loader.actorOf).
 * @param {object} args.rolls Fixed outcomes: [{natural, natural2?}], one per d20 anchor.
 * @param {object} [args.damageTotals] Per-field fixed totals, e.g. {target: 2, hit: 17}.
 * @param {number} [args.repeatAttack] Place the attack line's roll this many times
 *   (once per target), as rollItemAdjustAttacks does for multi-target powers.
 * @param {object} [args.labels] Localized row labels; defaults to the en.yaml words.
 * @returns {string[]} Row HTML, in card order.
 */
export function powerCardRows({ power, actor, rolls, damageTotals = {}, repeatAttack = 1, labels }) {
	const system = power.system;
	const value = (key) => {
		const v = system[key]?.value;
		return (v === null || v === undefined) ? "" : String(v).trim();
	};

	// en.yaml ARCHMAGE.CHAT labels; overridable so a wording change surfaces here.
	const L = labels ?? {
		trigger: "Trigger", sustainOn: "Sustain On", target: "Target", always: "Always",
		attack: "Attack", hit: "Hit", hitEven: "Even Hit", hitOdd: "Odd Hit",
		crit: "Crit", miss: "Miss", missEven: "Even Miss", missOdd: "Odd Miss", resources: "Resources"
	};

	const rows = [];
	const rollIterator = (rolls ?? []).values();

	// Standalone pack powers (unowned items) have no actor: every bonus is 0.
	const resolvedActor = actor ?? { abilities: {}, std: 0, atk: {} };

	for (const key of ["trigger", "sustainOn", "target", "always", "attack", "hit", "hitEven", "hitOdd", "crit", "miss", "missEven", "missOdd", "resources"]) {
		let text = value(key);
		if (!text) continue;

		if (key === "attack") {
			const isAuto = /automatic hit/i.test(text);
			if (isAuto) {
				rows.push(propRow(L.attack, text));
				continue;
			}
			const bonus = attackBonusOf(text, resolvedActor);
			// repeatAttack > 1: the line's roll is repeated once per target before
			// rendering (rollItemAdjustAttacks' shape).
			if (repeatAttack > 1) {
				const single = /\[\[.+?\]\]/.exec(text)[0];
				text = text.replace(single, Array.from({ length: repeatAttack }, () => single).join(", "));
			}
			// Each [[...]] block on the line gets a fixed face.
			const rollCount = attackRollCount(text);
			const anchors = [];
			for (let i = 0; i < rollCount; i++) {
				const fixed = rollIterator.next();
				if (fixed.done) throw new Error(`Power ${power.name}: no fixed roll for attack roll ${i}`);
				anchors.push(d20Anchor({
					natural: fixed.value.natural,
					natural2: fixed.value.natural2 ?? 1,
					bonus,
					double: isDoubleD20(text)
				}));
			}
			let body = text;
			let index = 0;
			body = body.replace(/\[\[.+?\]\]/g, () => anchors[index++]);
			rows.push(propRow(L.attack, body));
			continue;
		}

		if (key === "target") {
			// Target lines may roll a count: "[[1d3]] nearby enemies". Fixed totals come
			// from damageTotals.target (one number per roll in the line).
			const countTotal = damageTotals.target;
			if (countTotal !== undefined && /\[\[.+?\]\]/.test(text)) {
				text = replaceFirstBrackets(text, fixedAnchor({ formula: "1d3", total: countTotal }));
			}
			rows.push(propRow(L.target, text));
			continue;
		}

		// Damage and effect rows with inline rolls: [[3d6 + 5]] -> anchor with fixed total.
		const fieldTotal = damageTotals[key];
		if (fieldTotal !== undefined) {
			text = text.replace(/\[\[.+?\]\]/g, () => fixedAnchor({ formula: String(fieldTotal), total: fieldTotal }));
		}
		rows.push(propRow(L[key] ?? key, text));
	}

	return rows;
}
