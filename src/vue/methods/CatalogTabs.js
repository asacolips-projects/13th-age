import { localize } from "@/methods/Helpers";
import { FACET_DIMENSIONS, GROUP_MODES } from "@/composables/useFacetFilters";

/**
 * The catalog's configurable tab set, stored under the sheetDisplay.catalog
 * flags:
 *
 *   sheetDisplay.catalog: {
 *     tabs: [{ id, label, groupBy, sortBy, filters? }, ...]   // at least one
 *     groupOrder: { <tabId>: { <groupBy>: [keys] } }
 *     rowOrder:   { <tabId>: [itemIds] }
 *   }
 *
 * Each tab groups and sorts independently, and its saved group/row orders
 * key off the tab's id. The optional filters hold the tab's own chip
 * selections (see sanitizeTabFilters).
 */

// Group-by modes a user tab can take, in the settings popover's order —
// the GROUP_MODES keys' order, so a mode is added in one place.
// 'inventory' is the Loot tab's mode and not offered.
export const CATALOG_GROUP_MODES = Object.keys(GROUP_MODES);

// Icons for the narrow layout's icon-only strip, keyed by group-by mode.
export const CATALOG_GROUP_ICONS = {
	powerType: "fa-book",
	powerUsage: "fa-bolt",
	powerSource: "fa-hat-wizard",
	group: "fa-layer-group",
	actionType: "fa-chess-knight"
};

const SORTS = ["name", "level", "custom"];

// Chip dimensions a tab's own filters may select: the catalog popover's
// facet rows' dimensions. The type facet's currency chip names the
// item-less currency strip, holding it in the listing per tab.
const CHIP_FILTER_KEYS = FACET_DIMENSIONS;

/**
 * Sanitize the tab's stored chip selections down to whitelisted dimensions
 * with string arrays.
 * @param {object} filters The stored chip filters, if any.
 * @returns {object|undefined} The clean filters, or undefined when empty.
 */
function sanitizeTabFilters(filters) {
	if (!filters || typeof filters !== "object") return undefined;
	const clean = {};
	for (const key of CHIP_FILTER_KEYS) {
		const values = Array.isArray(filters[key]) ? filters[key].filter((v) => typeof v === "string") : [];
		if (values.length) clean[key] = values;
	}
	return Object.keys(clean).length ? clean : undefined;
}

/**
 * The actor's catalog tab definitions: the stored sheetDisplay.catalog.tabs
 * flags with missing fields backfilled, or a single default "Catalog" tab
 * when nothing usable is stored yet — pack actors included, whose flags
 * can't be written, so the default derives fresh on every render until the
 * actor can store its own.
 * @param actorData
 */
export function catalogTabDefs(actorData) {
	const stored = actorData?.flags?.archmage?.sheetDisplay?.catalog?.tabs;
	if (Array.isArray(stored) && stored.length) {
		const defs = stored
			.filter((def) => def?.id)
			.map((def) => {
				const clean = {
					id: def.id,
					label: typeof def.label === "string" ? def.label : "",
					groupBy: CATALOG_GROUP_MODES.includes(def.groupBy) ? def.groupBy : "powerType",
					sortBy: SORTS.includes(def.sortBy) ? def.sortBy : "custom"
				};
				const filters = sanitizeTabFilters(def.filters);
				if (filters) clean.filters = filters;
				return clean;
			});
		if (defs.length) return defs;
	}
	// Nothing stored yet: one "Catalog" tab, grouped by power type.
	return [{ id: "catalog", label: localize("ARCHMAGE.catalog"), groupBy: "powerType", sortBy: "custom" }];
}

// Label keys per group mode for derived tab names — the shared GROUPS
// labels, except power source: the v2 sheet's "Class/Race/Item" entry is
// about what the source *can be*, which reads wrong in "Items by …"; the
// chat label "Power Source" is the plain name.
const LABEL_KEYS = { powerSource: "ARCHMAGE.CHAT.powerSource" };

/**
 * Display label for a tab: its custom name, or one derived from its
 * group-by mode — "Items by Type", "Items by Action", and so on.
 * @param def
 */
export function catalogTabLabel(def) {
	const custom = def?.label?.trim();
	if (custom) return custom;
	return localize("ARCHMAGE.itemsByGroup", {
		group: localize(LABEL_KEYS[def?.groupBy] ?? `ARCHMAGE.GROUPS.${def?.groupBy ?? "powerType"}`)
	});
}
