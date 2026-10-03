<template>
  <section class="tab-triggers">
    <template v-if="powersWithTriggers.length">
      <!-- Sorts, filters and the grouping toggle at the right-hand end. -->
      <header class="trigger-filters flexrow">
        <div class="sort-triggers">
          <label for="trigger-sort">{{localize('ARCHMAGE.sort')}}</label>
          <select name="trigger-sort" v-model="sortBy">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.', option.value))}}</option>
          </select>
        </div>
        <div class="filter-search-triggers">
          <label for="trigger-filter">{{localize('ARCHMAGE.filter')}}</label>
          <div class="search-trigger-input">
            <input type="text" name="trigger-filter" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
            <button v-if="searchValue" type="button" class="search-trigger-clear" :title="localize('ARCHMAGE.clear')" @click="clearSearch"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <label class="filter-custom-groups">
          <input type="checkbox" v-model="useCustomGroups">
          <span>Custom Groups</span>
        </label>
      </header>

      <template v-if="filteredPowers.length">
        <section v-for="group in groups" :key="group.title" class="trigger-group">
          <h3 v-if="group.title" class="group-title">{{ group.title }}</h3>
          <ul class="trigger-list">
            <TriggerRowV3 v-for="power in group.powerRows" :key="power._id" :power="power" :actor="actor" :context="context"/>
          </ul>
        </section>
      </template>
    </template>

    <p v-if="!filteredPowers.length" class="trigger-empty">No powers with triggers.</p>
  </section>
</template>

<script setup>
/**
 * The triggers tab: every power with trigger text, listed with the trigger
 * in its own column and expanding to the power's full details. Custom
 * grouping mirrors the V2 triggers tab, persisting under the same flag;
 * sorting and text filtering use the catalog tab's controls.
 */
import { computed, ref, watch } from 'vue';
import { concat, getActor, localize } from '@/methods/Helpers';
import TriggerRowV3 from '../parts/TriggerRowV3.vue';

const props = defineProps(['actor', 'editable', 'context']);

const powersWithTriggers = computed(() => (props.actor?.items ?? [])
  .filter(x => x.type === 'power')
  .filter(x => x.system.trigger?.value)
  .sort((a, b) => (a.sort || 0) - (b.sort || 0)));

// Sorts and filters, laid out like the catalog tab. 'custom' keeps the
// item sort order; the other modes ignore it.
const sortOptions = [{ value: 'name' }, { value: 'level' }, { value: 'custom' }];
const sortBy = ref(props.actor?.flags?.archmage?.sheetDisplay?.triggers?.sortBy?.value ?? 'custom');
const searchValue = ref(null);

// The filter box's clear widget; resetting to null also hides the button.
const clearSearch = () => {
  searchValue.value = null;
};

// Strip enriched-HTML markup so descriptions index as plain text; searching
// raw HTML would match tag names and miss matches split across tags.
const stripHtml = (text) => text.replace(/<[^>]+>/g, '');

// Both sides are stripped to alphanumerics like the catalog filter, so
// punctuation and spacing don't need to match exactly.
const cleanFilterKey = (string) => string ? string.toLowerCase().replace(/[^a-zA-Z\d]/g, '') : '';

// Searchable text for a row: the name and trigger text the row shows, plus
// the description the expanded row adds.
const matchesSearch = (power) => {
  const needle = cleanFilterKey(searchValue.value ?? '');
  if (!needle) return true;
  const haystack = stripHtml(`${power.name ?? ''}${power.system?.trigger?.value ?? ''}${power.system?.description?.value ?? ''}`);
  return cleanFilterKey(haystack).includes(needle);
};

const byName = (a, b) => a.name.localeCompare(b.name);
const byLevel = (a, b) =>
  Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);

const sortFns = { name: byName, level: byLevel };

// The rows in display order: the saved item sort ('custom', the sheet's
// drag order) or the selected name/level mode, then the text filter applied.
const filteredPowers = computed(() => {
  const rows = [...powersWithTriggers.value];
  if (sortBy.value !== 'custom') rows.sort(sortFns[sortBy.value] ?? byName);
  return rows.filter(matchesSearch);
});

// Read the V2 flag so the two sheets agree, and keep it current from here.
const useCustomGroups = ref(['true', true].includes(
  props.actor?.flags?.archmage?.sheetDisplay?.triggers?.customGroups?.value));

watch(useCustomGroups, value => {
  // Pack actors have no setFlag; getActor resolves the live document from the
  // context actor's drag data.
  if (props.actor?.pack) return;
  getActor(props.actor).then(actor => {
    actor?.setFlag('archmage', 'sheetDisplay.triggers.customGroups.value', value);
  });
});

watch(sortBy, value => {
  // Pack actors have no setFlag; getActor resolves the live document from the
  // context actor's drag data. Writing only when the stored value differs
  // avoids a re-render loop from the update.
  if (props.actor?.pack) return;
  const current = props.actor?.flags?.archmage?.sheetDisplay?.triggers?.sortBy?.value ?? 'custom';
  if (current === value) return;
  getActor(props.actor).then(actor => {
    actor?.setFlag('archmage', 'sheetDisplay.triggers.sortBy.value', value);
  });
});

const groups = computed(() => {
  if (!useCustomGroups.value) {
    return [{ title: '', powerRows: filteredPowers.value }];
  }

  // Group by the free-text group field; ungrouped powers collect at the top.
  const byGroup = new Map();
  for (const power of filteredPowers.value) {
    const key = power.system.group?.value || '';
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(power);
  }
  return [...byGroup.keys()].sort().map(title => ({
    title,
    powerRows: byGroup.get(title),
  }));
});
</script>

<style scoped lang="scss">
  // Sorts and filters, matching the catalog tab's control row.
  .trigger-filters {
    display: flex;
    gap: $padding-md;
    font-family: $font-stack-label;
    font-size: var(--font-size-10);
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed var(--color-border);

    > div {
      flex: 0 auto;

      &.filter-search-triggers {
        flex: 1;

        // Clear widget sits at the input's right edge, inside it.
        .search-trigger-input {
          position: relative;

          input[type="text"] {
            width: 100%;
            padding-right: 1.5em;
          }

          .search-trigger-clear {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            cursor: pointer;
            color: inherit;
            font-size: var(--font-size-12);
            line-height: 1;

            &:hover {
              text-shadow: 0 0 5px var(--v3-hover-glow);
            }
          }
        }
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="text"] {
      font-size: var(--font-size-10);
      font-family: $font-stack-label;
      text-align: left;
      font-weight: normal;
    }

    // The grouping toggle docks to the bottom of the row, level with the
    // controls like the catalog's import button.
    > label.filter-custom-groups {
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
  }

  .trigger-empty {
    margin: 0;
    font-style: italic;
    color: var(--color-text-secondary);
  }
</style>
