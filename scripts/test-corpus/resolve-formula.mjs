/**
 * Resolve the inline attack formulas found in pack power data into flat numbers.
 *
 * Pack attack lines follow a strict grammar: "[[d20 | 2d20kh] + TERM (+ TERM)*] vs. DEFENSE",
 * where a TERM is an ability modifier (@str.mod), the standard bonus (@std), an attack bonus
 * (@atk.m/r/a/d.bonus), a max() over ability modifiers, or a flat number. This resolver
 * supports exactly that grammar and throws on anything else, so a pack edit that introduces
 * a new shape fails the corpus generation loudly instead of baking in a wrong bonus.
 */

/** The defense a formula targets, e.g. "AC", "PD", or the combination "PD or MD".
 *
 * @param {string} attackFormula The attack line, e.g. "[[d20 + @str.mod]] vs. AC".
 * @returns {string|undefined} Uppercase defense key(s), or undefined when the line
 *   names none.
 */
export function defenseOf(attackFormula) {
	const match = /vs\.\s+(AC|PD|MD)(\s+or\s+(AC|PD|MD))?/i.exec(attackFormula);
	if (!match) return undefined;
	if (match[3]) return [match[2].toUpperCase(), match[3].toUpperCase()].join(" or ");
	return match[1].toUpperCase();
}

/** Is the attack a keep-highest two-die roll (barbarian rage)?
 *
 * @param {string} attackFormula The attack line.
 * @returns {boolean}
 */
export function isDoubleD20(attackFormula) {
	return /\[\[\s*2d20kh\b/.test(attackFormula);
}

/** How many d20 attack rolls the formula rolls (target-count independent; multi-roll lines list the roll twice).
 *
 * @param {string} attackFormula The attack line.
 * @returns {number}
 */
export function attackRollCount(attackFormula) {
	return [...attackFormula.matchAll(/\[\[/g)].length;
}

/**
 * Sum every TERM of the formula, given the actor's resolved numbers.
 * @param {string} attackFormula
 * @param {object} actor {abilities: {str: {mod}}, std, atk: {m, r, a, d}}
 * @returns {number} The summed bonus.
 */
export function attackBonusOf(attackFormula, actor) {
	// The formula body: the first [[...]] block, without the brackets.
	const match = /\[\[([^\]]+)\]\]/.exec(attackFormula);
	if (!match) throw new Error(`No inline roll in attack formula: ${attackFormula}`);
	const body = match[1];

	const terms = body.split("+").map((term) => term.trim());
	let bonus = 0;
	for (const term of terms) {
		bonus += termValueOf(term, actor, attackFormula);
	}
	return bonus;
}

/**
 * The value of one formula term.
 * @param {string} term
 * @param {object} actor As attackBonusOf.
 * @param {string} attackFormula For error messages.
 * @returns {number} The term's numeric contribution.
 */
function termValueOf(term, actor, attackFormula) {
	// Dice terms start the roll; they contribute no bonus.
	if (/^d\d+$/.test(term) || /^\d+d\d+$/.test(term) || term === "2d20kh") return 0;

	// max(@a.mod, @b.mod, ...)
	const maxMatch = /^max\((.+)\)$/.exec(term);
	if (maxMatch) {
		const inner = maxMatch[1].split(",").map((t) => termValueOf(t.trim(), actor, attackFormula));
		return Math.max(...inner);
	}

	// Ability modifiers: @str.mod
	const ability = /^@(\w{3})\.mod$/.exec(term);
	if (ability) {
		const mod = actor.abilities?.[ability[1]]?.mod;
		// Missing roll data (an unowned item with no actor) evaluates to 0.
		if (mod === undefined) {
			if (Object.keys(actor.abilities ?? {}).length === 0 && actor.std === 0) return 0;
			throw new Error(`Unknown ability in ${attackFormula}: ${term}`);
		}
		return mod;
	}

	// Standard bonus (level + escalation): @std
	if (term === "@std") return actor.std;

	// Attack bonuses: @atk.m.bonus and friends
	const atk = /^@atk\.([mrda])\.bonus$/.exec(term);
	if (atk) return actor.atk[atk[1]] ?? 0;

	// Flat numbers, positive or negative.
	if (/^-?\d+$/.test(term)) return Number(term);

	throw new Error(`Unsupported attack term in ${attackFormula}: ${term}`);
}
