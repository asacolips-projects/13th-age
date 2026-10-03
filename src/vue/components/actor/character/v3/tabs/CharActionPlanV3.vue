<template>
  <section class="tab-action-plan">
    <!-- Sorts and filters. -->
    <header class="plan-filters flexrow">
      <div class="sort-plan">
        <label for="plan-sort">{{localize('ARCHMAGE.sort')}}</label>
        <select name="plan-sort" v-model="sortBy">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.', option.value))}}</option>
        </select>
      </div>
      <div class="filter-search-plan">
        <label for="plan-filter">{{localize('ARCHMAGE.filter')}}</label>
        <div class="search-plan-input">
          <input type="text" name="plan-filter" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
          <button v-if="searchValue" type="button" class="search-plan-clear" :title="localize('ARCHMAGE.clear')" @click="clearSearch"><i class="fas fa-times"></i></button>
        </div>
      </div>
    </header>

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
          @drop="onRowDrop($event, group, power._id)"
          @dragend="onRowDragEnd"/>
        <ExpandableEquipment v-for="item in group.equipment" :key="item._id" :equipment="item" :actor="actor" :context="context"
          :class="rowClasses(item._id)"
          @dragstart="onRowDragStart($event, group.key, item._id)"
          @dragover="onRowDragOver($event, group.key, item._id)"
          @dragleave="onRowDragLeave($event, item._id)"
          @drop="onRowDrop($event, group, item._id)"
          @dragend="onRowDragEnd"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { concat, getActor, localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/actor/character/v3/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Display order for action groups; powers with an unknown action type fall
// into the trailing 'other' group.
const ACTION_ORDER = ['standard', 'move', 'quick', 'free', 'interrupt', 'other'];

const byName = (a, b) => a.name.localeCompare(b.name);

const TIER_ORDER = { adventurer: 0, champion: 1, epic: 2 };
const byLevel = (a, b) => {
  // Powers sort by level, equipment by tier.
  if (a.type === 'equipment') return (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);
  return Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);
};

const sortFns = { name: byName, level: byLevel };

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

// Sorts and filters, laid out like the catalog tab. 'custom' keeps the
// saved drag order; the other modes ignore it.
const sortOptions = [{ value: 'name' }, { value: 'level' }, { value: 'custom' }];
const sortBy = ref(props.actor?.flags?.archmage?.sheetDisplay?.actionPlan?.sortBy?.value ?? 'custom');
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

// Searchable text for a row: its name plus the description the expanded row
// shows.
const matchesSearch = (item) => {
  const needle = cleanFilterKey(searchValue.value ?? '');
  if (!needle) return true;
  const haystack = stripHtml(`${item.name ?? ''}${item.system?.description?.value ?? ''}`);
  return cleanFilterKey(haystack).includes(needle);
};

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists to the actor flag. The action groups are fixed, so a
// single order array suffices rather than one per grouping mode.
const draggedGroup = ref(null);
const dragOverGroup = ref(null);

// Reordering (groups and rows alike) is only offered when the sheet is
// editable and the actor isn't a compendium entry (where flags can't be
// written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

// Reordering pauses while a text filter hides rows: a drop on the filtered
// view would rebuild the saved order from a partial list.
const canReorderNow = computed(() => canReorder.value && !searchValue.value);

// Persist display preference changes through the live actor document;
// props.actor is a data clone whose flag updates wouldn't round-trip. Writing
// only when the stored value differs avoids a re-render loop from the update.
const saveDisplayPref = async (path, value) => {
  if (!canReorder.value) return;
  const actor = await getActor(props.actor);
  const current = foundry.utils.getProperty(props.actor?.flags?.archmage?.sheetDisplay?.actionPlan ?? {}, path);
  if (actor && current !== value) {
    await actor.setFlag('archmage', `sheetDisplay.actionPlan.${path}`, value);
  }
};

watch(sortBy, value => saveDisplayPref('sortBy.value', value));

const savedGroupOrder = computed(() => {
  const stored = props.actor?.flags?.archmage?.sheetDisplay?.actionPlan?.groupOrder;
  return Array.isArray(stored) ? stored : [];
});

// Row reordering within a group. The rows are the same draggable item rows
// the sheet wires up for item drags, so their dragstart is left alone —
// arming the item payload lets a drag out of the tab (to the hotbar, canvas
// or another sheet) behave as usual — and only the drop is intercepted here.
// The order persists to this tab's own flag: the catalog's custom order lives
// in the items' sort values, shared with the v2 sheet, and must not move
// because the action plan was tidied.
const draggedRow = ref(null);
const draggedRowGroup = ref(null);
const dragOverRow = ref(null);
const dropAfter = ref(false);

const savedRowOrder = computed(() => {
  const stored = props.actor?.flags?.archmage?.sheetDisplay?.actionPlan?.rowOrder;
  return Array.isArray(stored) ? stored : [];
});

/**
 * Apply the saved group order to a list of groups, with any group the saved
 * order doesn't know about appended in its natural spot.
 */
const orderedGroups = (groups) => {
  const order = savedGroupOrder.value;
  if (!order.length) return groups;
  const byKey = new Map(groups.map(g => [g.key, g]));
  return order.filter(key => byKey.has(key)).map(key => byKey.get(key))
    .concat(groups.filter(g => !order.includes(g.key)));
};

/**
 * Apply the saved row order to a group's rows; rows the saved order doesn't
 * know about (new items) append in name order.
 */
const orderedRows = (rows) => {
  const positions = new Map(savedRowOrder.value.map((id, index) => [id, index]));
  if (!positions.size) return rows;
  return [...rows].sort((a, b) => {
    const ai = positions.get(a._id);
    const bi = positions.get(b._id);
    if (ai === undefined && bi === undefined) return byName(a, b);
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
};

/**
 * Apply the display sort to a group's rows: 'custom' is the saved row order
 * (name order for rows it doesn't know), the other modes ignore it.
 */
const sortedRows = (rows) => sortBy.value === 'custom'
  ? orderedRows(rows)
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
  return orderedGroups(groups);
});

/**
 * Classes for a group section, including drag feedback.
 */
const groupClasses = (groupKey) => ({
  'plan-group--dragging': draggedGroup.value === groupKey,
  'plan-group--drop-target': dragOverGroup.value === groupKey,
});

const onGroupDragStart = (event, groupKey) => {
  if (!canReorderNow.value) return;
  draggedGroup.value = groupKey;
  event.dataTransfer.effectAllowed = 'move';
  // Tag the payload so nothing downstream mistakes this for an item drag.
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'ArchmagePowerGroup',
    groupKey
  }));
  // Don't let the sheet's item drag handling see this.
  event.stopPropagation();
};

const onGroupDragOver = (event, groupKey) => {
  if (!draggedGroup.value) return;
  event.preventDefault();
  event.stopPropagation();
  dragOverGroup.value = groupKey === draggedGroup.value ? null : groupKey;
};

const onGroupDragLeave = (event, groupKey) => {
  if (dragOverGroup.value !== groupKey) return;
  // dragleave also fires when moving between children of the section, so
  // only clear the highlight once the cursor has actually left it.
  if (event.currentTarget.contains(event.relatedTarget)) return;
  dragOverGroup.value = null;
};

const onGroupDrop = async (event, groupKey) => {
  if (!draggedGroup.value) return;
  // A group is being reordered, so keep this away from item sorting.
  event.preventDefault();
  event.stopPropagation();

  const source = draggedGroup.value;
  draggedGroup.value = null;
  dragOverGroup.value = null;
  if (source === groupKey) return;

  // Rebuild the full order from what's currently displayed, dropping above
  // or below the target based on where the cursor was released.
  const order = actionGroups.value.map(g => g.key).filter(key => key !== source);
  const index = order.indexOf(groupKey);
  if (index < 0) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const before = (event.clientY - rect.top) < (rect.height / 2);
  order.splice(before ? index : index + 1, 0, source);

  await saveGroupOrder(order);
};

const onGroupDragEnd = () => {
  draggedGroup.value = null;
  dragOverGroup.value = null;
};

const saveGroupOrder = async (order) => {
  if (!canReorder.value) return;
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  const actor = await getActor(props.actor);
  await actor?.setFlag('archmage', 'sheetDisplay.actionPlan.groupOrder', order);
};

/**
 * Classes for an item row, including drag feedback.
 */
const rowClasses = (rowId) => ({
  'plan-row--dragging': draggedRow.value === rowId,
  'plan-row--drop-above': dragOverRow.value === rowId && !dropAfter.value,
  'plan-row--drop-below': dragOverRow.value === rowId && dropAfter.value,
});

const onRowDragStart = (event, groupKey, rowId) => {
  if (!canReorderNow.value) return;
  draggedRow.value = rowId;
  draggedRowGroup.value = groupKey;
  // Deliberately no stopPropagation: the sheet's dragstart still arms the
  // item payload, so dropping the row outside this tab sorts or drags as
  // usual. Only the drop below keeps the two apart.
};

const onRowDragOver = (event, groupKey, rowId) => {
  if (!draggedRow.value) return;
  // A row drag stays ours end to end: keep it away from the sheet's item
  // sorting even over another group's rows, where the drop would be a no-op.
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  if (draggedRowGroup.value !== groupKey || rowId === draggedRow.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  dropAfter.value = (event.clientY - rect.top) >= (rect.height / 2);
  dragOverRow.value = rowId;
};

const onRowDragLeave = (event, rowId) => {
  if (dragOverRow.value !== rowId) return;
  // dragleave also fires when moving between the row's children, so only
  // clear the indicator once the cursor has actually left the row.
  if (event.currentTarget.contains(event.relatedTarget)) return;
  dragOverRow.value = null;
};

const onRowDrop = async (event, group, targetId) => {
  if (!draggedRow.value) return;
  // A row is being reordered, so keep this away from item sorting.
  event.preventDefault();
  event.stopPropagation();

  const sourceId = draggedRow.value;
  const sourceGroup = draggedRowGroup.value;
  const after = dropAfter.value;
  clearRowDrag();
  // Cross-group drops do nothing: which group a row belongs to follows the
  // item's action type, which this tab doesn't edit.
  if (sourceGroup !== group.key || sourceId === targetId) return;

  // Rebuild this group's order from what's currently displayed, inserting
  // above or below the target based on where the cursor was released.
  const rows = [...group.powers, ...group.equipment].map(row => row._id);
  const order = rows.filter(id => id !== sourceId);
  const index = order.indexOf(targetId);
  if (index < 0) return;
  order.splice(after ? index + 1 : index, 0, sourceId);

  // Keep every other group's entries (pruning deleted items) and append this
  // group's slice: position within the flat array only matters relative to
  // an item's own group, since the order is applied per group.
  const groupIds = new Set(rows);
  const itemIds = new Set((props.actor?.items ?? []).map(item => item._id));
  const rest = savedRowOrder.value.filter(id => !groupIds.has(id) && itemIds.has(id));
  await saveRowOrder([...rest, ...order]);
};

const onRowDragEnd = () => clearRowDrag();

const clearRowDrag = () => {
  draggedRow.value = null;
  draggedRowGroup.value = null;
  dragOverRow.value = null;
  dropAfter.value = false;
};

const saveRowOrder = async (order) => {
  if (!canReorder.value) return;
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  const actor = await getActor(props.actor);
  await actor?.setFlag('archmage', 'sheetDisplay.actionPlan.rowOrder', order);
};
</script>

<style scoped lang="scss">
  .plan-filters {
    font-family: $font-stack-label;
    font-size: var(--font-size-10);
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed var(--color-border);

    > div {
      flex: 0 auto;

      + div {
        padding-left: $padding-sm;
        margin-left: $padding-sm;
      }

      &.filter-search-plan {
        flex: 1;

        // Clear widget sits at the input's right edge, inside it.
        .search-plan-input {
          position: relative;

          input[type="text"] {
            width: 100%;
            padding-right: 1.5em;
          }

          .search-plan-clear {
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

  // Row reordering feedback: the dragged row dims, the hovered row shows an
  // insertion edge on the side the drop would land.
  .plan-row--dragging {
    opacity: 0.5;
  }

  .plan-row--drop-above {
    box-shadow: inset 0 2px 0 var(--color-border);
  }

  .plan-row--drop-below {
    box-shadow: inset 0 -2px 0 var(--color-border);
  }

  .plan-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
