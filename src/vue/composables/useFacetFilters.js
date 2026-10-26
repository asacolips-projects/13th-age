import { computed } from "vue";
import { cleanFilterKey, localize } from "@/methods/Helpers";

// Grouping modes: the item field each reads. The power field modes also name
// the CONFIG key giving their canonical group order. Shared with the item index
// tab's grouping, whose sections collate by the same fields the chips
// facet on — and whose group-by select iterates the keys in this order (the
// settings popover's), so adding a mode here offers and facets it in one
// edit.
export const GROUP_MODES = {
	powerType: { field: "powerType", config: "powerTypes" },
	powerUsage: { field: "powerUsage", config: "powerUsages" },
	powerSource: { field: "powerSource", config: "powerSources" },
	group: { field: "group" },
	actionType: { field: "actionType" }
};

// Display order for the action grouping; the catch-all group trails it.
export const ACTION_ORDER = ["standard", "move", "quick", "free", "interrupt"];

// The dimensions the popover's chips cover, and each one's canonical display
// order — type fixed with the section-naming chips trailing, the action
// order with the catch-all's own chip trailing, the rest their CONFIG's key
// order ('other' included here; the grouping's catch-all needn't cover it),
// custom groups item-derived and alphabetical, the catch-all's chip
// trailing when anything carries it, and the source name the same —
// item-derived and alphabetical, with its catch-all chip trailing. Shared
// with the stored-tab filter sanitizing, which whitelists the same keys.
export const FACET_DIMENSIONS = ["type", "powerType", "actionType", "powerUsage", "powerSource", "powerSourceName", "group"];
const FACET_TYPE_ORDER = ["power", "equipment", "loot", "currency"];

// Chips that name item-less sections rather than item values: the currency
// strip is the one section no item group covers, so its chip lives in the
// type facet and is never marked empty.
const SECTION_CHIPS = ["currency"];
const SECTION_CHIP_LABELS = {
	currency: "ARCHMAGE.INVENTORY.currency"
};

// Facet row labels that differ from the shared group labels: the type and
// power type facets read more plainly, and the power source facet reads
// "Power Source" — the v2 sheet's GROUPS entry is "Class/Race/Item", which
// isn't a facet row's title.
const FACET_LABEL_KEYS = {
	type: "ARCHMAGE.itemType",
	powerType: "ARCHMAGE.powerType",
	powerSource: "ARCHMAGE.CHAT.powerSource",
	powerSourceName: "ARCHMAGE.CHAT.powerSourceName"
};

/**
 * The facet value an item carries for a dimension: type normalizes legacy
 * tools into loot; every grouping dimension mirrors the grouping's
 * collation exactly, so a chip's selection shows precisely the groups it
 * names — anything the grouping drops into the catch-all reads 'other' (a
 * magic item's power is a free action, and a power with no usable field
 * value groups with the catch-all). Loot and tools carry no grouping value
 * at all: they render in their own section, which the type facet's loot
 * chip names instead.
 * @param item
 * @param dim
 */
const facetValue = (item, dim) => {
	if (dim === "type") return item.type === "tool" ? "loot" : item.type;
	if (item.type === "loot" || item.type === "tool") return undefined;
	if (dim === "actionType") {
		if (item.type === "equipment") return item.system?.powerUsage?.value ? "free" : "other";
		const value = item.system?.actionType?.value;
		return ACTION_ORDER.includes(value) ? value : "other";
	}
	if (dim === "group") {
		// Custom groups are the item's free-text group value, with no group
		// at all — and groups literally named 'Other' — reading as the
		// catch-all.
		const raw = item.system?.group?.value;
		return raw && cleanFilterKey(raw) !== "other" ? raw : "other";
	}
	if (dim === "powerSourceName") {
		// The source name is the power sheet's free-text field; a power
		// left untagged — and an item that doesn't carry the field at
		// all — reads as the catch-all, like the custom groups.
		return item.system?.powerSourceName?.value || "other";
	}
	const value = item.system?.[GROUP_MODES[dim]?.field]?.value;
	return canonicalFacetOrder(dim).includes(value) ? value : "other";
};

/**
 * Canonical order for a dimension's chips.
 * @param dim
 */
const canonicalFacetOrder = (dim) => {
	if (dim === "type") return FACET_TYPE_ORDER;
	if (dim === "actionType") return [...ACTION_ORDER, "other"];
	if (dim === "group") return [];
	const configKey = GROUP_MODES[dim]?.config;
	return configKey ? Object.keys(CONFIG.ARCHMAGE[configKey] ?? {}) : [];
};

/**
 * Label for a facet chip, matching the group headers' label keys.
 * @param dim
 * @param value
 */
const facetLabel = (dim, value) => {
	// Section-naming chips read their own labels — currency is no item type.
	if (SECTION_CHIP_LABELS[value]) return localize(SECTION_CHIP_LABELS[value]);
	if (dim === "type") return localize(`TYPES.Item.${value}`);
	// Custom groups are the item's free-text group value, not a translation
	// key — the catch-all's chip excepted, which reads like its group. The
	// source name is free text too, with its own catch-all chip.
	if (dim === "group" || dim === "powerSourceName") return value === "other" ? localize("ARCHMAGE.other") : value;
	if (dim === "powerType") return localize(`ARCHMAGE.${value}s`);
	return localize(`ARCHMAGE.${value}`);
};

/**
 * The item index popover's filter chips: the facet rows in display order —
 * chips for the values the character's items carry plus each dimension's
 * canonical values, so an empty group keeps its chip — plus the active-chip
 * count, the matcher the listing filters through, and the toggle/clear
 * controls. Chip selections persist per tab through the given save callback
 * (like group and sort, a no-op where flags can't be written), OR within a
 * row and AND across rows (and with the search). Stored chips are pruned to
 * values the facets still offer: item-derived ones (custom groups, source
 * names) drop off when their last item goes, while a canonical chip like
 * 'daily' persists — the popover marks it empty — rather than expiring and
 * hiding that a selection is still active. The type facet's currency chip
 * names an item-less section, so nothing
 * ever carries it — the item index reads the section's visibility off
 * `activeFilters`.
 *
 * @param {object} options
 * @param {Function} options.items Accessor for the items to derive the facet
 *   values from (the sheet's actor clone's items).
 * @param {Function} options.filters Accessor for the tab's stored chip
 *   selections, keyed by dimension.
 * @param {Function} options.save Persists a replacement chip-selection
 *   object for the tab; the tab gates writability itself.
 *
 * @returns {object} The `facetRows`, `activeFilters`, `activeFilterCount`,
 *   `filtersActive`, `matchesFilters`, `toggleFilter`, `toggleAllFilters`,
 *   `hideEmptyFilters` and `clearFilters`.
 */
export function useFacetFilters({ items, filters, save }) {
	// Chips offer the values this character's items actually carry plus every
	// canonical value the dimension's grouping has: an empty group keeps its
	// chip, marking the group as there-for-the-filling. The section-naming
	// chips are constant, not item-derived, and custom groups have no
	// canonical list — theirs stay item-derived.
	const facetValues = computed(() => {
		const values = Object.fromEntries(FACET_DIMENSIONS.map((dim) => [dim, new Set()]));
		// What the items actually carry, kept apart from the canonical seeds:
		// a chip whose value only came from the canonical list is one no item
		// has, which the popover marks empty.
		const itemValues = Object.fromEntries(FACET_DIMENSIONS.map((dim) => [dim, new Set()]));
		for (const item of items() ?? []) {
			if (!["power", "equipment", "loot", "tool"].includes(item.type)) continue;
			for (const dim of FACET_DIMENSIONS) {
				const value = facetValue(item, dim);
				if (value) {
					values[dim].add(value);
					itemValues[dim].add(value);
				}
			}
		}
		for (const dim of FACET_DIMENSIONS) {
			for (const value of canonicalFacetOrder(dim)) values[dim].add(value);
		}
		return { values, itemValues };
	});

	// The stored chips for a dimension, pruned to values the facets still
	// offer — canonical chips survive, item-derived ones drop with their items.
	const activeFilters = computed(() => {
		const stored = filters() ?? {};
		return Object.fromEntries(FACET_DIMENSIONS.map((dim) => {
			const available = facetValues.value.values[dim];
			return [dim, (stored[dim] ?? []).filter((value) => available.has(value))];
		}));
	});

	const activeFilterCount = computed(() =>
		FACET_DIMENSIONS.reduce((count, dim) => count + activeFilters.value[dim].length, 0));

	const filtersActive = computed(() => activeFilterCount.value > 0);

	/**
	 * Whether an item passes the chip filters: a dimension with no active chips
	 * passes as-is, otherwise the item's value must be among them. An item with
	 * no value for a dimension — loot and tools carry none for the grouping
	 * facets, rendering in their own section instead — passes unfiltered, so
	 * chips in a grouping facet narrow the grouped sections and their members
	 * without ever touching the loot section. The section-naming chips never
	 * match an item — the item index reads those sections' visibility off
	 * `activeFilters` instead.
	 * @param item
	 */
	const matchesFilters = (item) => FACET_DIMENSIONS.every((dim) => {
		const active = activeFilters.value[dim];
		const value = facetValue(item, dim);
		if (value === undefined) return true;
		return !active.length || active.includes(value);
	});

	/**
	 * Toggle one chip within a dimension's row.
	 * @param dim
	 * @param value
	 */
	const toggleFilter = (dim, value) => {
		const stored = filters() ?? {};
		const current = stored[dim] ?? [];
		const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
		save({ ...stored, [dim]: next });
	};

	/**
	 * Toggle one facet row's chips all-on or all-off: a row with every chip
	 * active clears back to none, anything less selects all of them.
	 * @param dim
	 */
	const toggleAllFilters = (dim) => {
		const stored = filters() ?? {};
		const all = [...facetValues.value.values[dim]];
		const current = stored[dim] ?? [];
		const next = all.length && all.every((value) => current.includes(value)) ? [] : all;
		save({ ...stored, [dim]: next });
	};

	/**
	 * Select all but a facet row's empty chips: the item-carried values only,
	 * so the grouped facet's "hide empty" link leaves just the groups with
	 * members showing.
	 * @param dim
	 */
	const hideEmptyFilters = (dim) => {
		const stored = filters() ?? {};
		save({ ...stored, [dim]: [...facetValues.value.itemValues[dim]] });
	};

	const clearFilters = () => save({});

	// The popover's chip rows in display order, one per dimension at least one
	// item carries a value for (the section-naming chips are constant).
	const facetRows = computed(() => FACET_DIMENSIONS.map((dim) => {
		const available = facetValues.value.values[dim];
		const itemValues = facetValues.value.itemValues[dim];
		const canonical = canonicalFacetOrder(dim);
		const extras = [...available].filter((value) => !canonical.includes(value));
		const ordered = [
			...canonical.filter((value) => available.has(value)),
			...extras.filter((value) => value !== "other").sort(),
			...(extras.includes("other") ? ["other"] : [])
		];
		const chips = ordered.map((value) => ({
			value,
			label: facetLabel(dim, value),
			active: activeFilters.value[dim].includes(value),
			// Section-naming chips name whole sections and aren't
			// item-derived; any other chip is empty when no item
			// carries the value.
			empty: !SECTION_CHIPS.includes(value) && !itemValues.has(value)
		}));
		return {
			key: dim,
			labelKey: FACET_LABEL_KEYS[dim] ?? `ARCHMAGE.GROUPS.${dim}`,
			allActive: ordered.length > 0 && ordered.every((value) => activeFilters.value[dim].includes(value)),
			// Whether the row has any empty chip at all: the grouped
			// facet's "hide empty" link only shows when it would do
			// something.
			hasEmpty: chips.some((chip) => chip.empty),
			chips
		};
	}).filter((row) => row.chips.length));

	return {
		facetRows,
		activeFilters,
		activeFilterCount,
		filtersActive,
		matchesFilters,
		toggleFilter,
		toggleAllFilters,
		hideEmptyFilters,
		clearFilters
	};
}
