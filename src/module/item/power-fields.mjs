/**
 * Which text fields a power has, and the order every renderer shows them in.
 *
 * The same power is rendered in several places — the actor sheet and the item
 * sheet preview (both `Power.vue`), the chat card and the power importer (both
 * `templates/chat/power-card.html`) — and each of those used to carry its own
 * copy of this list, in its own order, with its own rule for hiding spell
 * levels. This module is the single copy.
 *
 * - `group` splits the fields the way the chat card lays them out: `property`
 *   fields are short one-liners (target, attack, hit...), `effect` fields are
 *   prose blocks. The sheets ignore the grouping and render the list in order.
 * - `spellLevel` marks the per-level entries of a spell, shown only once the
 *   power is high enough level. 1e only has the odd levels; 2e has them all.
 */

/** @type {ReadonlyArray<{key: string, group: string, spellLevel?: number, is2eOnly?: boolean}>} */
export const POWER_FIELDS = Object.freeze([
  {key: 'trigger', group: 'property'},
  {key: 'sustainOn', group: 'property'},
  {key: 'target', group: 'property'},
  {key: 'always', group: 'property'},
  {key: 'attack', group: 'property'},
  {key: 'hit', group: 'property'},
  {key: 'hitEven', group: 'property'},
  {key: 'hitOdd', group: 'property'},
  {key: 'crit', group: 'property'},
  {key: 'miss', group: 'property'},
  {key: 'missEven', group: 'property'},
  {key: 'missOdd', group: 'property'},
  {key: 'resources', group: 'property'},
  {key: 'castBroadEffect', group: 'effect'},
  {key: 'castPower', group: 'effect'},
  {key: 'sustainedEffect', group: 'effect'},
  {key: 'finalVerse', group: 'effect'},
  {key: 'special', group: 'effect'},
  {key: 'effect', group: 'effect'},
  {key: 'spellLevel2', group: 'effect', spellLevel: 2, is2eOnly: true},
  {key: 'spellLevel3', group: 'effect', spellLevel: 3},
  {key: 'spellLevel4', group: 'effect', spellLevel: 4, is2eOnly: true},
  {key: 'spellLevel5', group: 'effect', spellLevel: 5},
  {key: 'spellLevel6', group: 'effect', spellLevel: 6, is2eOnly: true},
  {key: 'spellLevel7', group: 'effect', spellLevel: 7},
  {key: 'spellLevel8', group: 'effect', spellLevel: 8, is2eOnly: true},
  {key: 'spellLevel9', group: 'effect', spellLevel: 9},
  {key: 'spellLevel10', group: 'effect', spellLevel: 10, is2eOnly: true},
  {key: 'spellLevel11', group: 'effect', spellLevel: 11, is2eOnly: true},
  {key: 'spellChain', group: 'effect'},
  {key: 'breathWeapon', group: 'effect'},
  {key: 'recharge', group: 'property'},
]);

/**
 * The power fields available in the current edition, in display order.
 *
 * @param {object} [options]
 * @param {string|null} [options.group] Only return fields of this group,
 *   'property' or 'effect'. Defaults to all of them.
 * @param {boolean|null} [options.is2e] Edition to list fields for. Defaults to
 *   the current game's edition.
 *
 * @returns {string[]} Ordered field keys.
 */
export function powerFieldKeys({group = null, is2e = null} = {}) {
  const secondEdition = is2e ?? CONFIG.ARCHMAGE.is2e ?? false;
  return POWER_FIELDS
    .filter(field => secondEdition || !field.is2eOnly)
    .filter(field => !group || field.group === group)
    .map(field => field.key);
}

/**
 * Whether a power's field should be displayed.
 *
 * Only the per-level entries of a spell are ever hidden. They appear
 * cumulatively as the power's level rises, and the `hide` flag on a field trims
 * that down to the entry for the current level (plus the one below it, when the
 * current level has nothing to say).
 *
 * @param {object} power Power item data.
 * @param {string} key Field key, such as 'attack' or 'spellLevel3'.
 * @param {object|null} actor Actor the power belongs to. Only needed for powers
 *   whose level is overridden by the character's.
 *
 * @returns {boolean}
 */
export function isPowerFieldVisible(power, key, actor = null) {
  const field = POWER_FIELDS.find(f => f.key === key);
  const fieldLevel = field?.spellLevel;
  if (!fieldLevel) return true;

  const overridePowerLevel = actor?.flags?.archmage?.overridePowerLevel ?? false;
  const actorLevel = Number(actor?.system?.attributes?.level?.value ?? 1);
  const powerLevel = Number(power.system.powerLevel?.value ?? 1);
  const overriddenLevel = overridePowerLevel
    ? Math.max(actorLevel, powerLevel)
    : powerLevel;

  // @todo This is an OK-ish solution to handling hidden spells in 1e, but it
  // needs to be improved.
  if (power.system[key]?.hide && overriddenLevel !== fieldLevel) {
    if (fieldLevel > overriddenLevel) return false;
    if (fieldLevel < overriddenLevel - 1) return false;
    return !power.system[`spellLevel${fieldLevel + 1}`]?.value;
  }

  return overriddenLevel >= fieldLevel;
}
