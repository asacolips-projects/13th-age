<template>
	<section class="tab-catalog">
		<!-- Sorts, filters, the group-by select and the import button. -->
		<SortFilterBarV3 :id="concat('catalog-', tabId)" v-model:sort="sortBy" v-model:search="searchValue" :sort-options="sortOptions">
			<div class="group-catalog">
				<label :for="concat('catalog-group-', tabId)">{{ localize('ARCHMAGE.groupBy') }}</label>
				<select :id="concat('catalog-group-', tabId)" v-model="groupBy" :name="concat('catalog-group-', tabId)">
					<option v-for="option in groupOptions" :key="option.value" :value="option.value">{{ localize(`ARCHMAGE.GROUPS.${option.value}`) }}</option>
				</select>
			</div>
			<div v-if="canImport" class="import-catalog">
				<button
					type="button"
					class="catalog-import"
					:class="{ 'catalog-import--pulse': isEmptyCharacter }"
					:disabled="missingKinClass"
					:data-tooltip="importTooltip"
					@click="importPowers"
				>
					<i class="fas fa-atlas" />
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
				:draggable="canReorderGroups"
				@dragstart="onGroupDragStart($event, section.key)"
				@dragend="onGroupDragEnd"
			>
				<i v-if="canReorderGroups" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')" />
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
				/>
			</ul>
		</section>
	</section>
</template>

<script setup>
import { computed, inject } from "vue";
import { byLevel as byPowerLevel, byName, cleanFilterKey, concat, equipmentBonuses, isSecondEdition, localize, orderedGroups, saveSheetDisplayPref, TIER_ORDER } from "@/methods/Helpers";
import { useGroupReorder } from "@/composables/useGroupReorder";
import { useSearchFilter } from "@/composables/useSearchFilter";
import SortFilterBarV3 from "@/components/actor/character/v3/parts/SortFilterBarV3.vue";
import ExpandableRowV3 from "@/components/actor/character/v3/parts/ExpandableRowV3.vue";

const props = defineProps(["actor", "editable", "context", "tab"]);

// Creation writes go through the real actor document; props.actor is a clone.
const actorDocument = inject("actorDocument");

// The tab id keys the controls' ids and names only: every mounted catalog
// tab renders the same list, and duplicate name= attributes would make the
// sheet's form submit collect each field twice.
const tabId = computed(() => props.tab?.id ?? "catalog");

// Grouping modes: the item field each reads. The power field modes also name
// the CONFIG key giving their canonical group order.
const GROUP_MODES = {
	actionType: { field: "actionType" },
	powerType: { field: "powerType", config: "powerTypes" },
	powerUsage: { field: "powerUsage", config: "powerUsages" },
	powerSource: { field: "powerSource", config: "powerSources" },
	group: { field: "group" }
};

// Display order for the action grouping; the catch-all group trails it.
const ACTION_ORDER = ["standard", "move", "quick", "free", "interrupt"];

const groupOptions = [
	{ value: "actionType" },
	{ value: "powerType" },
	{ value: "powerUsage" },
	{ value: "powerSource" },
	{ value: "group" }
];
const sortOptions = [
	{ value: "name" },
	{ value: "level" },
	{ value: "custom" }
];

/**
 * Patch this tab's definition in the stored tabs flags. Nothing to patch
 * until the tab set has been written once — migration seeds it on sheet
 * render, and pack actors keep the derived defaults — and pack actors
 * can't write flags at all.
 * @param patch
 */
const saveTabDef = async (patch) => {
	if (!canReorderGroups.value) return;
	const defs = props.actor?.flags?.archmage?.sheetDisplay?.catalog?.tabs ?? [];
	if (!defs.length) return;
	const next = defs.map((def) => def.id === tabId.value ? { ...def, ...patch } : def);
	await saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.tabs", next);
};

// Grouping and sorting are the tab's own: the controls patch this tab's
// stored definition, so each tab groups and sorts independently of the
// others and of the v2 sheet's powers flags. The sort falls back to
// 'custom' like v2 does, since drag-to-reorder writes item sort values
// that only that mode honors.
const groupBy = computed({
	get: () => props.tab?.groupBy ?? "powerType",
	set: (value) => saveTabDef({ groupBy: value })
});
const sortBy = computed({
	get: () => props.tab?.sortBy ?? "custom",
	set: (value) => saveTabDef({ sortBy: value })
});

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

// Group reordering is only offered when the sheet is editable and the actor
// isn't a compendium entry (where flags can't be written).
const canReorderGroups = computed(() => props.editable === true && !props.actor?.pack);

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists per tab and grouping mode, so each tab's arrangement
// is its own.
const {
	savedGroupOrder,
	groupClasses, onGroupDragStart, onGroupDragOver, onGroupDragLeave, onGroupDrop, onGroupDragEnd
} = useGroupReorder({
	actor: () => props.actor,
	canReorder: canReorderGroups,
	flagPath: () => `sheetDisplay.catalog.groupOrder.${tabId.value}.${groupBy.value}`,
	getSections: () => catalogSections.value,
	classPrefix: "catalog-group"
});

// The import button opens the power importer for the live actor. Like the v2
// sheet, non-GM users who turned it off in the character settings don't see it.
const canImport = computed(() =>
	!(props.actor?.flags?.archmage?.hideImportPowers === true && !game.user.isGM));

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
	: game.i18n.localize('ARCHMAGE.import'));

// The button pulses while the character has no items, advertising where a
// new character's powers come from.
const isEmptyCharacter = computed(() => (props.actor?.items ?? []).length === 0);

// Coin purses edited in place, like the v2 inventory tab's currency strip;
// the character settings flag hides the whole row. The named inputs persist
// through the sheet's submitOnChange, like the stats header's resource units.
const CURRENCY = ["platinum", "gold", "silver", "copper"];
const showCurrency = computed(() => props.actor?.flags?.archmage?.hideCurrency !== true);
const coins = computed(() => props.actor?.system?.coins ?? {});

// The static gathers the import data and opens the one-per-actor importer
// window; it ignores pack actors and falsy actors itself.
const importPowers = () => game.archmage.ArchmagePowerImporterApplication.show(actorDocument ?? props.actor);

const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);

const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

const byLevel = (a, b) => {
	// Powers sort by level, equipment by tier, loot has no level so it falls
	// back to name.
	if (a.type === "equipment") return byTier(a, b);
	if (["loot", "tool"].includes(a.type)) return byName(a, b);
	return byPowerLevel(a, b);
};

const sortFns = { name: byName, level: byLevel, custom: byCustom };

const catalogItems = (types) => (props.actor?.items ?? [])
	.filter((i) => types.includes(i.type))
	.filter(matchesSearch)
	.sort(sortFns[sortBy.value] ?? byName);

// The items the group-by mode collates: powers and equipment by their field
// values, with anything the mode has no group for falling into the catch-all.
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const collated = computed(() => catalogItems(["power", "equipment"]));
const loot = computed(() => catalogItems(["loot", "tool"]));

/**
 * Canonical group keys for the mode, in natural order: the fixed action
 * order for actionType, the CONFIG key order for the power field modes —
 * minus those configs' own 'other' entries, which the catch-all covers.
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
 * or not; filtering groups is left to the tab's own (user-configurable)
 * filter. Group order is per tab and mode, shared by power groups, the
 * catch-all, loot and currency alike.
 */
const catalogSections = computed(() => {
	const mode = groupBy.value;
	const groups = new Map(canonicalKeys(mode).map((key) => [key, makeGroup(key, groupLabel(mode, key))]));
	const other = makeGroup("other", "ARCHMAGE.other");

	if (mode === "group") {
		// Custom groups come from the item's free-text group field, in
		// first-appearance order; items without a group value — and custom
		// groups literally named 'Other' — join the catch-all.
		for (const item of collated.value) {
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
		for (const item of collated.value) {
			// In the action grouping, a magic item's power is a free action,
			// so equipment with a power usage joins the free group.
			const value = mode === "actionType" && item.type === "equipment"
				? (item.system?.powerUsage?.value ? "free" : "other")
				: item.system?.[field]?.value;
			// Override legacy 'maneuver' with 'flexible'.
			const key = value === "maneuver" ? "flexible" : value;
			(groups.get(key) ?? other).members.push(item);
		}
	}

	const sections = [
		...groups.values(),
		other,
		{ key: "inventory-loot", labelKey: "ARCHMAGE.INVENTORY.loot", kind: "loot", members: loot.value },
		...(showCurrency.value ? [{ key: "inventory-currency", labelKey: "ARCHMAGE.INVENTORY.currency", kind: "currency", members: [] }] : [])
	];
	return orderedGroups(sections, savedGroupOrder.value);
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
 * field (e.g. system.powerUsage.value), custom groups set the free-text
 * group, the catch-all leaves it empty so the power lands there, and loot
 * sections just use their type.
 * @param section
 */
const groupCreateData = (section) => {
	if (section.kind !== "power") return { type: section.kind, system: {} };
	if (section.key === "other") return { type: "power", system: {} };
	if (groupBy.value === "group") {
		return { type: "power", system: { group: { value: section.raw } } };
	}
	return { type: "power", system: { [groupBy.value]: { value: section.key } } };
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
  // The group-by control slotted into the shared sort/filter bar: styled
  // like the bar's own controls, whose scoped rules don't reach slot content.
  .group-catalog {
    flex: 0 auto;

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }
  }

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
      background: transparent;

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
