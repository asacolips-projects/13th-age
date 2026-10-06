import { getActor, localize } from "@/methods/Helpers";

/**
 * The catalog's configurable tab set, stored under the sheetDisplay.catalog
 * flags:
 *
 *   sheetDisplay.catalog: {
 *     tabs: [{ id, label, groupBy, sortBy }, ...]   // at least one
 *     groupOrder: { <tabId>: { <groupBy>: [keys] } }
 *     rowOrder:   { <tabId>: [itemIds] }
 *   }
 *
 * Each tab groups and sorts independently, and its saved group/row orders
 * key off the tab's id. The fixed Loot tab isn't part of the stored set —
 * the coin purses need a permanent home — and renders the catalog tab
 * component in its 'inventory' mode.
 */

// Group-by modes a user tab can take, in the settings popover's order.
// 'inventory' is the Loot tab's mode and not offered.
export const CATALOG_GROUP_MODES = ["powerType", "powerUsage", "powerSource", "group", "actionType"];

// Icons for the narrow layout's icon-only strip, keyed by group-by mode.
export const CATALOG_GROUP_ICONS = {
	powerType: "fa-book",
	powerUsage: "fa-bolt",
	powerSource: "fa-hat-wizard",
	group: "fa-layer-group",
	actionType: "fa-chess-knight"
};

// The fixed Loot tab: passes groupBy 'inventory' to the catalog component.
export const LOOT_TAB = { id: "loot", groupBy: "inventory" };

const SORTS = ["name", "level", "custom"];

/**
 * The actor's catalog tab definitions: the stored sheetDisplay.catalog.tabs
 * flags with missing fields backfilled, or defaults derived from the legacy
 * flags when nothing is stored yet — "Items by Type" from the powers flags
 * the v2 sheet still owns, "Items by Action" from the retired action plan's.
 * Pack actors and not-yet-migrated actors get the derivation fresh on every
 * render, since their flags can't be written.
 * @param actorData
 */
export function catalogTabDefs(actorData) {
	const stored = actorData?.flags?.archmage?.sheetDisplay?.catalog?.tabs;
	if (Array.isArray(stored) && stored.length) {
		const defs = stored
			.filter((def) => def?.id)
			.map((def) => ({
				id: def.id,
				label: typeof def.label === "string" ? def.label : "",
				groupBy: CATALOG_GROUP_MODES.includes(def.groupBy) ? def.groupBy : "powerType",
				sortBy: SORTS.includes(def.sortBy) ? def.sortBy : "custom"
			}));
		if (defs.length) return defs;
	}
	const powers = actorData?.flags?.archmage?.sheetDisplay?.powers ?? {};
	const plan = actorData?.flags?.archmage?.sheetDisplay?.actionPlan ?? {};
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
	return game.i18n.format("ARCHMAGE.itemsByGroup", {
		group: localize(`ARCHMAGE.GROUPS.${def?.groupBy ?? "powerType"}`)
	});
}

/**
 * One-time migration to the configurable tab set, run on sheet render for
 * editable actors when no tab set is stored yet. Seeds the new flag paths
 * from the legacy ones so saved arrangements survive the swap:
 *
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

	const updates = [["sheetDisplay.catalog.tabs", catalogTabDefs(actorData)]];
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
