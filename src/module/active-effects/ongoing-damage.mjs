/**
 * Helpers for ongoing damage active effects.
 *
 * Ongoing damage can be applied at double or triple value (e.g. from a critical
 * hit), which is stored on the `flags.archmage.ongoingDamageMultiplier` flag.
 * The multiplier only applies to the first tick, after which it reverts to 1.
 *
 * The `ongoingDamage` flag itself may hold a fractional value, e.g. when an
 * effect is applied at half damage. It is only rounded when the damage is
 * actually dealt, so that halving and multiplying cancel each other out.
 */

/**
 * Round an ongoing damage value up, away from zero so that healing (stored as
 * a negative value) rounds in the recipient's favor too.
 * @param {number} value  The raw damage.
 * @returns {number}  The rounded damage.
 */
export function roundOngoingDamage(value) {
  return Math.sign(value) * Math.ceil(Math.abs(value));
}

/**
 * Read the damage multiplier of an ongoing damage effect.
 * @param {ActiveEffect|object} effect  The effect (or its data) to inspect.
 * @returns {number}  The multiplier, 1 if none is set.
 */
export function getOngoingDamageMultiplier(effect) {
  const multiplier = Number(effect?.flags?.archmage?.ongoingDamageMultiplier);
  return Number.isFinite(multiplier) && multiplier >= 1 ? Math.floor(multiplier) : 1;
}

/**
 * Reset an ongoing damage effect back to a x1 multiplier, if needed.
 * @param {ActiveEffect} effect  The effect to reset.
 * @returns {Promise<ActiveEffect|void>}
 */
export async function resetOngoingDamageMultiplier(effect) {
  if (!effect?.update) return;
  if (getOngoingDamageMultiplier(effect) === 1) return;
  return effect.update({'flags.archmage.ongoingDamageMultiplier': 1});
}

/**
 * Annotate an effect with the derived ongoing damage properties used by the
 * ongoing effects chat card.
 * @param {ActiveEffect} effect  The effect to annotate, modified in place.
 * @returns {ActiveEffect}  The same effect.
 */
export function prepareOngoingDamage(effect) {
  const isOngoing = effect.flags.archmage?.ongoingDamage ? true : false;
  const multiplier = isOngoing ? getOngoingDamageMultiplier(effect) : 1;
  effect.isOngoing = isOngoing;
  effect.isCrit = multiplier > 1;
  effect.critMult = multiplier;
  const rawDamage = isOngoing ? Number(effect.flags.archmage?.ongoingDamage) : 0;
  effect.ongoingTooltip = game.i18n.format('ARCHMAGE.CHAT.ongoingDamageTooltip', {
    damage: roundOngoingDamage(rawDamage),
    type: effect.flags.archmage?.ongoingDamageType ?? '',
  });
  effect.ongoingDamage = roundOngoingDamage(rawDamage * multiplier);
  return effect;
}
