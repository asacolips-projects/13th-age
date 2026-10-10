import { computed } from "vue";
import { localize } from "@/methods/Helpers";

// Grouping modes: the item field each reads. The power field modes also name
// the CONFIG key giving their canonical group order. Shared with the catalog
// tab's grouping, whose sections collate by the same fields the chips
// facet on.
export const GROUP_MODES = {
	actionType: { field: "actionType" },
	powerType: { field: "powerType", config: "powerTypes" },
	powerUsage: { field: "powerUsage", config: "powerUsages" },
	powerSource: { field: "powerSource", config: "powerSources" },
	group: { field: "group" }
};

// Display order for the action grouping; the catch-all group trails it.
export const ACTION_ORDER = ["standard", "move", "quick", "free", "interrupt"];

// The dimensions the popover's chips cover, and each one's canonical display
// order — type fixed, action order plus the legacy maneuver override, the
// rest their CONFIG's key order ('other' included here; the grouping's
// catch-all needn't cover it), custom groups alphabetical by their free-text
// value. 'sections' is the hide-chip row: its chips don't match item values,
// they filter whole sections out of the listing.
const FACET_DIMENSIONS = ["type", "powerType", "powerUsage", "powerSource", "actionType", "group", "sections"];
const FACET_TYPE_ORDER = ["power", "equipment", "loot"];

// The sections facet's chips, in display order: the grouping's catch-all and
// the currency strip. Both exist per tab — activating a chip hides its
// section on that tab.
const SECTION_CHIPS = ["other", "currency"];
const SECTION_CHIP_LABELS = {
	other: "ARCHMAGE.other",
	currency: "ARCHMAGE.INVENTORY.currency"
};

// Facet row labels that differ from the shared group labels: the type and
// power type facets read more plainly, and the sections row is a hide list.
const FACET_LABEL_KEYS = {
	type: "ARCHMAGE.itemType",
	powerType: "ARCHMAGE.powerType",
	sections: "ARCHMAGE.hide"
};

/**
 * The facet value an item carries for a dimension: type normalizes legacy
 * tools into loot; actionType mirrors the action grouping's rules, where a
 * magic item's power is a free action and legacy 'maneuver' reads
 * 'flexible'. Powers and equipment only for the power fields.
 * @param item
 * @param dim
 */
const facetValue = (item, dim) => {
	if (dim === "sections") return undefined;
	if (dim === "type") return item.type === "tool" ? "loot" : item.type;
	if (dim === "actionType") {
		if (item.type === "equipment") return item.system?.powerUsage?.value ? "free" : undefined;
		const value = item.system?.actionType?.value;
		return value === "maneuver" ? "flexible" : value;
	}
	return item.system?.[GROUP_MODES[dim]?.field ?? dim]?.value;
};

/**
 * Canonical order for a dimension's chips.
 * @param dim
 */
const canonicalFacetOrder = (dim) => {
	if (dim === "type") return FACET_TYPE_ORDER;
	if (dim === "sections") return SECTION_CHIPS;
	if (dim === "actionType") return [...ACTION_ORDER, "flexible"];
	const configKey = GROUP_MODES[dim]?.config;
	return configKey ? Object.keys(CONFIG.ARCHMAGE[configKey] ?? {}) : [];
};

/**
 * Label for a facet chip, matching the group headers' label keys.
 * @param dim
 * @param value
 */
const facetLabel = (dim, value) => {
	if (dim === "type") return localize(`TYPES.Item.${value}`);
	if (dim === "sections") return localize(SECTION_CHIP_LABELS[value] ?? value);
	// Custom groups are the item's free-text group value, not a translation key.
	if (dim === "group") return value;
	if (dim === "powerType") return localize(`ARCHMAGE.${value}s`);
	return localize(`ARCHMAGE.${value}`);
};

/**
 * The catalog popover's filter chips: the facet rows in display order —
 * chips only for the values the character's items actually carry, so the
 * rows stay short (the sections row excepted, whose two hide-chips are
 * constant) — plus the active-chip count, the matcher the listing filters
 * through, and the toggle/clear controls. Chip selections persist per tab
 * through the given save callback (like group and sort, a no-op where flags
 * can't be written), OR within a row and AND across rows (and with the
 * search). Stored chips are pruned to values the items still carry:
 * deleting the last 'daily' power drops the stale chip instead of leaving
 * a filter that silently excludes everything.
 *
 * The 'sections' dimension is its own thing: its chips filter the catch-all
 * group and the currency strip out of the listing rather than narrowing
 * items, so `matchesFilters` ignores it and the hide set is read off
 * `hiddenSections`.
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
 *   `filtersActive`, `hiddenSections`, `matchesFilters`, `toggleFilter`,
 *   `toggleAllFilters` and `clearFilters`.
 */
export function useFacetFilters({ items, filters, save }) {
	// Chips offer the values this character's items actually carry plus every
	// canonical value the dimension's grouping has: an empty group keeps its
	// chip, so selecting it can hold the group open for adding to it. The
	// sections row's hide-chips are constant, not item-derived, and custom
	// groups have no canonical list — theirs stay item-derived.
	const facetValues = computed(() => {
		const values = Object.fromEntries(FACET_DIMENSIONS.map((dim) => [dim, new Set(dim === "sections" ? SECTION_CHIPS : [])]));
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

	// The stored chips for a dimension, pruned to values the items still carry.
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
	 * passes as-is, otherwise the item's value must be among them. The sections
	 * row's hide-chips don't narrow items — they hide whole sections, which the
	 * catalog applies through `hiddenSections`.
	 * @param item
	 */
	const matchesFilters = (item) => FACET_DIMENSIONS.every((dim) => {
		if (dim === "sections") return true;
		const active = activeFilters.value[dim];
		return !active.length || active.includes(facetValue(item, dim));
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

	const clearFilters = () => save({});

	// The popover's chip rows in display order, one per dimension at least one
	// item carries a value for (the sections row's chips are constant).
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
		return {
			key: dim,
			labelKey: FACET_LABEL_KEYS[dim] ?? `ARCHMAGE.GROUPS.${dim}`,
			allActive: ordered.length > 0 && ordered.every((value) => activeFilters.value[dim].includes(value)),
			chips: ordered.map((value) => ({
				value,
				label: facetLabel(dim, value),
				active: activeFilters.value[dim].includes(value),
				// The sections row's chips hide whole sections and aren't
				// item-derived; any other chip is empty when no item carries
				// the value.
				empty: dim !== "sections" && !itemValues.has(value)
			}))
		};
	}).filter((row) => row.chips.length));

	// The sections the tab's hide-chips filter out — the 'sections' facet's
	// active chips, which the catalog drops when it assembles its sections.
	const hiddenSections = computed(() => new Set(activeFilters.value.sections));

	return {
		facetRows,
		activeFilters,
		activeFilterCount,
		filtersActive,
		hiddenSections,
		matchesFilters,
		toggleFilter,
		toggleAllFilters,
		clearFilters
	};
}
