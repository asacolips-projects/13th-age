<template>
  <section class="tab-catalog">
    <!-- Sorts and filters. -->
    <header class="catalog-filters flexrow">
      <div class="group-catalog">
        <label for="catalog-group">{{localize('ARCHMAGE.groupBy')}}</label>
        <select name="catalog-group" v-model="groupBy">
          <option v-for="option in groupOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.GROUPS.', option.value))}}</option>
        </select>
      </div>
      <div class="sort-catalog">
        <label for="catalog-sort">{{localize('ARCHMAGE.sort')}}</label>
        <select name="catalog-sort" v-model="sortBy">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.', option.value))}}</option>
        </select>
      </div>
      <div class="filter-search-catalog">
        <label for="catalog-filter">{{localize('ARCHMAGE.filter')}}</label>
        <input type="text" name="catalog-filter" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
      </div>
    </header>

    <section v-for="group in powerGroups" :key="group.key" class="catalog-group">
      <h2 class="catalog-group-title unit-title">{{ localize(group.labelKey) }}</h2>
      <ul class="catalog-list flexcol">
        <ExpandablePower v-for="power in group.members" :key="power._id" :power="power" :actor="actor" :context="context"/>
      </ul>
    </section>

    <section v-if="equipment.length" class="catalog-group">
      <h2 class="catalog-group-title unit-title">{{ localize('ARCHMAGE.INVENTORY.equipment') }}</h2>
      <ul class="catalog-list flexcol">
        <ExpandableEquipment v-for="item in equipment" :key="item._id" :equipment="item" :actor="actor"/>
      </ul>
    </section>

    <section v-if="loot.length" class="catalog-group">
      <h2 class="catalog-group-title unit-title">{{ localize('ARCHMAGE.INVENTORY.loot') }}</h2>
      <ul class="catalog-list flexcol">
        <ExpandableLoot v-for="item in loot" :key="item._id" :equipment="item" :actor="actor"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { concat, localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/parts/expandable/ExpandableEquipment.vue';
import ExpandableLoot from '@/components/parts/expandable/ExpandableLoot.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Powers are grouped by the selected mode; equipment and loot always keep
// their own sections.
const GROUP_MODES = {
  powerType: 'powerTypes',
  powerUsage: 'powerUsages',
  powerSource: 'powerSources',
};

const groupOptions = [
  { value: 'powerType' },
  { value: 'powerUsage' },
  { value: 'powerSource' },
  { value: 'group' },
];
const sortOptions = [
  { value: 'name' },
  { value: 'level' },
  { value: 'custom' },
];

const groupBy = ref('powerType');
const sortBy = ref('name');
const searchValue = ref(null);

const byName = (a, b) => a.name.localeCompare(b.name);
const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);

const TIER_ORDER = { adventurer: 0, champion: 1, epic: 2 };
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

const byLevel = (a, b) => {
  // Powers sort by level, equipment by tier, loot has no level so it falls
  // back to name.
  if (a.type === 'equipment') return byTier(a, b);
  if (['loot', 'tool'].includes(a.type)) return byName(a, b);
  return Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);
};

const sortFns = { name: byName, level: byLevel, custom: byCustom };

const matchesSearch = (item) => {
  const needle = (searchValue.value ?? '').trim().toLowerCase();
  if (!needle) return true;
  return (item.name ?? '').toLowerCase().includes(needle);
};

const catalogItems = (types) => (props.actor?.items ?? [])
  .filter(i => types.includes(i.type))
  .filter(matchesSearch)
  .sort(sortFns[sortBy.value] ?? byName);

const powers = computed(() => catalogItems(['power']));
const equipment = computed(() => catalogItems(['equipment']));
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const loot = computed(() => catalogItems(['loot', 'tool']));

/**
 * Clean a free-text group name for usage as a group key.
 */
const cleanGroupKey = (string) => string ? string.toLowerCase().replace(/[^a-zA-Z\d]/g, '') : '';

/**
 * Read an item's value for a built-in grouping mode, with fallbacks matching
 * the powers tab.
 */
const groupValue = (item, mode) => {
  let value = item.system?.[mode]?.value || 'other';
  // Override legacy 'maneuver' with 'flexible'.
  return value === 'maneuver' ? 'flexible' : value;
};

/**
 * Non-empty power groups for the current groupBy mode, in display order:
 * canonical config order for built-in modes, first-appearance order for
 * custom groups. Each group is {key, labelKey, members}.
 */
const powerGroups = computed(() => {
  const items = powers.value;
  const configKey = GROUP_MODES[groupBy.value];

  if (configKey) {
    const mode = groupBy.value;
    const groups = [];
    for (const key of Object.keys(CONFIG.ARCHMAGE[configKey])) {
      const members = items.filter(i => groupValue(i, mode) === key);
      if (!members.length) continue;
      // powerType labels are pluralized keys, e.g. ARCHMAGE.talents.
      const labelKey = configKey === 'powerTypes' ? concat('ARCHMAGE.', key, 's') : concat('ARCHMAGE.', key);
      groups.push({ key, labelKey, members });
    }
    return groups;
  }

  // Custom groups come from the item's free-text group field; ungrouped
  // powers collect under the default group.
  const groups = [];
  const byKey = new Map();
  for (const item of items) {
    const raw = item.system?.group?.value;
    const key = raw ? cleanGroupKey(raw) : 'power';
    if (!byKey.has(key)) {
      const group = { key, labelKey: raw || 'ARCHMAGE.power', members: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).members.push(item);
  }
  return groups;
});
</script>

<style scoped lang="scss">
  .catalog-filters {
    font-family: $font-stack-label;
    font-size: $font-tiny;
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed $ct-border;

    > div {
      flex: 0 auto;

      + div {
        padding-left: $padding-sm;
        margin-left: $padding-sm;
      }

      &.filter-search-catalog {
        flex: 1;
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="text"] {
      font-size: $font-tiny;
      font-family: $font-stack-label;
      text-align: left;
      font-weight: normal;
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
  }

  .catalog-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
