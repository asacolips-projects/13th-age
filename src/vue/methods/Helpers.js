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

export function wrapRolls(text, replacements = [], diceFormulaMode = 'short', rollData = null, field = null) {
  rollData = JSON.parse(JSON.stringify(rollData));
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
  ]);
  // Remove whitespace from inline rolls.
  let clean = text.toString();  // cast to string, could be e.g. number
  if (diceFormulaMode == 'short') {
    text.toString().replace(/(\[\[)([^\[]*)(\]\])/g, (match) => {
      clean = clean.replace(match, match.replaceAll(' ', ''));
    });
    // Replace special keys in inline rolls.
    for (let [needle, replacement] of replaceMap) {
      clean = clean.replaceAll(needle, replacement);
    };
    // Call TextEditor.enrichHTML to process remaining object links
    clean = TextEditor.enrichHTML(clean, { async: false})
  }
  else if (diceFormulaMode == 'long') {
    clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
      return `<span class="expression">${match}</span>`;
    });
  }
  else if (diceFormulaMode == 'numeric') {
    clean = text.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
      let rollFormula = field == 'attack' ? `${p2} + @atk.mod` : p2;
      let roll = new Roll(rollFormula, rollData);
      roll.evaluate({async: false});
      const newRoll = rollCondenser(roll);
      return `<span class="expression">${newRoll.formula}</span>`;
    });
  }
  // Return the revised text and convert markdown to HTML.
  return parseMarkdown(clean);
}

export function rollCondenser(roll) {
  let originalTerms = roll.terms;
  let newTerms = [];
  let nestedTerms = [];
  let operator = null;

  function termCondenser(terms) {
    let r = Roll.fromTerms(terms);
    let t = new NumericTerm({number: r.total}).toJSON();
    t.evaluated = true;
    return NumericTerm.fromJSON(JSON.stringify(t));
  }

  originalTerms.forEach(term => {
    switch (term.constructor.name) {
      case 'NumericTerm':
        nestedTerms.push(term);
        break;

      case 'OperatorTerm':
        if (nestedTerms.length < 1) {
          operator = term;
          if (['*', '/'].includes(term.operator)) {
            break;
          }
        }
        nestedTerms.push(term);
        break;

      default:
        if (nestedTerms.length > 0) {
          if (operator) newTerms.push(operator);
          newTerms.push(termCondenser(nestedTerms));
        }
        newTerms.push(term);
        nestedTerms = [];
        operator = null;
        break;
    }
  });
  if (nestedTerms.length > 0) {
    if (operator) newTerms.push(operator);
    newTerms.push(termCondenser(nestedTerms));
  }

  let newRoll = Roll.fromTerms(newTerms);
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