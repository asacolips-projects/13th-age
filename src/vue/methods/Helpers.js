export function getSafeValue(property, defaultValue) {
  if (property) return property.value;
  return defaultValue;
}

export function localize(key, data = null) {
  return data ? game.i18n.format(key, data) : game.i18n.localize(key);
}

/**
 * The localized label for a chakra slot value, e.g. 'Head' for 'head'.
 *
 * @param {string} chakra Chakra slot key, e.g. an equipment item's
 *   `system.chackra`.
 *
 * @returns {string}
 */
export function chakraLabel(chakra) {
  return localize(concat('ARCHMAGE.CHAKRA.', chakra, 'Label'));
}

/**
 * Strip HTML from a string and collapse whitespace, for plain-text display of
 * enriched values.
 *
 * Uses DOMParser rather than a temp element, so the content is parsed without
 * executing it.
 *
 * @param {string} html HTML string, e.g. a stored enriched editor value.
 *
 * @returns {string} Plain text.
 */
export function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Strip HTML tags from a string with a regex, leaving entity references and
 * whitespace alone. The cheap search-index counterpart of stripHtml: the
 * listings' filters only need tags gone so raw HTML doesn't match tag names.
 *
 * @param {string} html HTML string, e.g. a stored enriched editor value.
 *
 * @returns {string}
 */
export function stripTags(html) {
  return (html ?? '').replace(/<[^>]+>/g, '');
}

/**
 * Normalize free-text filter input to its bare alphanumerics, so punctuation
 * and spacing don't need to match exactly.
 *
 * @param {string} string Raw filter text.
 *
 * @returns {string} The stripped key, e.g. 'Finger-Wiggle' -> 'fingerwiggle'.
 */
export function cleanFilterKey(string) {
  return string ? string.toLowerCase().replace(/[^a-zA-Z\d]/g, '') : '';
}

/**
 * Name comparator for item rows, alphabetical.
 *
 * @param {object} a Item data.
 * @param {object} b Item data.
 *
 * @returns {number}
 */
export function byName(a, b) {
  return a.name.localeCompare(b.name);
}

/**
 * Power level comparator, ascending. Powers without a level sort first.
 *
 * @param {object} a Item data.
 * @param {object} b Item data.
 *
 * @returns {number}
 */
export function byLevel(a, b) {
  return Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);
}

/**
 * Apply a saved group order to a list of groups, with any group the saved
 * order doesn't know about appended in its natural spot.
 *
 * @param {Array} groups The groups in natural order, each with a `key`.
 * @param {Array} order The saved group keys, in display order.
 *
 * @returns {Array} The groups in display order.
 */
export function orderedGroups(groups, order) {
  if (!order?.length) return groups;
  const byKey = new Map(groups.map(g => [g.key, g]));
  return order.filter(key => byKey.has(key)).map(key => byKey.get(key))
    .concat(groups.filter(g => !order.includes(g.key)));
}

/**
 * Apply a saved row order to a list of rows; rows the saved order doesn't
 * know about (new items) keep their input order, or the tiebreak comparator's.
 *
 * @param {Array} rows The rows in natural order, each with an `_id`.
 * @param {Array} order The saved row ids, in display order.
 * @param {Function} [tiebreak] Comparator for rows the order doesn't know,
 *   e.g. byName.
 *
 * @returns {Array} The rows in display order.
 */
export function orderedRows(rows, order, tiebreak = null) {
  const positions = new Map(order.map((id, index) => [id, index]));
  if (!positions.size) return rows;
  return [...rows].sort((a, b) => {
    const ai = positions.get(a._id);
    const bi = positions.get(b._id);
    if (ai === undefined && bi === undefined) return tiebreak ? tiebreak(a, b) : 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}

export function localizeEquipmentBonus(bonusProp) {
  return game.archmage.ArchmageUtility.localizeEquipmentBonus(bonusProp);
}

/**
 * Whether second-edition rules are enabled. NOT reactive: game settings
 * aren't, so consumers re-render with the actor context rather than
 * subscribing to the setting. Shared by the V3 sheet's edition gates
 * (kin label, death-save glyphs, 2e resources and incrementals).
 */
export function isSecondEdition() {
  return game.settings.get('archmage', 'secondEdition') === true;
}

export function tooltip(...keys) {
  return game.archmage.ArchmageUtility.tooltip(...keys);
}

export function cssClass(string) {
  return encodeURIComponent(
    string.trim().toLowerCase()
  ).replace(/%[0-9A-F]{2}/gi, '-');
}

export function numberFormat(value, dec = 0, sign = false) {
  const parsedValue = parseFloat(value).toFixed(dec);
  if (isNaN(parsedValue)) return value
  if (sign ) return ( parsedValue >= 0 ) ? `+${parsedValue}` : parsedValue;
  return parsedValue;
}

export function concat(...args) {
  return args.reduce((acc, cur) => {
    return acc + cur;
  }, '');
}

/**
 * Whether a field value is blank: null, undefined, or whitespace-only text.
 * Used for the empty-field attention pulse.
 *
 * @param {*} value Field value.
 *
 * @returns {boolean}
 */
export function isBlank(value) {
  return (value ?? '').toString().trim() === '';
}

/**
 * Whether a numeric field value is blank or zero (Number(''), Number(null)
 * and Number('0') are all 0). Used for the empty-field attention pulse.
 *
 * @param {*} value Field value.
 *
 * @returns {boolean}
 */
export function isZeroish(value) {
  return !value || Number(value) === 0;
}

/**
 * Whether a power has one or more feats worth showing pips for.
 *
 * @param {object} power Power item data.
 *
 * @returns {boolean}
 */
export function hasFeats(power) {
  if (!power?.system?.feats) return false;
  return Object.values(power.system.feats)
    .some(feat => feat.description.value || feat.isActive.value);
}

/**
 * Drop the feats a power has no text for.
 *
 * @param {object} feats Keyed feats, from a power's `system.feats`.
 *
 * @returns {object} The same shape, minus the empty entries.
 */
export function filterFeats(feats) {
  if (!feats) return {};
  return Object.fromEntries(
    Object.entries(feats).filter(([, feat]) => feat.description.value)
  );
}

/**
 * The bonuses a piece of equipment grants, keyed by what they apply to.
 *
 * Attack bonuses are unpacked from their sub-object, so that melee, ranged,
 * arcane and divine sit alongside the rest. The keys are what the labels are
 * looked up from, which is why 2e's disengage bonus is renamed: there it also
 * applies to initiative, and says so.
 *
 * @param {object} equipment Equipment item data.
 *
 * @returns {object} Keyed bonus values, e.g. {ac: 1, disengageInit: 2}.
 */
export function equipmentBonuses(equipment) {
  const bonuses = {};
  for (let [prop, value] of Object.entries(equipment?.system?.attributes ?? {})) {
    if (value.bonus) {
      if (prop == 'disengage' && game.settings.get("archmage", "secondEdition")) prop = 'disengageInit';
      bonuses[prop] = value.bonus;
    }
    else if (prop == 'attack') {
      for (const [atkProp, atkValue] of Object.entries(value)) {
        if (atkValue.bonus) bonuses[atkProp] = atkValue.bonus;
      }
    }
  }
  return bonuses;
}

/**
 * Retrieve the abbreviated action type, such as 'STD' or 'QCK'.
 *
 * @param {string} actionType Action type, such as 'standard'.
 *
 * @returns {string}
 */
export function getActionShort(actionType) {
  return CONFIG.ARCHMAGE.actionTypesShort[actionType]
    ?? CONFIG.ARCHMAGE.actionTypesShort['standard'];
}

// The character tiers, keyed by the values featTiers and system.tier use. 'Z'
// is the data's 'iconic' tier, localized as Zenith. Shared by the loadout's
// slot bookkeeping and the equipment row's attunement pips. firstSlot is the
// level the tier's slots begin at; cap is how many the tier grants across its
// levels.
export const TIERS = [
  { key: 'adventurer', letter: 'A', firstSlot: 1, cap: 4 },
  { key: 'champion', letter: 'C', firstSlot: 5, cap: 3 },
  { key: 'epic', letter: 'E', firstSlot: 8, cap: 3 },
  { key: 'iconic', letter: 'Z', firstSlot: 10, cap: 1 },
];

export const TIER_ORDER = Object.fromEntries(TIERS.map((tier, i) => [tier.key, i]));

/**
 * The character's tier index, from the same tier starts the feats use.
 *
 * @param {number} level The character's level.
 *
 * @returns {number} Index into TIERS.
 */
export const characterTierIndex = (level) =>
  TIERS.reduce((index, tier, i) => level >= tier.firstSlot ? i : index, 0);

/**
 * Attunement cost against the level limit: an item at or below your tier
 * counts as one; the rules let you attune one tier above and price that at
 * two. (Anything higher can't be attuned at all; it still counts as two.)
 *
 * @param {object} item The magic item.
 * @param {number} charTier The character's tier index.
 *
 * @returns {number} Slots the item consumes when attuned.
 */
export const attunementCost = (item, charTier) =>
  (TIER_ORDER[item.system?.tier] ?? 0) > charTier ? 2 : 1;

// Power usage colouring lives with the item code, so the actor sheets, the chat
// cards, the compendium browser and the power importer all colour a power the
// same way. Re-exported here because Vue components import their helpers from
// this module.
export {
  hasSecondaryUsage,
  powerAvailabilityClass,
  powerUsageClass,
} from '@src/module/item/power-usage.mjs';

// The inline-roll formatting used across every power renderer lives with the
// item sheet helpers, so the sheets, the chat cards and the compendium browser
// all format formulas the same way. Re-exported here because Vue components
// import their helpers from this module.
export { wrapRolls } from '@src/module/item/_item-sheet-helpers.mjs';

export async function getActor(actorData) {
  // If no drag data is available, we can't retrieve the actor.
  if (!actorData?.dragData?.uuid) return false;

  // Async load the actor/token from the UUID.
  const document = await fromUuid(actorData.dragData.uuid);

  // If it's a token, retrieve the actor prop. Otherwise, retrieve the document.
  return document?.actor ?? document;
}

/**
 * Persist one sheetDisplay preference through the live actor document;
 * the sheet's actor data is a clone whose flag updates wouldn't round-trip.
 * Writing only when the stored value differs avoids a re-render loop from
 * the update.
 *
 * @param {object} actorData Actor data, as passed down by the sheet.
 * @param {string} flagPath Full flag path, e.g. `sheetDisplay.actionPlan.sortBy.value`.
 * @param {*} value The preference value.
 */
export async function saveSheetDisplayPref(actorData, flagPath, value) {
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  if (actorData?.pack) return;
  const actor = await getActor(actorData);
  const current = foundry.utils.getProperty(actorData?.flags?.archmage ?? {}, flagPath);
  if (actor && current !== value) {
    await actor.setFlag('archmage', flagPath, value);
  }
}

/**
 * The actions an item row offers for its item. Each resolves the actor
 * document from the sheet's actor data, so rows own their interactions without
 * reaching back into the sheet's delegated listeners.
 */

/**
 * Open one of the actor's items on the actor for editing.
 *
 * @param {object} actorData Actor data, as passed down by the sheet.
 * @param {string} itemId Item id, e.g. `power._id`.
 */
export async function editItem(actorData, itemId) {
  const actor = await getActor(actorData);
  actor?.items.get(itemId)?.sheet.render(true);
}

/**
 * Delete one of the actor's items, confirming first unless bypassed.
 *
 * @param {object} actorData Actor data, as passed down by the sheet.
 * @param {string} itemId Item id, e.g. `power._id`.
 * @param {boolean} bypass Skip the confirmation, e.g. for shift-clicks.
 */
export async function deleteItem(actorData, itemId, bypass = false) {
  const actor = await getActor(actorData);
  const item = actor?.items.get(itemId);
  if (!item) return;

  if (bypass) {
    await item.delete();
    return;
  }

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: {title: localize('ARCHMAGE.CHAT.DeleteConfirmTitle')},
    content: `<p>${localize('ARCHMAGE.CHAT.DeleteConfirm')}</p>`,
    confirm: {label: localize('ARCHMAGE.CHAT.Delete')},
    cancel: {label: localize('ARCHMAGE.CHAT.Cancel')}
  });
  if (confirmed) await item.delete();
}

/**
 * Increase or decrease one of an actor item's remaining uses.
 *
 * @param {object} actorData Actor data, as passed down by the sheet.
 * @param {string} itemId Item id, e.g. `power._id`.
 * @param {boolean} increase Whether to add or remove a use.
 * @param {boolean} secondary Target the item's secondary pool of uses instead
 *   of the primary one.
 */
export async function changeQuantity(actorData, itemId, increase = true, secondary = false) {
  const actor = await getActor(actorData);
  const item = actor?.items.get(itemId);
  if (!item) return;

  const quantityKey = secondary ? 'quantitySecondary' : 'quantity';
  if (item.system?.[quantityKey]?.value == null) return;
  let quantity = Number(item.system[quantityKey].value);
  quantity = increase ? quantity + 1 : quantity - 1;

  // TODO: Refactor the fallback to not be absurdly high after maxQuantity has become regularly used.
  let maxQuantity = await item.resolveMaxQuantity(secondary ? 'maxQuantitySecondary' : 'maxQuantity') ?? 99;

  await item.update({[`system.${quantityKey}.value`]: increase ? Math.min(maxQuantity, quantity) : Math.max(0, quantity)});
}

/**
 * Toggle one of an actor item's pips: a power feat's taken state, or an
 * equipment item's active state.
 *
 * @param {object} actorData Actor data, as passed down by the sheet.
 * @param {string} itemId Item id, e.g. `power._id`.
 * @param {string} tier For power feats, the feat's tier (e.g. '1st'). Ignored
 *   for equipment items, which carry a single active pip.
 */
export async function togglePip(actorData, itemId, tier = null) {
  const actor = await getActor(actorData);
  const item = actor?.items.get(itemId);
  if (!item) return;

  let updateData = {};
  if (item.type === 'power') {
    if (!tier) return;
    let isActive = item.system.feats[tier].isActive.value;
    updateData[`system.feats.${tier}.isActive.value`] = !isActive;
  }
  else if (item.type === 'equipment') {
    updateData['system.isActive'] = !item.system.isActive;
  }
  else return;

  await item.update(updateData);
}

/**
 * Retrieve module art for an actor
 *
 * @param {object} actor Index version of an actor document from a compendium.
 * @returns {string} Path to art asset
 */
export function getActorModuleArt(actor) {
  // UUID doesn't exactly match the format used in the map currently.
  const actorMapId = actor.uuid.replace('.Actor', '');
  // Retrieve the art from the map, or fallback to the actor image.
  const art = game.archmage.system.moduleArt.map.get(actorMapId);
  return art?.actor ?? actor.img;
}

/**
 * Retrieve index for a list of compendiums.
 *
 * @param {Array} packNames Array of compendiums to index.
 * @param {Array} fields Array of field paths to include in the index.
 * @returns Combined entries from the queried compendiums.
 */
export async function getPackIndex(packNames = [], fields = []) {
  if (!packNames) return;
  if (!fields || fields.length < 1) return;

  const promises = packNames.map(async packName => {
    const pack = game.packs.get(packName);
    if (!pack) return [];
    const index = await pack.getIndex({ fields: fields });
    return index.contents.map(x => ({ ...x, compendiumTitle: pack.title }));
  });
  const results = await Promise.all(promises);

  let packs = [];
  for (const result of results) {
    packs = packs.concat(result);
  }
  return packs;
}

/**
 * Open a document's sheet based on its uuid.
 *
 * @param {string} uuid Document UUID to open.
 * @param {string} type Document type to open. Defaults to 'Actor'.
 */
export function openDocument(uuid, type = 'Actor') {
  getDocumentClass(type).fromDropData({
    type: type,
    uuid: uuid
  }).then(document => {
    if (document?.sheet) {
      document.sheet.render(true);
    }
    else {
      console.warn(`No document found for ${uuid}`);
    }
  });
}

/**
 * Starts a drag event and provides document drop data.
 *
 * @param {Event} event Drag event.
 * @param {Object} entry Pack index entry object.
 */
export function startDrag(event, entry, type = 'Actor') {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: type,
    uuid: entry.uuid
  }));
}
