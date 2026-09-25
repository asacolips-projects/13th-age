<template>
  <ExpandableItem :item="power" base-class="trigger">
    <template #summary="{active, toggle}">
      <!-- Standard power row: the portrait, the name, then the trigger text
           where the catalog rows carry their feats, uses and controls. -->
      <PowerSummaryRow :power="power" :actor="actor" :active="active" :trigger="false" @toggle="toggle">
        <!-- Clicking the trigger text expands the row, like the name. -->
        <a class="trigger-text" @click="toggle">{{ power.system.trigger.value }}</a>
      </PowerSummaryRow>
    </template>
    <!-- Expanded power details. -->
    <template #content="{active}">
      <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * One row of the triggers tab, on the same PowerSummaryRow anatomy as the
 * catalog and action plan rows: the power's portrait (which activates it),
 * its name, then the trigger text in its own column. The expand state
 * belongs to ExpandableItem, keyed to the power by the caller's v-for key.
 */
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import PowerDetailsV3 from './PowerDetailsV3.vue';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';

defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});
</script>

<style scoped lang="scss">
  // The row's grid: the catalog rows' leading cells — portrait, then name —
  // with the trigger text filling the rest, so the column reads as one
  // aligned field. The name cell's typography, its hover behaviour and the
  // row's chrome are PowerSummaryRow's .power-grid rules; the trailing cell
  // is slotted from here, hence the mix of :deep() and plain selectors.
  .power-grid {
    grid-template-columns: 32px minmax(6rem, 10rem) minmax(0, 1fr);
    gap: 2px;
    font-size: var(--v3-font-size-title);
    font-family: var(--v3-font-label);
    text-align: center;

    > :deep(*) {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    .trigger-text {
      justify-content: flex-start;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    // The portrait, kept at the size settled for this tab inside the
    // standard 32px column.
    :deep(.power-image) {
      width: 25px;
      height: 25px;
      object-fit: cover;
      border-radius: 0.25rem;
    }
  }
</style>
