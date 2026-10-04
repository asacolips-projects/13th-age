<template>
  <header class="sort-filter-bar">
    <div class="sort-control">
      <label :for="concat(id, '-sort')">{{localize('ARCHMAGE.sort')}}</label>
      <select :name="concat(id, '-sort')" v-model="sort">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{localize(`ARCHMAGE.SORTS.${option.value}`)}}</option>
      </select>
    </div>
    <div class="search-control">
      <label :for="concat(id, '-filter')">{{localize('ARCHMAGE.filter')}}</label>
      <div class="search-input">
        <input type="text" :name="concat(id, '-filter')" v-model="search" :placeholder="localize('ARCHMAGE.filterName')"/>
        <button v-if="search" type="button" class="search-clear" :title="localize('ARCHMAGE.clear')" @click="search = null"><i class="fas fa-times"></i></button>
      </div>
    </div>
    <!-- Extra controls, e.g. a group-by select or the import button. -->
    <slot/>
  </header>
</template>

<script setup>
/**
 * The sort/filter/search control row the listing tabs share: a sort select
 * and a filter input, with a slot for the tab's extra controls (the
 * catalog's group-by select and import button, the triggers tab's grouping
 * toggle). Sort and search are v-models; the search's clear widget is owned
 * here, resetting the model to null.
 */
import { concat, localize } from '@/methods/Helpers';

defineProps({
  // Prefix for the controls' ids and names, e.g. 'plan' -> plan-sort.
  id: { type: String, required: true },
  sortOptions: { type: Array, required: true },
});

const sort = defineModel('sort');
const search = defineModel('search');
</script>

<style scoped lang="scss">
  // The control row, shared by the listing tabs: labels above slim inputs,
  // the search taking the remaining width, extra controls docking to the
  // bottom of the row.
  .sort-filter-bar {
    display: flex;
    gap: $padding-md;
    font-family: $font-stack-label;
    font-size: var(--font-size-10);
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed var(--color-border);

    > div {
      flex: 0 auto;

      &.search-control {
        flex: 1;

        // Clear widget sits at the input's right edge, inside it.
        .search-input {
          position: relative;

          input[type="text"] {
            width: 100%;
            padding-right: 1.5em;
          }

          .search-clear {
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
  }
</style>
