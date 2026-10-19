<template>
	<section class="tab-item-index">
		<!-- The view button (grouping/sorting/filtering popover), the filter entry
			and the import button. -->
		<SortFilterBarV3 :id="concat('item-index-', tabId)" v-model:search="searchValue">
			<!-- View button, opening the popover that holds this tab's
				grouping and sorting selects and its filter chips. -->
			<template #sort>
				<span class="view-item-index">
					<button
						type="button"
						class="item-index-view"
						:class="{ 'item-index-view--open': openView }"
						:data-tooltip="localize('ARCHMAGE.filters')"
						@click.stop="openView = !openView"
					>
						<i class="fas fa-bars" />
						<span v-if="activeFilterCount" class="item-index-view-count">{{ activeFilterCount }}</span>
					</button>
					<div v-if="openView" class="view-item-index-popover" @click.stop>
						<!-- Group and sort share the top row, a column each. -->
						<div class="group-sort-row">
							<div class="group-item-index">
								<label :for="concat('item-index-group-', tabId)">{{ localize('ARCHMAGE.groupBy') }}</label>
								<!-- Unnamed: the v-model persists through saveTabDef; a
									name would put the select on the sheet form's submit
									path (submitOnChange -> a full actor.update). -->
								<select :id="concat('item-index-group-', tabId)" v-model="groupBy">
									<option v-for="option in groupOptions" :key="option.value" :value="option.value">{{ localize(option.labelKey ?? `ARCHMAGE.GROUPS.${option.value}`) }}</option>
								</select>
							</div>
							<div class="group-item-index">
								<label :for="concat('item-index-sort-', tabId)">{{ localize('ARCHMAGE.sort') }}</label>
								<select :id="concat('item-index-sort-', tabId)" v-model="sortBy">
									<option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ localize(`ARCHMAGE.SORTS.${option.value}`) }}</option>
								</select>
							</div>
						</div>
						<!-- Filter facets: chips for the values this character's
							items actually carry plus its groups' canonical values, OR
							within a row and AND across rows (and with the search).
							Cleared as a whole; persisted per tab like group and sort. -->
						<div class="filter-item-index">
							<div class="filter-head">
								<h4 class="filter-title">
									<span>{{ localize('ARCHMAGE.filters') }}</span>
									<InfoBubble :tooltip="localize('ARCHMAGE.filterHint')" />
								</h4>
								<button v-if="filtersActive" type="button" class="filter-clear" @click="clearFilters">{{ localize('ARCHMAGE.clearFilters') }}</button>
							</div>
							<div v-for="row in facetRows" :key="row.key" class="facet-row">
								<span class="facet-row-label">
									<span>{{ localize(row.labelKey) }}</span>
									<!-- The grouped facet's row also offers "hide
											empty", selecting all but its empty chips so
											only filled groups show. -->
									<span class="facet-row-links">
										<button
											v-if="row.key === groupBy && row.hasEmpty"
											type="button"
											class="facet-all"
											@click="hideEmptyFilters(row.key)"
										>{{ localize('ARCHMAGE.hideEmpty') }}</button>
										<!-- The row's select-all widget reads "none" while
												every chip is active, its click clearing the row. -->
										<button
											type="button"
											class="facet-all"
											@click="toggleAllFilters(row.key)"
										>{{ localize(row.allActive ? 'ARCHMAGE.none' : 'ARCHMAGE.all') }}</button>
									</span>
								</span>
								<div class="facet-row-chips">
									<button
										v-for="chip in row.chips"
										:key="chip.value"
										type="button"
										class="facet-chip"
										:class="{ 'facet-chip--on': chip.active, 'facet-chip--empty': chip.empty }"
										@click="toggleFilter(row.key, chip.value)"
									>{{ chip.label }}</button>
								</div>
							</div>
						</div>
					</div>
				</span>
			</template>
			<div v-if="canImport" class="import-item-index">
				<button
					type="button"
					class="item-index-import"
					:class="{ 'v3-pulse': isEmptyCharacter }"
					:disabled="missingKinClass(actor)"
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
			v-for="section in itemIndexSections"
			:key="section.key"
			class="item-index-group"
			:class="groupClasses(section.key)"
			@dragover="onGroupDragOver($event, section.key)"
			@dragleave="onGroupDragLeave($event, section.key)"
			@drop="onGroupDrop($event, section.key)"
		>
			<h4
				class="item-index-group-title unit-title"
				:draggable="canDragGroups"
				@dragstart="onGroupDragStart($event, section.key)"
				@dragend="onGroupDragEnd"
			>
				<i v-if="canDragGroups" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')" />
				<span class="group-title-label">{{ localize(section.labelKey) }}</span>
				<span v-if="editable && section.kind !== 'currency'" class="group-add-wrap">
					<a
						class="group-add"
						:class="{ 'group-add--open': openAddMenu === section.key }"
						:title="addTitle(section)"
						@click.stop="onGroupAdd(section)"
					><i class="fas fa-plus" /></a>
					<!-- Ambiguous groups' type menu: a group both powers and
							equipment (or, for the catch-all, loot) can land in opens
							this dropdown to pick what the "+" adds. -->
					<div v-if="openAddMenu === section.key" class="group-add-menu" @click.stop>
						<button v-for="option in addOptions(section)" :key="option" type="button" @click="createGroupItem(section, option)">
							{{ localize(`TYPES.Item.${option}`) }}
						</button>
					</div>
				</span>
			</h4>
			<!-- Coin purses, matching the v2 inventory tab. Deliberately
						nameless inputs persisting through the live actor document on
						change: every mounted item index tab renders this row, and named
						copies would make the sheet's form submit collect each field
						twice as an array. -->
			<div v-if="section.kind === 'currency'" class="item-index-currency flexrow">
				<div v-for="type in CURRENCY" :key="type" :class="concat('currency-unit currency-unit-', type)">
					<label :for="concat('item-index-coin-', tabId, '-', type)">{{ localize(`ARCHMAGE.COINS.${type}`) }}</label>
					<input
						:id="concat('item-index-coin-', tabId, '-', type)"
						:value="coinValue(type)"
						type="number"
						placeholder="0"
						@change="setCoin(type, $event)"
					>
				</div>
			</div>
			<ul v-else class="item-index-list flexcol" :data-group-by="groupBy">
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
import { computed, inject, ref } from "vue";
import { byLevel as byPowerLevel, byName, byTier, concat, equipmentBonuses, kinLabel, localize, missingKinClass } from "@/methods/Helpers";
import { ITEM_INDEX_GROUP_MODES } from "@/methods/ItemIndexTabs";
import { useFacetFilters } from "@/composables/useFacetFilters";
import { useGroupReorder } from "@/composables/useGroupReorder";
import { useItemIndexTabPrefs } from "@/composables/useItemIndexTabPrefs";
import { useDismissablePopover } from "@/composables/useDismissablePopover";
import { useSearchFilter } from "@/composables/useSearchFilter";
import { groupItemIndexSections, groupCreateData, groupCreateOptions } from "@/methods/ItemIndexSections";
import SortFilterBarV3 from "@/components/actor/character/v3/parts/SortFilterBarV3.vue";
import ExpandableRowV3 from "@/components/actor/character/v3/parts/ExpandableRowV3.vue";
import InfoBubble from "@/components/parts/InfoBubble.vue";

const props = defineProps(["actor", "editable", "context", "tab"]);

// Creation writes go through the real actor document; props.actor is a clone.
const actorDocument = inject("actorDocument");

// The tab id keys the controls' ids and names only: every mounted item index
// tab renders the same list, and duplicate name= attributes would make the
// sheet's form submit collect each field twice.
const tabId = computed(() => props.tab?.id ?? "item-index");

// The group-by select's options, derived from the shared mode list so a new
// mode needs adding in one place. A labelKey overrides the shared GROUPS
// key — the power-type option reads "Power type" rather than "Type", and the
// power-source one reads "Power Source", which the v2 sheet's
// "Class/Race/Item" GROUPS entry isn't.
const GROUP_LABEL_KEYS = {
	powerType: "ARCHMAGE.powerType",
	powerSource: "ARCHMAGE.CHAT.powerSource"
};
const groupOptions = ITEM_INDEX_GROUP_MODES.map((value) => ({ value, labelKey: GROUP_LABEL_KEYS[value] }));
const sortOptions = [
	{ value: "name" },
	{ value: "level" },
	{ value: "custom" }
];

// Grouping and sorting are the tab's own: the controls patch this tab's
// stored definition, so each tab groups and sorts independently of the
// others and of the v2 sheet's powers flags.
const canReorderGroups = computed(() => props.editable === true && !props.actor?.pack);
const { groupBy, sortBy, saveTabDef } = useItemIndexTabPrefs({
	actor: () => props.actor,
	tab: () => props.tab,
	tabId: () => tabId.value,
	canWrite: canReorderGroups
});

// The grouping/sorting popover's open state is transient; a document click
// outside the view button or Escape closes it.
const openView = ref(false);
useDismissablePopover(openView, ".view-item-index");

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

// Filter facets: the popover's chip rows and the matcher the listing filters
// through come from the shared composable; the chip selections persist per
// tab like group and sort, through this tab's definition patcher.
const {
	facetRows, activeFilters, activeFilterCount, filtersActive, matchesFilters, toggleFilter, toggleAllFilters, hideEmptyFilters, clearFilters
} = useFacetFilters({
	items: () => props.actor?.items ?? [],
	filters: () => props.tab?.filters ?? {},
	save: (filters) => saveTabDef({ filters })
});

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists per tab and grouping mode, so each tab's arrangement
// is its own. Dragging pauses while facet filters are active: the drop
// rebuilds the saved order from the displayed sections, and groups filtered
// out of the display would drop out of the saved order with them.
const canDragGroups = computed(() => canReorderGroups.value && !filtersActive.value);
const {
	savedGroupOrder,
	groupClasses, onGroupDragStart, onGroupDragOver, onGroupDragLeave, onGroupDrop, onGroupDragEnd
} = useGroupReorder({
	actor: () => props.actor,
	canReorder: canDragGroups,
	flagPath: () => `sheetDisplay.itemIndex.groupOrder.${tabId.value}.${groupBy.value}`,
	getSections: () => itemIndexSections.value,
	classPrefix: "item-index-group"
});

// The import button opens the power importer for the live actor. Like the v2
// sheet, non-GM users who turned it off in the character settings don't see it.
const canImport = computed(() =>
	!(props.actor?.flags?.archmage?.hideImportPowers === true && !game.user.isGM));

// The importer builds its tabs from the character's kin and class, so with
// neither set it would just silently do nothing; the button disables itself
// with an explanatory tooltip instead.
const importTooltip = computed(() => missingKinClass(props.actor)
	? localize("ARCHMAGE.importNeedsKinClass", { kin: kinLabel() })
	: localize("ARCHMAGE.import"));

// The button pulses while the character has no items, advertising where a
// new character's powers come from.
const isEmptyCharacter = computed(() => (props.actor?.items ?? []).length === 0);

// Coin purses edited in place, like the v2 inventory tab's currency strip;
// the character settings flag hides the whole row.
const CURRENCY = ["platinum", "gold", "silver", "copper"];
const showCurrency = computed(() => props.actor?.flags?.archmage?.hideCurrency !== true);
const coins = computed(() => props.actor?.system?.coins ?? {});

/**
 * A purse's value, read defensively: the stored shape is coins.<type>.value,
 * but the template defaults a fresh actor's coins to plain numbers and
 * actors hit by the duplicate-name submit bug carry arrays there — nothing
 * a number input can display, so anything non-numeric reads as empty.
 * @param type
 */
const coinValue = (type) => {
	const stored = coins.value?.[type];
	const raw = stored && typeof stored === "object" ? stored.value : stored;
	const num = Number(raw);
	return raw === null || raw === undefined || raw === "" || !Number.isFinite(num) ? null : num;
};

/**
 * Persist a purse through the real actor document on change, like the
 * loadout's tracker inputs — not through the sheet's named-input submit,
 * which every mounted item index tab would join.
 * @param type
 * @param event
 */
const setCoin = async (type, event) => {
	if (props.editable === false) return;
	const num = Number(event.target.value);
	await actorDocument?.update({ [`system.coins.${type}.value`]: Number.isFinite(num) ? num : 0 });
};

// The static gathers the import data and opens the one-per-actor importer
// window; it ignores pack actors and falsy actors itself.
const importPowers = () => game.archmage.ArchmagePowerImporterApplication.show(actorDocument ?? props.actor);

const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);

const byLevel = (a, b) => {
	// Powers sort by level, equipment by tier, loot has no level so it falls
	// back to name.
	if (a.type === "equipment") return byTier(a, b);
	if (["loot", "tool"].includes(a.type)) return byName(a, b);
	return byPowerLevel(a, b);
};

const sortFns = { name: byName, level: byLevel, custom: byCustom };

const itemIndexItems = (types) => (props.actor?.items ?? [])
	.filter((i) => types.includes(i.type))
	.filter(matchesSearch)
	.filter(matchesFilters)
	.sort(sortFns[sortBy.value] ?? byName);

// The items the group-by mode collates: powers and equipment by their field
// values, with anything the mode has no group for falling into the catch-all.
// Legacy 'tool' items are indexed as loot, matching the inventory tab.
const collated = computed(() => itemIndexItems(["power", "equipment"]));
const loot = computed(() => itemIndexItems(["loot", "tool"]));

// The collation itself — the mode's canonical groups, the catch-all, the
// facet narrowing, loot and currency, in the saved group order — lives in
// methods/ItemIndexSections, mirroring the facet filters' chip values.
const itemIndexSections = computed(() => groupItemIndexSections({
	mode: groupBy.value,
	items: collated.value,
	loot: loot.value,
	showCurrency: showCurrency.value,
	activeFilters: activeFilters.value,
	savedOrder: savedGroupOrder.value
}));

/**
 * Title for a section's "+" button.
 * @param {object} section
 */
const addTitle = (section) => localize("ARCHMAGE.addToGroup", {
	group: localize(section.labelKey)
});

// The type menu an ambiguous group's "+" opens — the key of the one section
// whose menu is showing, or null. A document click outside the group's add
// control, or Escape, closes it.
const openAddMenu = ref(null);
useDismissablePopover(openAddMenu, ".group-add-wrap", null);

/**
 * The item types a section's "+" can create.
 * @param {object} section
 * @returns {Array}
 */
const addOptions = (section) => groupCreateOptions(section, groupBy.value);

/**
 * A section's "+" click: a group whose item type is ambiguous opens the
 * type menu instead of creating a power outright.
 * @param {object} section
 */
const onGroupAdd = (section) => {
	if (addOptions(section).length > 1) {
		openAddMenu.value = openAddMenu.value === section.key ? null : section.key;
	}
	else {
		createGroupItem(section);
	}
};

/**
 * Create a new item from a section's "+" button, named and imaged like the
 * v2 sheet's add buttons; the type menu's choice passes through, defaulting
 * to the section's own single type.
 * @param {object} section
 * @param {string} [type]
 * @returns {Promise<void>}
 */
const createGroupItem = async (section, type) => {
	if (!actorDocument) return;
	openAddMenu.value = null;
	const { type: itemType, system } = groupCreateData(section, groupBy.value, type);
	await actorDocument.createEmbeddedDocuments("Item", [{
		name: game.archmage.ArchmageUtility.formatNewItemName(itemType),
		type: itemType,
		img: CONFIG.ARCHMAGE.defaultTokens[itemType] ?? CONFIG.DEFAULT_TOKEN,
		system
	}]);
};
</script>

<style scoped lang="scss">
  @import 'v3/popover';
  // The view button and its grouping/sorting popover, docked at the bar's
  // start (in the bar's #sort slot, ahead of the filter entry).
  .view-item-index {
    position: relative;
    flex: 0 0 auto;
    align-self: flex-end;
    display: flex;
    align-items: center;
  }

  // A standard button sized like the import button.
  .item-index-view {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: var(--input-height);
    font-size: var(--font-size-12);
    border-radius: 3px;
    background: transparent;
    line-height: 1;
    color: var(--color-text-secondary);
    cursor: var(--cursor-pointer);

    &:hover {
      color: var(--color-text-primary);
      text-shadow: 0 0 10px var(--color-shadow-primary);
    }

    // Lit while its popover is open.
    &.item-index-view--open {
      color: var(--color-text-emphatic);
      text-shadow: 0 0 10px var(--color-shadow-primary);
    }

    // Filter count badge: chips can hide list content while the popover is
    // closed, so the closed view button carries the number of active chips.
    .item-index-view-count {
      position: absolute;
      top: -0.3rem;
      right: -0.4rem;
      min-width: 1em;
      padding: 0 0.25em;
      border-radius: 1em;
      background: var(--v3-hint);
      color: var(--c-black);
      font-size: var(--font-size-10);
      font-weight: bold;
      line-height: 1.3;
      text-align: center;
    }
  }

  .view-item-index-popover {
    @include v3-popover;

    // The group and sort selects share the top row, a labelled column
    // each; styled like the bar's own controls, whose scoped rules don't
    // reach slot content.
    .group-sort-row {
      display: flex;
      gap: 0.375rem;

      .group-item-index {
        @include v3-popover-col;
      }
    }

    // The filter facet rows, under a dashed rule matching the bar's own
    // divider: a bold label and a wrap of toggle chips each.
    .filter-item-index {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding-top: 0.375rem;
      border-top: 1px solid var(--color-border);

      .filter-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        min-height: 2.25em;

        // The filter heading, an h4 for a bit more division than a plain
        // label, with its hint bubble grouped at the row's start.
        h4.filter-title {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: var(--font-size-16);
          font-weight: bold;
        }
      }

      .filter-clear {
        padding: 0;
        background: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
        font-size: inherit;
        color: var(--color-text-secondary);
        text-decoration: underline;
        cursor: var(--cursor-pointer);

        &:hover {
          color: var(--color-text-primary);
          text-shadow: 0 0 5px var(--v3-hover-glow);
        }
      }

      .facet-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .facet-row-label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        font-weight: bold;
      }

      // A row's links, grouped at the label's end: the grouped facet's
      // optional "hide empty" beside the always-present "all".
      .facet-row-links {
        display: inline-flex;
        gap: 0.5rem;
        font-weight: normal;
      }

      // The row's select-all widget, styled like the clear button.
      .facet-all {
        padding: 0;
        background: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
        font-size: inherit;
        font-weight: normal;
        color: var(--color-text-secondary);
        text-decoration: underline;
        cursor: var(--cursor-pointer);

        &:hover {
          color: var(--color-text-primary);
          text-shadow: 0 0 5px var(--v3-hover-glow);
        }
      }

      .facet-row-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .facet-chip {
        padding: 0.125rem 0.5rem;
        border: 1px solid var(--color-border);
        border-radius: 1rem;
        background: var(--v3-chip-bg);
        font-size: inherit;
        line-height: 1.3;
        color: var(--color-text-secondary);
        cursor: var(--cursor-pointer);

        &:hover {
          color: var(--color-text-primary);
          text-shadow: 0 0 5px var(--v3-hover-glow);
        }

        // On chips light up like the open ellipsis does.
        &.facet-chip--on {
          border-color: currentcolor;
          color: var(--color-text-emphatic);
          text-shadow: 0 0 5px var(--color-shadow-primary);
        }

        // A chip no item carries: the dashed outline and dimmed label mark
        // the group as empty — its section still renders, add button ready.
        // Interaction and an active selection restore full legibility.
        &.facet-chip--empty {
          border-style: dashed;
          opacity: 0.6;

          &:hover,
          &.facet-chip--on {
            opacity: 1;
          }
        }
      }
    }
  }

  // Coin purses, styled like the filter controls (label above slim input).
  // Units share the row evenly; gold/silver/copper copy the v2 sheet's
  // denomination text colors (platinum keeps the default color there too).
  .item-index-currency {
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
  .import-item-index {
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

      // Empty-index attention pulse: the v3-pulse class from the shared
      // partial carries the animation.
    }
  }

  .item-index-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .item-index-group-title {
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;

    .group-title-label {
      flex: 1;
      text-align: left;
    }

    // The add control, wrapped so the ambiguous groups' type menu can
    // anchor to it.
    .group-add-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .group-add {
      cursor: pointer;
      font-size: var(--font-size-14);

      &:hover {
        text-shadow: 0 0 5px var(--v3-hover-glow);
      }

      // Lit while its type menu is open.
      &.group-add--open {
        color: var(--color-text-emphatic);
        text-shadow: 0 0 10px var(--color-shadow-primary);
      }
    }

    // The type menu an ambiguous group's "+" opens: a small right-aligned
    // popover listing the item types the group can hold.
    .group-add-menu {
      @include v3-popover;

      top: calc(100% + 0.375rem);
      right: 0;
      left: auto;
      width: auto;
      min-width: 8rem;
      gap: 0;
      padding: 0.25rem 0;

      button {
        padding: 0.25rem 0.625rem;
        background: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
        font-size: var(--font-size-12);
        line-height: 1.4;
        text-align: left;
        color: var(--color-text-secondary);
        cursor: var(--cursor-pointer);

        &:hover {
          color: var(--color-text-primary);
          text-shadow: 0 0 5px var(--v3-hover-glow);
        }
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

  .item-index-group--dragging {
    opacity: 0.5;
  }

  .item-index-group--drop-target > .item-index-group-title {
    outline: 2px dashed;
    outline-offset: 2px;
    margin-left: 4px;
  }

  .item-index-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
