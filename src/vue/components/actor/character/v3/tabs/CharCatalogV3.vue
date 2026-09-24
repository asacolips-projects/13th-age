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

    <section v-if="powers.length" class="catalog-group">
      <h2 class="catalog-group-title unit-title">{{ localize('ARCHMAGE.powers') }}</h2>
      <ul class="catalog-list flexcol">
        <ExpandablePower v-for="power in powers" :key="power._id" :power="power" :actor="actor" :context="context"/>
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

// Grouping is handled on a different tab, so this control is display-only.
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
const byLevel = (a, b) => Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);
const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);
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
