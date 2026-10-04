<template>
  <section class="tab-action-plan">
    <!-- Sorts and filters. -->
    <SortFilterBarV3 id="plan" :sort-options="sortOptions" v-model:sort="sortBy" v-model:search="searchValue"/>

    <section v-for="group in actionGroups" :key="group.key" class="plan-group"
      :class="groupClasses(group.key)"
      @dragover="onGroupDragOver($event, group.key)"
      @dragleave="onGroupDragLeave($event, group.key)"
      @drop="onGroupDrop($event, group.key)">
      <h4 class="plan-group-title unit-title"
        :draggable="canReorderNow"
        @dragstart="onGroupDragStart($event, group.key)"
        @dragend="onGroupDragEnd">
        <i v-if="canReorderNow" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')"></i>
        {{ localize(group.labelKey) }}
      </h4>
      <ul class="plan-list flexcol">
        <ExpandablePower v-for="power in group.powers" :key="power._id" :power="power" :actor="actor" :context="context"
          :class="rowClasses(power._id)"
          @dragstart="onRowDragStart($event, group.key, power._id)"
          @dragover="onRowDragOver($event, group.key, power._id)"
          @dragleave="onRowDragLeave($event, power._id)"
          @drop="onRowDrop($event, group.key, power._id)"
          @dragend="onRowDragEnd"/>
        <ExpandableEquipment v-for="item in group.equipment" :key="item._id" :equipment="item" :actor="actor" :context="context"
          :class="rowClasses(item._id)"
          @dragstart="onRowDragStart($event, group.key, item._id)"
          @dragover="onRowDragOver($event, group.key, item._id)"
          @dragleave="onRowDragLeave($event, item._id)"
          @drop="onRowDrop($event, group.key, item._id)"
          @dragend="onRowDragEnd"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { byLevel, byName, localize, orderedGroups, orderedRows, saveSheetDisplayPref, TIER_ORDER } from '@/methods/Helpers';
import { useGroupReorder } from '@/composables/useGroupReorder';
import { useRowReorder } from '@/composables/useRowReorder';
import { useSearchFilter } from '@/composables/useSearchFilter';
import SortFilterBarV3 from '@/components/actor/character/v3/parts/SortFilterBarV3.vue';
import ExpandablePower from '@/components/actor/character/v3/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Display order for action groups; powers with an unknown action type fall
// into the trailing 'other' group.
const ACTION_ORDER = ['standard', 'move', 'quick', 'free', 'interrupt', 'other'];

// Powers sort by level, equipment by tier.
const byLevelOrTier = (a, b) => a.type === 'equipment'
  ? (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0)
  : byLevel(a, b);

const sortFns = { name: byName, level: byLevelOrTier };

// Sorts and filters, laid out like the catalog tab. 'custom' keeps the
// saved drag order; the other modes ignore it.
const sortOptions = [{ value: 'name' }, { value: 'level' }, { value: 'custom' }];
const sortBy = ref(props.actor?.flags?.archmage?.sheetDisplay?.actionPlan?.sortBy?.value ?? 'custom');

// Searchable text for a row: its name plus the description the expanded row
// shows.
const { searchValue, matchesSearch } = useSearchFilter(
  item => `${item.name ?? ''}${item.system?.description?.value ?? ''}`
);

const powers = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'power')
  .filter(matchesSearch)
  .sort(byName));

// Only magic items with a power usage set appear here; a usage of none
// (the sheet's unset option) means there's no action to take.
const equipment = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'equipment' && i.system?.powerUsage?.value)
  .filter(matchesSearch)
  .sort(byName));

// Reordering (groups and rows alike) is only offered when the sheet is
// editable and the actor isn't a compendium entry (where flags can't be
// written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

// Reordering pauses while a text filter hides rows: a drop on the filtered
// view would rebuild the saved order from a partial list.
const canReorderNow = computed(() => canReorder.value && !searchValue.value);

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists to the actor flag. The action groups are fixed, so a
// single order array suffices rather than one per grouping mode.
const {
  savedGroupOrder,
  groupClasses, onGroupDragStart, onGroupDragOver, onGroupDragLeave, onGroupDrop, onGroupDragEnd,
} = useGroupReorder({
  actor: () => props.actor,
  canReorder,
  canStart: canReorderNow,
  flagPath: 'sheetDisplay.actionPlan.groupOrder',
  getSections: () => actionGroups.value,
  classPrefix: 'plan-group',
});

watch(sortBy, value => {
  if (!canReorder.value) return;
  saveSheetDisplayPref(props.actor, 'sheetDisplay.actionPlan.sortBy.value', value);
});

// Row reordering within a group. The rows are the same draggable item rows
// the sheet wires up for item drags, so their dragstart is left alone —
// arming the item payload lets a drag out of the tab (to the hotbar, canvas
// or another sheet) behave as usual — and only the drop is intercepted here.
// The order persists to this tab's own flag: the catalog's custom order lives
// in the items' sort values, shared with the v2 sheet, and must not move
// because the action plan was tidied.
const {
  savedRowOrder,
  rowClasses, onRowDragStart, onRowDragOver, onRowDragLeave, onRowDrop, onRowDragEnd,
} = useRowReorder({
  actor: () => props.actor,
  canReorder,
  canStart: canReorderNow,
  flagPath: 'sheetDisplay.actionPlan.rowOrder',
  getRows: groupKey => {
    const group = actionGroups.value.find(group => group.key === groupKey);
    return group ? [...group.powers, ...group.equipment] : [];
  },
});

/**
 * Apply the display sort to a group's rows: 'custom' is the saved row order
 * (name order for rows it doesn't know), the other modes ignore it.
 */
const sortedRows = (rows) => sortBy.value === 'custom'
  ? orderedRows(rows, savedRowOrder.value, byName)
  : [...rows].sort(sortFns[sortBy.value] ?? byName);

/**
 * Powers and equipment grouped by action type, in display order: the fixed
 * action order, then the saved group order applied, each group's rows in the
 * display sort. Equipment counts as a free action. Each group is
 * {key, labelKey, powers, equipment}.
 */
const actionGroups = computed(() => {
  const byAction = new Map();
  for (const action of ACTION_ORDER) {
    byAction.set(action, { key: action, labelKey: `ARCHMAGE.${action}`, powers: [], equipment: [] });
  }
  for (const power of powers.value) {
    const action = power.system?.actionType?.value;
    const key = ACTION_ORDER.includes(action) ? action : 'other';
    byAction.get(key).powers.push(power);
  }
  for (const item of equipment.value) {
    byAction.get('free').equipment.push(item);
  }
  for (const group of byAction.values()) {
    group.powers = sortedRows(group.powers);
    group.equipment = sortedRows(group.equipment);
  }
  const groups = ACTION_ORDER
    .map(key => byAction.get(key))
    .filter(group => group.powers.length || group.equipment.length);
  return orderedGroups(groups, savedGroupOrder.value);
});
</script>

<style scoped lang="scss">
  @import 'v3/drag-reorder';

  .plan-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .plan-group-title {
    margin: 0 0 0.25rem;

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

  .plan-group--dragging {
    opacity: 0.5;
  }

  .plan-group--drop-target > .plan-group-title {
    outline: 2px dashed;
    outline-offset: 2px;
    margin-left: 4px;
  }

  .plan-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
