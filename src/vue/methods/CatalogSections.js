import { cleanFilterKey, orderedGroups } from "@/methods/Helpers";
import { ACTION_ORDER, GROUP_MODES } from "@/composables/useFacetFilters";

/**
 * The catalog tab's section collation: turning the tab's filtered items into
 * the ordered group sections its listing renders. Pure functions — the
 * collation the facet filters' chips must mirror — kept out of the tab
 * component so they can be reasoned about (and unit-tested) on their own.
 */

/**
 * Canonical group keys for a group-by mode, in natural order: the fixed
 * action order for actionType, the CONFIG key order for the power field
 * modes — minus those configs' own 'other' entries, which the catch-all
 * covers.
 * @param mode
 */
const canonicalKeys = (mode) => {
	if (mode === "actionType") return ACTION_ORDER;
	const configKey = GROUP_MODES[mode].config;
	return Object.keys(CONFIG.ARCHMAGE[configKey] ?? {}).filter((key) => key !== "other");
};

/**
 * Section factory for the mode's groups; `raw` keeps a custom group's
 * display name for pre-filling new items.
 * @param key
 * @param labelKey
 * @param raw
 */
const makeGroup = (key, labelKey, raw = "") => ({ key, labelKey, raw, kind: "power", members: [] });

/**
 * Label key for a canonical group; powerType labels are pluralized keys,
 * e.g. ARCHMAGE.talents.
 * @param mode
 * @param key
 */
const groupLabel = (mode, key) => mode === "powerType" ? `ARCHMAGE.${key}s` : `ARCHMAGE.${key}`;

/**
 * Every catalog section in display order: the mode's canonical groups, the
 * 'Other' catch-all for items that fell through, then the loot and currency
 * groups. Collating is by field value only — an item joins the canonical
 * group its value names, or the catch-all — and every group renders, empty
 * or not, keeping its add button reachable — unless the tab groups by a
 * facet with that facet's chips selected, in which case only the selected
 * chips' groups render (the grouping facets' own Other chips name the
 * catch-all). With any chips active anywhere, the loot and currency
 * sections render only when their type-facet chips do, and the grouped
 * sections only while that facet still names power or equipment — so a
 * loot-and-currency-only selection leaves just those two sections. Without
 * any selection every section renders. Group order is per tab and mode,
 * shared by power groups, the catch-all, loot and currency alike.
 *
 * @param {object} parts
 * @param {string} parts.mode The tab's group-by mode.
 * @param {Array} parts.items The tab's powers and equipment, already
 *   filtered by search and chips and sorted by the tab's sort mode.
 * @param {Array} parts.loot The tab's loot (and legacy tools), same
 *   filtering and sorting.
 * @param {boolean} parts.showCurrency Whether the currency section shows.
 * @param {object} parts.activeFilters The tab's active chip selections,
 *   keyed by facet dimension.
 * @param {Array} parts.savedOrder The tab's saved group order for the
 *   mode, if any.
 *
 * @returns {Array} The sections in display order.
 */
export function groupCatalogSections({ mode, items, loot, showCurrency, activeFilters, savedOrder }) {
	const groups = new Map(canonicalKeys(mode).map((key) => [key, makeGroup(key, groupLabel(mode, key))]));
	const other = makeGroup("other", "ARCHMAGE.other");

	if (mode === "group") {
		// Custom groups come from the item's free-text group field, in
		// first-appearance order; items without a group value — and custom
		// groups literally named 'Other' — join the catch-all.
		for (const item of items) {
			const raw = item.system?.group?.value;
			const key = raw ? cleanFilterKey(raw) : "other";
			if (key === "other") {
				other.members.push(item);
			}
			else {
				if (!groups.has(key)) groups.set(key, makeGroup(key, raw, raw));
				groups.get(key).members.push(item);
			}
		}
	}
	else {
		const field = GROUP_MODES[mode].field;
		for (const item of items) {
			// In the action grouping, a magic item's power is a free action,
			// so equipment with a power usage joins the free group.
			const value = mode === "actionType" && item.type === "equipment"
				? (item.system?.powerUsage?.value ? "free" : "other")
				: item.system?.[field]?.value;
			(groups.get(value) ?? other).members.push(item);
		}
	}

	// When the tab groups by a facet, that facet's chips also narrow the
	// sections themselves: with chips selected, only the selected chips'
	// groups render. Custom groups' sections key off the cleaned free-text
	// value, so chips match by raw and by cleaned value alike.
	const selected = activeFilters[mode];
	const facetSections = selected.length
		? [...groups.values(), other].filter((section) => selected.includes(section.raw)
			|| selected.some((chip) => cleanFilterKey(chip) === section.key))
		: [...groups.values(), other];

	// With type-facet chips selected, the loot and currency sections render
	// only when their chips do: they're the two sections no item group
	// covers, so their chips name them outright. The grouped sections hold
	// powers and equipment, so they render only while the type facet names
	// either — a selection of just loot and currency chips leaves those two
	// sections alone on the tab. A selection in any other facet narrows the
	// members alone, leaving every section standing.
	const typeSelected = activeFilters.type;
	const typeNames = (chip) => !typeSelected.length || typeSelected.includes(chip);
	const sections = [
		...(typeNames("power") || typeNames("equipment") ? facetSections : []),
		...(typeNames("loot")
			? [{ key: "inventory-loot", labelKey: "ARCHMAGE.INVENTORY.loot", kind: "loot", members: loot }]
			: []),
		...(showCurrency && typeNames("currency")
			? [{ key: "inventory-currency", labelKey: "ARCHMAGE.INVENTORY.currency", kind: "currency", members: [] }]
			: [])
	];
	return orderedGroups(sections, savedOrder);
}

/**
 * Item data for a section's "+" button, pre-filled so the new item lands in
 * the group it was added from: built-in group modes set the mode's system
 * field (e.g. system.powerUsage.value), custom groups set the free-text
 * group, the catch-all leaves it empty so the power lands there, and loot
 * sections just use their type.
 *
 * @param {object} section The section the button belongs to.
 * @param {string} mode The tab's group-by mode.
 *
 * @returns {object} The embedded document data for the new item.
 */
export function groupCreateData(section, mode) {
	if (section.kind !== "power") return { type: section.kind, system: {} };
	if (section.key === "other") return { type: "power", system: {} };
	if (mode === "group") {
		return { type: "power", system: { group: { value: section.raw } } };
	}
	return { type: "power", system: { [mode]: { value: section.key } } };
}
