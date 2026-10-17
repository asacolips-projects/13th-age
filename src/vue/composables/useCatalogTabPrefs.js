import { computed } from "vue";
import { saveSheetDisplayPref } from "@/methods/Helpers";

/**
 * A catalog tab's group-by and sort-by preferences: computeds that read the
 * tab's stored definition and patch it through `saveTabDef`, so each tab
 * groups and sorts independently of the others and of the v2 sheet's powers
 * flags. The sort falls back to 'custom' like v2 does, since drag-to-reorder
 * writes item sort values that only that mode honors. The same patcher
 * persists the tab's chip filter selections.
 *
 * @param {object} options
 * @param {Function} options.actor Accessor for the sheet's actor data the
 *   flags are read from and written through.
 * @param {Function} options.tab Accessor for the tab's stored definition
 *   (from catalogTabDefs), whose `groupBy`/`sortBy` the computeds reflect.
 * @param {Function} options.tabId Accessor for the tab's id, keying its
 *   entry in the stored tabs array.
 * @param {object} options.canWrite Computed: whether the actor's display
 *   flags can be written (editable, not a compendium entry).
 *
 * @returns {object} The `groupBy`/`sortBy` writable computeds and the
 *   `saveTabDef` patcher.
 */
export function useCatalogTabPrefs({ actor, tab, tabId, canWrite }) {
	/**
	 * Patch this tab's definition in the stored tabs flags. Nothing to patch
	 * until the tab set has been written once — migration seeds it on sheet
	 * render, and pack actors keep the derived defaults — and pack actors
	 * can't write flags at all.
	 * @param patch
	 */
	const saveTabDef = async (patch) => {
		if (!canWrite.value) return;
		const defs = actor()?.flags?.archmage?.sheetDisplay?.catalog?.tabs ?? [];
		if (!defs.length) return;
		const next = defs.map((def) => def.id === tabId() ? { ...def, ...patch } : def);
		await saveSheetDisplayPref(actor(), "sheetDisplay.catalog.tabs", next);
	};

	const groupBy = computed({
		get: () => tab()?.groupBy ?? "powerType",
		set: (value) => saveTabDef({ groupBy: value })
	});
	const sortBy = computed({
		get: () => tab()?.sortBy ?? "custom",
		set: (value) => saveTabDef({ sortBy: value })
	});

	return { groupBy, sortBy, saveTabDef };
}
