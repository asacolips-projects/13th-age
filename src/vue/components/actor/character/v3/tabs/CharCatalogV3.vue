<template>
	<section class="tab-catalog">
		<!-- Sorts and filters. The group-by lives in the tab settings popover
         beside the tab strip, since every tab carries its own. -->
		<SortFilterBarV3 :id="concat('catalog-', tabId)" v-model:sort="sortBy" v-model:search="searchValue" :sort-options="sortOptions">
			<div v-if="canImport" class="import-catalog">
				<button
					type="button"
					class="catalog-import"
					:class="{ 'catalog-import--pulse': isEmptyCharacter }"
					:disabled="missingKinClass"
					:data-tooltip="importTooltip"
					@click="importPowers"
				>
					<i class="fas fa-atlas" /> {{ localize('ARCHMAGE.import') }}
				</button>
			</div>
		</SortFilterBarV3>

		<!-- Sections are the reorderable groups; the currency group renders its
         coin purses in place of an item list. -->
		<section
			v-for="section in catalogSections"
			:key="section.key"
			class="catalog-group"
			:class="groupClasses(section.key)"
			@dragover="onGroupDragOver($event, section.key)"
			@dragleave="onGroupDragLeave($event, section.key)"
			@drop="onGroupDrop($event, section.key)"
		>
			<h4
				class="catalog-group-title unit-title"
				:draggable="canReorderNow"
				@dragstart="onGroupDragStart($event, section.key)"
				@dragend="onGroupDragEnd"
			>
				<i v-if="canReorderNow" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')" />
				<span class="group-title-label">{{ localize(section.labelKey) }}</span>
				<a v-if="editable && section.kind !== 'currency'" class="group-add" :title="addTitle(section)" @click.stop="createGroupItem(section)"><i class="fas fa-plus" /></a>
			</h4>
			<!-- Coin purses, matching the v2 inventory tab; the named inputs
           persist via the sheet's submitOnChange, like the resource units
           in the stats header. -->
			<div v-if="section.kind === 'currency'" class="catalog-currency flexrow">
				<div v-for="type in CURRENCY" :key="type" :class="concat('currency-unit currency-unit-', type)">
					<label :for="concat('catalog-coin-', type)">{{ localize(`ARCHMAGE.COINS.${type}`) }}</label>
					<input
						:id="concat('catalog-coin-', type)"
						v-model="coins[type].value"
						type="number"
						:name="concat('system.coins.', type, '.value')"
						placeholder="0"
					>
				</div>
			</div>
			<ul v-else class="catalog-list flexcol">
				<ExpandableRowV3
					v-for="item in section.members"
					:key="item._id"
					:item="item"
					:actor="actor"
					:context="context"
					:class="rowClasses(item._id)"
					@dragstart="onRowDragStart($event, section.key, item._id)"
					@dragover="onRowDragOver($event, section.key, item._id)"
					@dragleave="onRowDragLeave($event, item._id)"
					@drop="onRowDrop($event, section.key, item._id)"
					@dragend="onRowDragEnd"
				/>
			</ul>
		</section>
	</section>
</template>

<script setup>
import { computed, inject } from "vue";
import { byLevel as byPowerLevel, byName, cleanFilterKey, concat, equipmentBonuses, getActor, isSecondEdition, localize, orderedGroups, orderedRows, saveSheetDisplayPref, TIER_ORDER } from "@/methods/Helpers";
import { useGroupReorder } from "@/composables/useGroupReorder";
import { useRowReorder } from "@/composables/useRowReorder";
import { useSearchFilter } from "@/composables/useSearchFilter";
import SortFilterBarV3 from "@/components/actor/character/v3/parts/SortFilterBarV3.vue";
import ExpandableRowV3 from "@/components/actor/character/v3/parts/ExpandableRowV3.vue";

const props = defineProps(["actor", "editable", "context", "tab"]);

// Creation writes go through the real actor document; props.actor is a clone.
const actorDocument = inject("actorDocument");

/**
 * The tab definition drives the whole component: its group-by picks the
 * grouping, its id keys the flag paths so every tab's preferences are
 * independent. The definition lives in the sheetDisplay.catalog.tabs flags,
 * edited from the tab settings popover beside the tab strip. The fixed Loot
 * tab passes groupBy 'inventory' and renders only the inventory sections —
 * loot and currency have no associated actions, so they keep one tab of
 * their own.
 */
const tabId = computed(() => props.tab?.id ?? "loot");
const isInventory = computed(() => (props.tab?.groupBy ?? "inventory") === "inventory");

// Powers are grouped by the selected mode; 'actionType' is the retired
// action plan's fixed action groups, 'group' reads the free-text group
// field. The other modes map onto the config's power fields.
const GROUP_MODES = {
	powerType: "powerTypes",
	powerUsage: "powerUsages",
	powerSource: "powerSources"
};

// Display order for the action groups; powers with an unknown action type
// fall into the trailing 'other' group.
const ACTION_ORDER = ["standard", "move", "quick", "free", "interrupt", "other"];

const sortOptions = [
	{ value: "name" },
	{ value: "level" },
	{ value: "custom" }
];

// Sorting is the tab definition's, edited by the bar like before; writes
// patch the stored tabs array so each tab's sort stays independent. The
// Loot tab isn't in that array (it's fixed), so its sort gets a flag of
// its own.
const sortBy = computed({
	get: () => isInventory.value
		? (props.actor?.flags?.archmage?.sheetDisplay?.catalog?.lootSort?.value ?? "custom")
		: (props.tab?.sortBy ?? "custom"),
	set: (value) => {
		if (isInventory.value) {
			saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.lootSort.value", value);
			return;
		}
		saveTabDef({ sortBy: value });
	}
});

/**
 * Patch this tab's definition in the stored tabs flags. Nothing to patch
 * until the tab set has been written once — migration seeds it on sheet
 * render, and pack actors keep the derived defaults.
 * @param patch
 */
const saveTabDef = async (patch) => {
	if (!canReorder.value) return;
	const defs = props.actor?.flags?.archmage?.sheetDisplay?.catalog?.tabs ?? [];
	if (!defs.length) return;
	const next = defs.map((def) => def.id === tabId.value ? { ...def, ...patch } : def);
	await saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.tabs", next);
	// A sort change is a customization: the class presets stop managing the
	// tab set from here on.
	if (typeof props.actor?.flags?.archmage?.sheetDisplay?.catalog?.presetClasses === "string") {
		await saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.presetClasses", null);
	}
};

// Searchable text for an item: what the v2 inventory tab matches (name,
// chakra, equipment's bonus keys and values) plus the fields only the
// expanded row shows — every type's description, a power's custom group and
// its feats' text.
const { searchValue, matchesSearch } = useSearchFilter((item) => {
	let text = `${item.name ?? ""}${item.system?.chackra ?? ""}`;
	if (item.type === "equipment") {
		const bonuses = equipmentBonuses(item);
		for (const [key, value] of Object.entries(bonuses)) {
			text = `${text}${key}${value}`;
		}
	}
	text += item.system?.description?.value ?? "";
	if (item.type === "power") {
		text += item.system?.group?.value ?? "";
		for (const feat of Object.values(item.system?.feats ?? {})) {
			text += feat.description?.value ?? "";
		}
	}
	return text;
});

// Reordering (groups and rows alike) is only offered when the sheet is
// editable and the actor isn't a compendium entry (where flags can't be
// written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

// Reordering pauses while a text filter hides rows: a drop on the filtered
// view would rebuild the saved order from a partial list.
const canReorderNow = computed(() => canReorder.value && !searchValue.value);

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists per tab and grouping mode, so each tab's arrangement
// is its own.
const {
	savedGroupOrder,
	groupClasses, onGroupDragStart, onGroupDragOver, onGroupDragLeave, onGroupDrop, onGroupDragEnd
} = useGroupReorder({
	actor: () => props.actor,
	canReorder,
	canStart: canReorderNow,
	flagPath: () => `sheetDisplay.catalog.groupOrder.${tabId.value}.${props.tab?.groupBy ?? "inventory"}`,
	getSections: () => catalogSections.value,
	classPrefix: "catalog-group"
});

// Row reordering within a group. The rows are the same draggable item rows
// the sheet wires up for item drags, so their dragstart is left alone —
// arming the item payload lets a drag out of the tab (to the hotbar, canvas
// or another sheet) behave as usual — and only the drop is intercepted here.
// The order persists to this tab's own flag: tabs reorder independently, and
// the items' shared sort values the v2 sheet reads are never touched. A
// tab's id is fixed for the component's lifetime, so the path reads once.
const {
	savedRowOrder,
	rowClasses, onRowDragStart, onRowDragOver, onRowDragLeave, onRowDrop, onRowDragEnd
} = useRowReorder({
	actor: () => props.actor,
	canReorder,
	canStart: canReorderNow,
	flagPath: `sheetDisplay.catalog.rowOrder.${tabId.value}`,
	getRows: (sectionKey) => catalogSections.value.find((section) => section.key === sectionKey)?.members ?? []
});

// The import button opens the power importer for the live actor. Like the
// v2 sheet, non-GM users who turned it off in the character settings don't
// see it, and the Loot tab — no powers there — doesn't either.
const canImport = computed(() => !isInventory.value
	&& !(props.actor?.flags?.archmage?.hideImportPowers === true && !game.user.isGM));

// The static gathers the import data and opens the one-per-actor importer
// window; it ignores pack actors and falsy actors itself.
const importPowers = () => game.archmage.ArchmagePowerImporterApplication.show(actorDocument ?? props.actor);

// The importer builds its tabs from the character's kin and class, so with
// neither set it would just silently do nothing; the button disables itself
// with an explanatory tooltip instead.
const missingKinClass = computed(() => {
	const details = props.actor?.system?.details ?? {};
	return !details.race?.value && !details.class?.value;
});

const kinLabel = computed(() =>
	isSecondEdition() ? localize("ARCHMAGE.kin") : localize("ARCHMAGE.race"));

const importTooltip = computed(() => missingKinClass.value
	? game.i18n.format("ARCHMAGE.importNeedsKinClass", { kin: kinLabel.value })
	: null);

// The button pulses while the character has no items, advertising where a
// new character's powers come from.
const isEmptyCharacter = computed(() => (props.actor?.items ?? []).length === 0);

// Coin purses edited in place, like the v2 inventory tab's currency strip;
// the character settings flag hides the whole row. The named inputs persist
// through the sheet's submitOnChange, like the stats header's resource units.
const CURRENCY = ["platinum", "gold", "silver", "copper"];
const showCurrency = computed(() => props.actor?.flags?.archmage?.hideCurrency !== true);
const coins = computed(() => props.actor?.system?.coins ?? {});

// The character settings flag shared with the v2 powers tab; when set, empty
// power groups collapse instead of staying visible for their "+" button.
const hideEmptyPowerGroups = computed(() => props.actor?.flags?.archmage?.hideEmptyPowerGroups === true);

const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

const byLevel = (a, b) => {
	// Powers sort by level, equipment by tier, loot has no level so it falls
	// back to name.
	if (a.type === "equipment") return byTier(a, b);
	if (["loot", "tool"].includes(a.type)) return byName(a, b);
	return byPowerLevel(a, b);
};

const sortFns = { name: byName, level: byLevel };

/**
 * The tab's items of the given types in display order: 'custom' applies the
 * tab's saved row order (name order for rows it doesn't know), the other
 * modes ignore it. A tab definition may also carry a filter — a map from
 * power system field to the values that stay (the class presets use it to
 * pin tabs to a single power source) — applied before grouping; items
 * without the field drop out of a filtered tab.
 * @param types
 */
const catalogItems = (types) => {
	const filter = props.tab?.filter;
	const items = (props.actor?.items ?? [])
		.filter((i) => types.includes(i.type))
		.filter((i) => !filter || Object.entries(filter).every(([key, values]) => values.includes(i.system?.[key]?.value)))
		.filter(matchesSearch);
	return sortBy.value === "custom"
		? orderedRows(items, savedRowOrder.value, byName)
		: [...items].sort(sortFns[sortBy.value] ?? byName);
};

const powers = computed(() => catalogItems(["power"]));
// Magic items only join the action grouping, where those with a power usage
// take a free-action slot — a usage of none (the sheet's unset option) means
// there's no action to take.
const equipment = computed(() => catalogItems(["equipment"]));
const actionEquipment = computed(() => equipment.value.filter((i) => i.system?.powerUsage?.value));
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const loot = computed(() => catalogItems(["loot", "tool"]));

/**
 * Read an item's value for a built-in grouping mode, with fallbacks matching
 * the powers tab.
 * @param item
 * @param mode
 */
const groupValue = (item, mode) => {
	let value = item.system?.[mode]?.value || "other";
	// Override legacy 'maneuver' with 'flexible'.
	return value === "maneuver" ? "flexible" : value;
};

/**
 * Power groups for the tab's groupBy mode, in natural order: canonical
 * config order for built-in modes, first-appearance order for custom groups,
 * the fixed action order for 'actionType' — powers by their action, equipment
 * with a power usage folding in as free actions, matching the retired action
 * plan tab. Empty groups are trimmed at display time when the
 * hideEmptyPowerGroups flag is set. Each group is {key, labelKey, raw, kind,
 * members}.
 */
const powerGroups = computed(() => {
	const mode = props.tab?.groupBy;

	if (mode === "actionType") {
		const byAction = new Map(ACTION_ORDER.map((action) =>
			[action, { key: action, labelKey: `ARCHMAGE.${action}`, kind: "power", members: [] }]));
		for (const power of powers.value) {
			const action = power.system?.actionType?.value;
			byAction.get(ACTION_ORDER.includes(action) ? action : "other").members.push(power);
		}
		byAction.get("free").members.push(...actionEquipment.value);
		return [...byAction.values()];
	}

	const items = powers.value;
	const configKey = GROUP_MODES[mode];

	if (configKey) {
		const groups = [];
		for (const key of Object.keys(CONFIG.ARCHMAGE[configKey])) {
			const members = items.filter((i) => groupValue(i, mode) === key);
			// powerType labels are pluralized keys, e.g. ARCHMAGE.talents.
			const labelKey = configKey === "powerTypes" ? `ARCHMAGE.${key}s` : `ARCHMAGE.${key}`;
			groups.push({ key, labelKey, kind: "power", members });
		}
		return groups;
	}

	// Custom groups come from the item's free-text group field; ungrouped
	// powers collect under the default group, which is always shown so its
	// "+" can create the first power in an empty catalog. `raw` keeps the
	// group's display name for pre-filling new items.
	const groups = [];
	const byKey = new Map();
	for (const item of items) {
		const raw = item.system?.group?.value;
		const key = raw ? cleanFilterKey(raw) : "power";
		if (!byKey.has(key)) {
			const group = { key, labelKey: raw || "ARCHMAGE.power", raw: raw || "", kind: "power", members: [] };
			byKey.set(key, group);
			groups.push(group);
		}
		byKey.get(key).members.push(item);
	}
	if (!byKey.has("power")) {
		groups.push({ key: "power", labelKey: "ARCHMAGE.power", raw: "", kind: "power", members: [] });
	}
	return groups;
});

// Keys for the inventory sections, the Loot tab's whole body: loot only —
// magic items take their actions in the action grouping and otherwise live
// on the loadout. The 'inventory-' prefix can't collide with a custom power
// group, whose key is a stripped copy of its free-text name.
const INVENTORY_SECTIONS = [
	{ key: "inventory-loot", labelKey: "ARCHMAGE.INVENTORY.loot", kind: "loot", items: loot }
];

// The currency group holds the coin purse inputs rather than items; it is
// gated by the hideCurrency flag and defaults to the top of the tab.
const CURRENCY_SECTION = {
	key: "inventory-currency",
	labelKey: "ARCHMAGE.INVENTORY.currency",
	kind: "currency",
	members: []
};

/**
 * Every section in display order. The item tabs show just the power groups
 * for their groupBy mode; the Loot tab shows the currency group and the
 * inventory sections instead. With the hideEmptyPowerGroups flag set, empty
 * power groups drop out — except when every group is empty, where the first
 * one stays so its "+" button still has a home — matching the v2 powers tab.
 */
const catalogSections = computed(() => {
	if (isInventory.value) {
		const sections = [
			...(showCurrency.value ? [CURRENCY_SECTION] : []),
			...INVENTORY_SECTIONS
				.map(({ key, labelKey, kind, items }) => ({ key, labelKey, kind, members: items.value }))
		];
		return orderedGroups(sections, savedGroupOrder.value);
	}
	const groups = powerGroups.value;
	const visible = hideEmptyPowerGroups.value
		? groups.filter((group) => group.members.length > 0)
		: groups;
	if (hideEmptyPowerGroups.value && !visible.length && groups.length) visible.push(groups[0]);
	return orderedGroups(visible, savedGroupOrder.value);
});

/**
 * Title for a section's "+" button.
 * @param section
 */
const addTitle = (section) => game.i18n.format("ARCHMAGE.addToGroup", {
	group: localize(section.labelKey)
});

/**
 * Item data for a section's "+" button, pre-filled so the new item lands in
 * the group it was added from: built-in group modes set the mode's system
 * field (e.g. system.powerUsage.value), the action mode sets the action
 * type, custom groups set the free-text group (the default group leaves it
 * empty), inventory sections just use their type. Filtered tabs also fill
 * their filter's fields (first listed value), so what's created there stays
 * in the tab that created it.
 * @param section
 */
const groupCreateData = (section) => {
	const mode = props.tab?.groupBy;
	const data = { type: "power", system: {} };
	if (mode === "actionType") data.system.actionType = { value: section.key };
	else if (mode === "group") {
		if (section.raw) data.system.group = { value: section.raw };
	}
	else if (GROUP_MODES[mode]) data.system[mode] = { value: section.key };
	else data.type = section.kind;
	const filter = props.tab?.filter;
	if (data.type === "power" && filter) {
		for (const [key, values] of Object.entries(filter)) {
			if (key !== mode && data.system[key] === undefined) data.system[key] = { value: values[0] };
		}
	}
	return data;
};

/**
 * Create a new item from a section's "+" button, named and imaged like the
 * v2 sheet's add buttons.
 * @param section
 */
const createGroupItem = async (section) => {
	if (!actorDocument) return;
	const { type, system } = groupCreateData(section);
	await actorDocument.createEmbeddedDocuments("Item", [{
		name: game.archmage.ArchmageUtility.formatNewItemName(type),
		type,
		img: CONFIG.ARCHMAGE.defaultTokens[type] ?? CONFIG.DEFAULT_TOKEN,
		system
	}]);
};
</script>

<style scoped lang="scss">
  @import 'v3/drag-reorder';

  // Coin purses, styled like the filter controls (label above slim input).
  // Units share the row evenly; gold/silver/copper copy the v2 sheet's
  // denomination text colors (platinum keeps the default color there too).
  .catalog-currency {
    gap: 2em;

    > div {
      text-align: center;

      &.currency-unit-gold {
        color: #efc44a;
      }

      &.currency-unit-silver {
        color: #888;
      }

      &.currency-unit-copper {
        color: #c17a58;
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
      // Keeps the light denomination colors legible on the light theme.
      text-shadow: 0 0 5px var(--c-black--50);
    }

    input[type="number"] {
      font-weight: bold;
      text-align: center;
    }
  }

  // Import button, slotted into the shared sort/filter bar and aligned to
  // the control row (no label above it).
  .import-catalog {
    flex: 0 auto;
    align-self: flex-end;

    button {
      height: var(--input-height);
      font-size: var(--font-size-12);
      border-radius: 3px;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      // Empty-catalog attention pulse, same accent as the identity fields'
      // (charms even while disabled — the tooltip explains why).
      &.catalog-import--pulse {
        animation: v3-empty-pulse 2s ease-in-out infinite;
      }
    }
  }

  .catalog-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .catalog-group-title {
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;

    .group-title-label {
      flex: 1;
      text-align: left;
    }

    .group-add {
      cursor: pointer;
      font-size: var(--font-size-14);

      &:hover {
        text-shadow: 0 0 5px var(--v3-hover-glow);
      }
    }

    // Group reordering affordances.
    &[draggable="true"] {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    &:hover .group-grip {
      opacity: 1;
    }
  }

  .group-grip {
    font-size: var(--font-size-14);
    margin-right: $padding-sm;
    opacity: 0.35;
  }

  .catalog-group--dragging {
    opacity: 0.5;
  }

  .catalog-group--drop-target > .catalog-group-title {
    outline: 2px dashed;
    outline-offset: 2px;
    margin-left: 4px;
  }

  .catalog-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Empty-field attention pulse (shared look with the identity fields). */
  @keyframes v3-empty-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 transparent;
    }
    50% {
      box-shadow: 0 0 0 2px var(--v3-hint);
    }
  }
</style>
