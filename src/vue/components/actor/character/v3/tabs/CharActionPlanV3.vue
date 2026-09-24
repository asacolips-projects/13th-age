<template>
  <section class="tab-action-plan">
    <section v-for="group in actionGroups" :key="group.key" class="plan-group">
      <h4 class="plan-group-title unit-title">{{ localize(group.labelKey) }}</h4>
      <ul class="plan-list flexcol">
        <ExpandablePower v-for="power in group.powers" :key="power._id" :power="power" :actor="actor" :context="context"/>
        <ExpandableEquipment v-for="item in group.equipment" :key="item._id" :equipment="item" :actor="actor"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/parts/expandable/ExpandableEquipment.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Display order for action groups; powers with an unknown action type fall
// into the trailing 'other' group.
const ACTION_ORDER = ['standard', 'quick', 'move', 'free', 'interrupt', 'other'];

const byName = (a, b) => a.name.localeCompare(b.name);

const powers = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'power')
  .sort(byName));

const equipment = computed(() => (props.actor?.items ?? [])
  .filter(i => i.type === 'equipment')
  .sort(byName));

/**
 * Powers and equipment grouped by action type, in display order. Equipment
 * counts as a free action. Each group is {key, labelKey, powers, equipment}.
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
  return ACTION_ORDER
    .map(key => byAction.get(key))
    .filter(group => group.powers.length || group.equipment.length);
});
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
  }

  .plan-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
