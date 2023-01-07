export function getSafeValue(property, defaultValue) {
  if (property) return property.value;
  return defaultValue;
}

export function localize(key) {
  return game.i18n.localize(key);
}

export function cssClass(string) {
  return encodeURIComponent(
    string.trim().toLowerCase()
  ).replace(/%[0-9A-F]{2}/gi, '-');
}

export function numberFormat(value, dec = 0, sign = false) {
  value = parseFloat(value).toFixed(dec);
  if (sign ) return ( value >= 0 ) ? `+${value}` : value;
  return value;
}

export function concat(...args) {
  return args.reduce((acc, cur) => {
    return acc + cur;
  }, '');
}

export function ordinalSuffix(number) {
  var last = number % 10,
      teens = number % 100;
  if (last == 1 && teens != 11) {
      return number + "st";
  }
  if (last == 2 && teens != 12) {
      return number + "nd";
  }
  if (last == 3 && teens != 13) {
      return number + "rd";
  }
  return number + "th";
}

/**
 * Replace inline rolls with alternate formatting and wrap with an additional
 * span tag for formatting.
 *
 * @param {string} text String to run replacements on.
 * @param {array} replacements Array of replacements. Each array item should be
 *   an array with the first index being the key to replace and the second index
 *   being the replacement.
 * @param {string} diceFormulaMode Defaults to 'short'. The replacement mode for
 *   dice formulas, which can be 'short', 'long', or 'numeric'.
 * @param {object|null} rollData Optional roll data to pass for numeric
 *   replacements.
 * @param {string} field Field the replacement is happening for, such as the
 *   'attack' field.
 *
 * @returns {string}
 */
export function wrapRolls(text, replacements = [], diceFormulaMode = 'short', rollData = null, field = null) {
  // Unproxy the roll data object.
  rollData = rollData ? JSON.parse(JSON.stringify(rollData)) : {};

  // Fallback.
  if (!diceFormulaMode) diceFormulaMode = 'short';

  // Build a map of string replacements.
  let replaceMap = replacements.concat([
    // Put these at the top for higher replacement priority
    ['[[/r', '<span class="expression">'],
    ['(@lvl)d(@wpn.m.dieNum-2)', '(WPN-2)'],
    ['(@lvl)d(@wpn.r.dieNum-2)', '(WPN-2)'],
    // Common replacements
    ['[[', '<span class="expression">'],
    [']]', '</span>'],
    ['@ed', 'ED'],
    ['@lvl', 'LVL'],
    ['@std', 'LVL+ED'], //STD
    ['@tier', 'TIER'],
    ['@str.mod', 'STR'],
    ['@str.dmg', 'STR×TIER'],
    ['@con.mod', 'CON'],
    ['@con.dmg', 'CON×TIER'],
    ['@dex.mod', 'DEX'],
    ['@dex.dmg', 'DEX×TIER'],
    ['@int.mod', 'INT'],
    ['@int.dmg', 'INT×TIER'],
    ['@wis.mod', 'WIS'],
    ['@wis.dmg', 'WIS×TIER'],
    ['@cha.mod', 'CHA'],
    ['@cha.dmg', 'CHA×TIER'],
    ['@atk.mod', 'ATK'],
    ['@wpn.m.dice', 'WPN'],
    ['@wpn.r.dice', 'WPN'],
    ['@wpn.j.dice', 'JAB'],
    ['@wpn.p.dice', 'PUNCH'],
    ['@wpn.k.dice', 'KICK'],
    ['@atk.m.bonus', 'ITM'], //ITM_MLE
    ['@atk.r.bonus', 'ITM'], //ITM_RNG
    ['@atk.a.bonus', 'ITM'], //ITM_ARC
    ['@atk.d.bonus', 'ITM'], //ITM_DIV
		['*', '×'], // needed to avoid passing asterisks to markdown
  ]);

  // Remove whitespace from inline rolls.
  let clean = text.toString();  // cast to string, could be e.g. number

  // Handle replacements for the 'short' syntax. Ex: WPN+DEX+LVL
  if (diceFormulaMode == 'short') {
    // Remove additional whitespace.
    text.toString().replace(/(\[\[)([^\[]*)(\]\])/g, (match) => {
      clean = clean.replace(match, match.replaceAll(' ', ''));
    });
    // Iterate over all of our potential replacements and replace them if
    // they're present.
    for (let [needle, replacement] of replaceMap) {
      clean = clean.replaceAll(needle, replacement);
    };
  }
  // Handle replacements for the 'long' syntax, which is the original inline
  // roll. Ex: [[@wpn.m.dice+@dex+@lvl]]
  else if (diceFormulaMode == 'long') {
    // Run a regex over all inline rolls.
    clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
      return `<span class="expression">[${p2}]</span>`;
    });
  }
  // Handle replacements for the 'numeric' syntax, which replacements all
  // numeric and static terms and condenses them into as few numbers as
  // possible. Ex: 5d8+9
  else if (diceFormulaMode == 'numeric') {
    // Run a regex over all inline rolls.
    clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
      // Get the roll formula. If this is an attack, append the attack mod.
      let rollFormula = field == 'attack' && p2.includes('d20') ? `${p2} + @atk.mod` : p2;
      // Create the roll and evaluate it.
      let roll = null;
      try {
        roll = new Roll(rollFormula, rollData);
        // @todo this will need to be updated to work with async, but that's
        // complicated in a regex.
        roll.evaluate({async: false});
      } catch (error) {
        roll = null;
        if (rollFormula.startsWith('/')) {
          rollFormula = `[[${rollFormula}]]`;
          console.log(`Skipping numeric roll replacement for ${rollFormula}`);
        }
        else {
          rollFormula = `[${rollFormula}]`;
          console.warn(error);
        }
      }
      // Duplicate the roll into a condensed version that combines numbers
      // where possible.
      const newRoll = roll?.formula ? rollCondenser(roll) : { formula: rollFormula };
      // Return the replacement.
      return `<span class="expression">${newRoll.formula}</span>`;
    });
  }

  // Call TextEditor.enrichHTML to process remaining object links
  clean = TextEditor.enrichHTML(clean, { async: false})

  // Return the revised text and convert markdown to HTML.
  return parseMarkdown(clean);
}

/**
 * Condense numeric and operator terms into a single numeric term.
 *
 * @param {array} terms Array of roll term objects.
 * @returns {array}
 */
function termCondenser(terms) {
  const last = terms.length - 1;
  // Deal with trailing operators.
  if (terms[last]?.operator) {
    terms.splice(last, 1);
  }
  // If there aren't enough terms, exit early.
  if (terms.length < 1) {
    return false;
  }
  // Attempt to create a roll from the terms.
  let r = null;
  try {
    r = Roll.fromTerms(terms);
  } catch (error) {
    console.warn(error);
    return false;
  }
  // Create a new term from the total.
  let t = new NumericTerm({number: r.total}).toJSON();
  t.evaluated = true;
  // Return the new NumericTerm instance.
  return NumericTerm.fromJSON(JSON.stringify(t));
}

/**
 * Duplicate a roll and return a new version where numeric terms are combined
 * into as few numeric terms as possible. For example, d20+5+3 will become
 * d20+8.
 *
 * @param {object} roll Roll object to modify.
 * @returns
 */
function rollCondenser(roll) {
  // Initialize our variables.
  let originalTerms = roll.terms;
  let newTerms = [];
  let nestedTerms = [];
  let operator = null;
  let condensedTerm = null;
  let previousTermType = null;

  // Iterate over the original terms.
  originalTerms.forEach(term => {
    // Check to see what kind of term this is.
    switch (term.constructor.name) {
      // If this is a numeric term, push it to our temporary nestedTerms array.
      case 'NumericTerm':
        nestedTerms.push(term);
        break;

      // If this is an operator term, also push it to the temporary nestedTerms
      // array (but skip in certain cases).
      case 'OperatorTerm':
        // If this is the first operator, store that for later when we build
        // our final terms array. Don't store it if it's a double operator and
        // negative (usually means something like d12 + -2).
        // @todo this isn't quite functional yet. Doesn't work well with d12 - d8 + d6 + -3.
        if (previousTermType !== 'OperatorTerm') {
          operator = term;
        }
        // If this is the first term and is multiplication or division, don't
        // include it in our array since we can't condense it.
        if (nestedTerms.length < 1) {
          if (['*', '/'].includes(term.operator)) {
            break;
          }
        }
        // Append the operator.
        nestedTerms.push(term);
        break;

      // If this is any other kind of term, add to our newTerms array.
      default:
        // If our nestedTerms array has been modified, append it.
        if (nestedTerms.length > 0) {
          // If there's an operator, we neeed to append it first.
          if ((operator) && (nestedTerms.length > 1 || nestedTerms[0].constructor.name !== 'OperatorTerm')) {
            newTerms.push(operator);
          }
          // Condense the nestedTerms array into a single numeric term and
          // append it.
          condensedTerm = nestedTerms.length > 1 ? termCondenser(nestedTerms) : nestedTerms[0];
          if (condensedTerm) newTerms.push(condensedTerm);
        }
        // Make sure that there's an operator if we're appending a dice after
        // we previously appended a non-operator.
        if (newTerms.length > 0 && !newTerms[newTerms.length - 1]?.operator) {
          operator = OperatorTerm.fromJSON(JSON.stringify({
            class: 'OperatorTerm',
            evaluated: true,
            operator: '+'
          }));
          newTerms.push(operator);
        }
        // Append our current term as well.
        newTerms.push(term);
        // Reset the nested terms and operator now that they're part of the
        // newTerms array.
        nestedTerms = [];
        operator = null;
        break;
    }

    // Update our previous term for the next iteration.
    previousTermType = term.constructor.name;
  });

  // After the loop completes, we need to also append the operator and
  // nestedTerms if there are any stragglers.
  if (nestedTerms.length > 0) {
    if (operator) {
      newTerms.push(operator);
    }
    condensedTerm = nestedTerms.length > 1 ? termCondenser(nestedTerms) : nestedTerms[0];
    if (condensedTerm) newTerms.push(condensedTerm);
  }

  // Generate the roll and return it.
  let newRoll = false;
  try {
    newRoll = Roll.fromTerms(newTerms);
  } catch (error) {
    // Return the unmodified roll if there's an error.
    console.warn(error);
    return roll;
  }

  return newRoll;
}

export async function getActor(actorData) {
  // If no drag data is available, we can't retrieve the actor.
  if (!actorData?.dragData?.uuid) return false;

  // Async load the actor/token from the UUID.
  const document = await fromUuid(actorData.dragData.uuid);

  // If it's a token, retrieve the actor prop. Otherwise, retrieve the document.
  return document?.actor ?? document;
}