import { getActor, localize } from "@/methods/Helpers";
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
 * flags with missing fields backfilled, or defaults when nothing is stored
 * yet — a single "Catalog" tab for a PC the v2 sheet has never touched,
 * otherwise "Items by Type" from the legacy powers flags the v2 sheet still
 * owns and "Items by Action" from the retired action plan's. Unmigrated
 * actors get the derivation fresh on every render, since their flags can't
 * be written.
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
	const powers = actorData?.flags?.archmage?.sheetDisplay?.powers ?? {};
	const plan = actorData?.flags?.archmage?.sheetDisplay?.actionPlan ?? {};
	// A PC the v2 sheet has never touched has no legacy arrangement to carry
	// over: start it on a single "Catalog" tab rather than the derived pair.
	if (!Object.keys(powers).length && !Object.keys(plan).length) {
		return [{ id: "catalog", label: localize("ARCHMAGE.catalog"), groupBy: "powerType", sortBy: "custom" }];
	}
	return [
		{
			id: "byType",
			label: "",
			groupBy: CATALOG_GROUP_MODES.includes(powers.groupBy?.value) ? powers.groupBy.value : "powerType",
			sortBy: SORTS.includes(powers.sortBy?.value) ? powers.sortBy.value : "custom"
		},
		{
			id: "byAction",
			label: "",
			groupBy: "actionType",
			sortBy: SORTS.includes(plan.sortBy?.value) ? plan.sortBy.value : "custom"
		}
	];
}

/**
 * Display label for a tab: its custom name, or one derived from its
 * group-by mode — "Items by Type", "Items by Action", and so on.
 * @param def
 */
export function catalogTabLabel(def) {
	const custom = def?.label?.trim();
	if (custom) return custom;
	return localize("ARCHMAGE.itemsByGroup", {
		group: localize(`ARCHMAGE.GROUPS.${def?.groupBy ?? "powerType"}`)
	});
}

/**
 * One-time migration to the configurable tab set, run on sheet render for
 * editable actors when no tab set is stored yet. Seeds the new flag paths
 * from the legacy ones so saved arrangements survive the swap:
 *
 * - The tab set itself is whatever catalogTabDefs derives — the class
 *   presets for a character with a class, the legacy derivation otherwise.
 *   It is seeded once and never regenerated afterward: class changes don't
 *   touch the stored tabs.
 * - The powers flags' per-mode group orders carry over to the "Items by
 *   Type" tab; the action plan's group and row orders to the action one.
 * - Custom sort no longer reads the items' shared sort values (the v2
 *   sheet keeps those), so each new tab's flat row order is seeded from
 *   them: what the old catalog showed in custom mode is what the new tabs
 *   start from.
 *
 * The legacy flags are left in place for the v2 sheet.
 * @param actorData
 */
export async function migrateCatalogTabs(actorData) {
	const sheetDisplay = actorData?.flags?.archmage?.sheetDisplay ?? {};
	if (Array.isArray(sheetDisplay.catalog?.tabs) && sheetDisplay.catalog.tabs.length) return;

	const updates = [
		["sheetDisplay.catalog.tabs", catalogTabDefs(actorData)]
	];
	const legacyGroupOrders = sheetDisplay.powers?.groupOrder ?? {};
	if (Object.keys(legacyGroupOrders).length) {
		updates.push(["sheetDisplay.catalog.groupOrder.byType", legacyGroupOrders]);
	}
	const plan = sheetDisplay.actionPlan ?? {};
	if (Array.isArray(plan.groupOrder) && plan.groupOrder.length) {
		updates.push(["sheetDisplay.catalog.groupOrder.byAction.actionType", plan.groupOrder]);
	}
	if (Array.isArray(plan.rowOrder) && plan.rowOrder.length) {
		updates.push(["sheetDisplay.catalog.rowOrder.byAction", plan.rowOrder]);
	}

	const bySort = (a, b) => (a.sort || 0) - (b.sort || 0);
	const ids = (actorData?.items ?? []).slice().sort(bySort)
		.map((item) => item._id);
	if (ids.length) {
		updates.push(["sheetDisplay.catalog.rowOrder.byType", ids]);
		updates.push(["sheetDisplay.catalog.rowOrder.loot", ids]);
	}

	const actor = await getActor(actorData);
	if (!actor) return;
	for (const [path, value] of updates) {
		await actor.setFlag("archmage", path, value);
	}
}
