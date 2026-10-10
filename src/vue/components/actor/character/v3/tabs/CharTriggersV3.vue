<template>
	<section class="tab-triggers">
		<template v-if="powersWithTriggers.length">
			<!-- Sorts, filters and the grouping toggle at the right-hand end. -->
			<SortFilterBarV3 id="trigger" v-model:sort="sortBy" v-model:search="searchValue" :sort-options="sortOptions">
				<label class="filter-custom-groups">
					<input v-model="useCustomGroups" type="checkbox">
					<span>{{ localize('ARCHMAGE.GROUPS.group') }}</span>
				</label>
			</SortFilterBarV3>

			<template v-if="filteredPowers.length">
				<section v-for="group in groups" :key="group.title" class="trigger-group">
					<h3 v-if="group.title" class="group-title">{{ group.title }}</h3>
					<ul class="trigger-list">
						<ExpandableRowV3
							v-for="power in group.powerRows"
							:key="power._id"
							:item="power"
							:actor="actor"
							:context="context"
							base-class="trigger"
							:trigger="false"
							columns="32px minmax(6rem, 10rem) minmax(0, 1fr)"
						>
							<!-- Standard power row: the portrait, the name, then the trigger
                   text where the catalog rows carry their feats, uses and
                   controls. -->
							<template #cells="{toggle}">
								<!-- Clicking the trigger text expands the row, like the name.
                     The text rides in a block of its own because a flex cell's
                     own text-overflow never ellipsizes; see the styles. -->
								<a class="trigger-text" @click="toggle">
									<span class="trigger-value">{{ power.system.trigger.value }}</span>
								</a>
							</template>
						</ExpandableRowV3>
					</ul>
				</section>
			</template>
		</template>

		<p v-if="!filteredPowers.length" class="v3-empty">{{ localize('ARCHMAGE.CHARACTERSHEETV3.noPowersWithTriggers') }}</p>
	</section>
</template>

<script setup>
/**
 * The triggers tab: every power with trigger text, listed with the trigger
 * in its own column and expanding to the power's full details. Custom
 * grouping mirrors the V2 triggers tab, persisting under the same flag;
 * sorting and text filtering use the catalog tab's controls.
 */
import { computed, ref, watch } from "vue";
import { byLevel, byName, localize, saveSheetDisplayPref } from "@/methods/Helpers";
import { useSearchFilter } from "@/composables/useSearchFilter";
import SortFilterBarV3 from "@/components/actor/character/v3/parts/SortFilterBarV3.vue";
import ExpandableRowV3 from "../parts/ExpandableRowV3.vue";

const props = defineProps(["actor", "context"]);

const powersWithTriggers = computed(() => (props.actor?.items ?? [])
	.filter((x) => x.type === "power")
	.filter((x) => x.system.trigger?.value)
	.sort((a, b) => (a.sort || 0) - (b.sort || 0)));

// Sorts and filters, laid out like the catalog tab. 'custom' keeps the
// item sort order; the other modes ignore it.
const sortOptions = [{ value: "name" }, { value: "level" }, { value: "custom" }];
const sortBy = ref(props.actor?.flags?.archmage?.sheetDisplay?.triggers?.sortBy?.value ?? "custom");

// Searchable text for a row: the name and trigger text the row shows, plus
// the description the expanded row adds.
const { searchValue, matchesSearch } = useSearchFilter(
	(power) => `${power.name ?? ""}${power.system?.trigger?.value ?? ""}${power.system?.description?.value ?? ""}`
);

const sortFns = { name: byName, level: byLevel };

// The rows in display order: the saved item sort ('custom', the sheet's
// drag order) or the selected name/level mode, then the text filter applied.
const filteredPowers = computed(() => {
	const rows = [...powersWithTriggers.value];
	if (sortBy.value !== "custom") rows.sort(sortFns[sortBy.value] ?? byName);
	return rows.filter(matchesSearch);
});

// Read the V2 flag so the two sheets agree, and keep it current from here.
const useCustomGroups = ref(["true", true].includes(
	props.actor?.flags?.archmage?.sheetDisplay?.triggers?.customGroups?.value));

watch(useCustomGroups, (value) =>
	saveSheetDisplayPref(props.actor, "sheetDisplay.triggers.customGroups.value", value));

watch(sortBy, (value) =>
	saveSheetDisplayPref(props.actor, "sheetDisplay.triggers.sortBy.value", value));

const groups = computed(() => {
	if (!useCustomGroups.value) {
		return [{ title: "", powerRows: filteredPowers.value }];
	}

	// Group by the free-text group field; ungrouped powers collect at the top.
	const byGroup = new Map();
	for (const power of filteredPowers.value) {
		const key = power.system.group?.value || "";
		if (!byGroup.has(key)) byGroup.set(key, []);
		byGroup.get(key).push(power);
	}
	return [...byGroup.keys()].sort().map((title) => ({
		title,
		powerRows: byGroup.get(title)
	}));
});
</script>

<style scoped lang="scss">
  @import 'v3/empty';

  // The grouping toggle slotted into the shared sort/filter bar, docking to
  // the bottom of the row, level with the controls like the catalog's import
  // button — styled here, since the bar's scoped rules don't reach it.
  .filter-custom-groups {
    flex: 0 auto;
    align-self: flex-end;
    display: flex;
    align-items: center;
    width: auto;
    height: var(--input-height);
    gap: 0.375rem;
    white-space: nowrap;
    font-weight: normal;
  }

  .trigger-group {
    margin-top: 0.75rem;
  }

  .group-title {
    margin: 0 0 0.25rem;
    font-family: var(--v3-font-display);
    font-size: var(--font-size-16);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .trigger-list {
    margin: 0;
    padding: 0;
    list-style: none;

    // Hovering the name escapes it over the trigger text (PowerSummaryRow's
    // rule), and the cells it escapes over recede so it reads over them —
    // the catalog dims its feat and action cells the same way, from the row
    // component that owns them. This cell is the tab's own, so its dim rule
    // is too, hence :deep() for the name it hangs off.
    :deep(.power-name:hover ~ .trigger-text) {
      opacity: 0.25;
    }
  }

  // The trigger cell, read as one aligned field across the rows. The row's
  // grid, typography and chrome are ExpandableRowV3's; only this trailing
  // cell is the tab's own.
  .trigger-text {
    justify-content: flex-start;
    overflow: hidden;
  }

  // The trigger text, truncating with an ellipsis the way the name's title
  // does. The span is the ellipsis' carrier: text sitting directly in a
  // flex cell never ellipsizes, it just slices mid-glyph at the cell edge.
  .trigger-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
