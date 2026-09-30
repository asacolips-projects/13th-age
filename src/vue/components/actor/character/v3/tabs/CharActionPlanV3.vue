<template>
  <section class="tab-action-plan">
    <section v-for="group in actionGroups" :key="group.key" class="plan-group"
      :class="groupClasses(group.key)"
      @dragover="onGroupDragOver($event, group.key)"
      @dragleave="onGroupDragLeave($event, group.key)"
      @drop="onGroupDrop($event, group.key)">
      <h4 class="plan-group-title unit-title"
        :draggable="canReorderGroups"
        @dragstart="onGroupDragStart($event, group.key)"
        @dragend="onGroupDragEnd">
        <i v-if="canReorderGroups" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')"></i>
        {{ localize(group.labelKey) }}
      </h4>
      <ul class="plan-list flexcol">
        <ExpandablePower v-for="power in group.powers" :key="power._id" :power="power" :actor="actor" :context="context"/>
        <ExpandableEquipment v-for="item in group.equipment" :key="item._id" :equipment="item" :actor="actor" :context="context"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getActor, localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/actor/character/v3/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Display order for action groups; powers with an unknown action type fall
// into the trailing 'other' group.
const ACTION_ORDER = ['standard', 'move', 'quick', 'free', 'interrupt', 'other'];

const byName = (a, b) => a.name.localeCompare(b.name);

const powers = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'power')
  .sort(byName));

// Only magic items with a power usage set appear here; a usage of none
// (the sheet's unset option) means there's no action to take.
const equipment = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'equipment' && i.system?.powerUsage?.value)
  .sort(byName));

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering persists to the actor flag. The action groups are fixed, so a
// single order array suffices rather than one per grouping mode.
const draggedGroup = ref(null);
const dragOverGroup = ref(null);

// Group reordering is only offered when the sheet is editable and the actor
// isn't a compendium entry (where flags can't be written).
const canReorderGroups = computed(() => props.editable === true && !props.actor?.pack);

const savedGroupOrder = computed(() => {
  const stored = props.actor?.flags?.archmage?.sheetDisplay?.actionPlan?.groupOrder;
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
 * Powers and equipment grouped by action type, in display order: the fixed
 * action order, then the saved group order applied. Equipment counts as a
 * free action. Each group is {key, labelKey, powers, equipment}.
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
  if (!canReorderGroups.value) return;
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
  if (!canReorderGroups.value) return;
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  const actor = await getActor(props.actor);
  await actor?.setFlag('archmage', 'sheetDisplay.actionPlan.groupOrder', order);
};
</script>

<style scoped lang="scss">
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
    font-size: var(--v3-font-size-xxs);
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
