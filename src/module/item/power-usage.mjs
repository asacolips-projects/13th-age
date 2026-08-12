/**
 * How a power's usage maps onto the colour its row, card or title gets.
 *
 * Every place that displays a power used to work this out for itself — the actor
 * sheets, the chat card, the compendium browser and the power importer — and
 * they disagreed about cyclic powers, the desperate usages and powers with a
 * secondary pool of uses. This module is the single copy.
 */

/**
 * The escalation die value to colour a cyclic power by.
 *
 * @param {object|null} actor Actor the power belongs to.
 * @param {number|null} escalationDie Explicit value, for callers that have it to
 *   hand without an actor (the compendium browser).
 *
 * @returns {number}
 */
function escalationValue(actor, escalationDie) {
  return Number(escalationDie ?? actor?.system?.attributes?.escalation?.value ?? 0);
}

/**
 * The usage a power is currently being used at.
 *
 * Powers with a secondary pool of uses fall back to it once the primary pool
 * runs out, such as the paladin's Smite Evil ("once per battle, plus an
 * additional [[@cha.mod]] times per day").
 *
 * @param {object} power Power item data.
 *
 * @returns {string|undefined}
 */
export function activePowerUsage(power) {
  return hasSecondaryUsage(power) && !(power.system.quantity?.value > 0)
    ? power.system.powerUsageSecondary.value
    : power.system.powerUsage?.value;
}

/**
 * Whether a power tracks a second pool of uses it can fall back on.
 *
 * @param {object} power Power item data.
 *
 * @returns {boolean}
 */
export function hasSecondaryUsage(power) {
  return power.system.quantitySecondary?.value != null
    && !!power.system.powerUsageSecondary?.value;
}

/**
 * Resolve a power usage to the class that colours it.
 *
 * Cyclic powers borrow the colour of whichever usage they currently behave as,
 * which depends on the escalation die.
 *
 * @param {string} usage Power usage, such as 'once-per-battle'.
 * @param {object|null} actor Actor the power belongs to.
 * @param {object} [options]
 * @param {number|null} [options.escalationDie]
 *
 * @returns {string}
 */
export function powerUsageColorClass(usage, actor = null, {escalationDie = null} = {}) {
  let use = usage ? usage : 'other';
  if (['daily', 'daily-desperate'].includes(use)) return 'daily';
  if (['recharge', 'recharge-desperate'].includes(use)) return 'recharge';
  if (use == 'cyclic') {
    const escalation = escalationValue(actor, escalationDie);
    return (escalation > 0 && escalation % 2 == 0) ? 'at-will' : 'once-per-battle';
  }
  return use;
}

/**
 * The single colour class for a power, for displays that put the usage colour in
 * a class name of their own, such as the chat card's `ability-usage--*`.
 *
 * @param {object} power Power item data.
 * @param {object|null} actor Actor the power belongs to.
 * @param {object} [options]
 * @param {number|null} [options.escalationDie]
 *
 * @returns {string}
 */
export function powerUsageColor(power, actor = null, options = {}) {
  return powerUsageColorClass(activePowerUsage(power), actor, options);
}

/**
 * Compute the CSS classes for a power row, based on its usage.
 *
 * Some powers alternate between two usages: cyclic powers follow the escalation
 * die, and powers with a secondary pool of uses fall back to it once the primary
 * pool runs out. Those rows take the colour of the usage they're currently in,
 * and mark the one they aren't with 'alt-usage', so the two swap over as the
 * power changes mode.
 *
 * @param {object} power Power item data.
 * @param {object|null} actor Actor the power belongs to.
 * @param {object} [options]
 * @param {number|null} [options.escalationDie]
 *
 * @returns {string}
 */
export function powerUsageClass(power, actor = null, options = {}) {
  const primaryUsage = power.system.powerUsage?.value;
  const secondaryUsage = power.system.powerUsageSecondary?.value;
  const hasSecondary = hasSecondaryUsage(power);
  const activeUsage = activePowerUsage(power);
  const onSecondary = hasSecondary && activeUsage === secondaryUsage;

  const active = powerUsageColorClass(activeUsage, actor, options);
  const classes = [active];
  if (activeUsage == 'cyclic') classes.push('cyclic');

  // Work out the usage the power isn't currently in, if it has one.
  let inactive = null;
  if (hasSecondary) {
    inactive = powerUsageColorClass(onSecondary ? primaryUsage : secondaryUsage, actor, options);
  }
  else if (activeUsage == 'cyclic') {
    // Cyclic powers alternate between behaving as at-will and once-per-battle.
    inactive = active == 'at-will' ? 'once-per-battle' : 'at-will';
  }
  if (inactive && inactive != active) classes.push('alt-usage', `alt-usage--${inactive}`);

  return classes.join(' ');
}

/**
 * Compute the CSS class marking a power as spent.
 *
 * A power with a secondary pool of uses is only unavailable once both pools are
 * empty.
 *
 * @param {object} power Power item data.
 *
 * @returns {string}
 */
export function powerAvailabilityClass(power) {
  const primary = power.system?.quantity?.value;
  const secondary = power.system?.quantitySecondary?.value;
  if (primary == null && secondary == null) return '';
  return ((primary ?? 0) + (secondary ?? 0)) === 0 ? 'unavailable' : '';
}
