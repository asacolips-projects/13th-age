<template>
  <ExpandablePowerRow :power="power" :actor="actor" :context="context" base-class="trigger"
    :trigger="false" columns="32px minmax(6rem, 10rem) minmax(0, 1fr)">
    <!-- Standard power row: the portrait, the name, then the trigger text
         where the catalog rows carry their feats, uses and controls. -->
    <template #cells="{toggle}">
      <!-- Clicking the trigger text expands the row, like the name. -->
      <a class="trigger-text" @click="toggle">{{ power.system.trigger.value }}</a>
    </template>
    <!-- Expanded power details. -->
    <template #details="{active}">
      <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context"/>
    </template>
  </ExpandablePowerRow>
</template>

<script setup>
/**
 * One row of the triggers tab, on the shared ExpandablePowerRow anatomy:
 * the power's portrait (which activates it), its name, then the trigger
 * text in its own column where the catalog rows carry their feats, uses
 * and controls. The expand state belongs to ExpandableItem, keyed to the
 * power by the caller's v-for key.
 */
import ExpandablePowerRow from '@/components/parts/expandable/ExpandablePowerRow.vue';
import PowerDetailsV3 from './PowerDetailsV3.vue';

defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});
</script>

<style scoped lang="scss">
  // The trigger cell, read as one aligned field across the rows. The row's
  // grid, typography and chrome are ExpandablePowerRow's; only this trailing
  // cell is the tab's own.
  .trigger-text {
    justify-content: flex-start;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
