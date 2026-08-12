export function getSafeValue(property, defaultValue) {
  if (property) return property.value;
  return defaultValue;
}

export function localize(key) {
  return game.i18n.localize(key);
}

export function localizeEquipmentBonus(bonusProp) {
  return game.archmage.ArchmageUtility.localizeEquipmentBonus(bonusProp);
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

// Power usage colouring lives with the item code, so the actor sheets, the chat
// cards, the compendium browser and the power importer all colour a power the
// same way. Re-exported here because Vue components import their helpers from
// this module.
export {
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
