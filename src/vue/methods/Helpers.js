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

export function wrapRolls(text, replacements = []) {
  // Build a map of string replacements.
  let replaceMap = replacements.concat([
    ['[[', '<span class="expression">'],
    [']]', '</span>'],
    ['@ed', 'ED'],
    ['@lvl', 'LVL'],
    ['@std', 'LVL+ED'], //STD
    ['@str.mod', 'STR'],
    ['@str.dmg', 'STR'],
    ['@con.mod', 'CON'],
    ['@con.dmg', 'CON'],
    ['@dex.mod', 'DEX'],
    ['@dex.dmg', 'DEX'],
    ['@int.mod', 'INT'],
    ['@int.dmg', 'INT'],
    ['@wis.mod', 'WIS'],
    ['@wis.dmg', 'WIS'],
    ['@cha.mod', 'CHA'],
    ['@cha.dmg', 'CHA'],
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
  let clean = text;
  text.replace(/(\[\[)([^\[]*)(\]\])/g, (match) => {
    clean = clean.replace(match, match.replaceAll(' ', ''));
  });
  // Replace special keys in inline rolls.
  for (let [needle, replacement] of replaceMap) {
    clean = clean.replaceAll(needle, replacement)
  };
  // Return the revised text and convert markdown to HTML.
  return parseMarkdown(clean);
}

export function getActor(actorData) {
  if (actorData.token.actorLink || !actorData?.token?.sceneId) {
    return game.actors.get(actorData._id);
  }
  else if (actorData.token?.id && actorData.token?.sceneId) {
    const scene = game.scenes.get(actorData.token.sceneId);
    const token = scene ? scene.tokens.get(actorData.token.id) : false;
    return token?.actor ?? false;
  }
  else if (actorData?.pack) {
    const pack = game.packs.get(actorData.pack);
    const actor = pack.getDocument(actorData._id);
    return actor;
  }
  return false;
}