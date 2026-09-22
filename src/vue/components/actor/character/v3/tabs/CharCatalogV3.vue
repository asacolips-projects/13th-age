<template>
  <section class="tab-catalog">
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
import { computed } from 'vue';
import { localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/parts/expandable/ExpandableEquipment.vue';
import ExpandableLoot from '@/components/parts/expandable/ExpandableLoot.vue';

const props = defineProps(['actor', 'editable', 'context']);

const byName = (a, b) => a.name.localeCompare(b.name);

const powers = computed(() => (props.actor?.items ?? []).filter(i => i.type === 'power').sort(byName));
const equipment = computed(() => (props.actor?.items ?? []).filter(i => i.type === 'equipment').sort(byName));
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const loot = computed(() => (props.actor?.items ?? []).filter(i => ['loot', 'tool'].includes(i.type)).sort(byName));
</script>

<style scoped lang="scss">
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

    // The row grids, matching the powers and inventory tabs' columns. The
    // portrait column is what sizes the row images: they flex-shrink to fit
    // it. Cells belong to the expandable row components, hence :deep().
    :deep(.power-grid) {
      // The uses column holds two counters for powers with a secondary usage.
      grid-template-columns: 32px auto 36px 44px 60px 44px 64px;
      gap: 2px;
      font-size: $font-tiny;
      font-family: $font-stack-label;
      text-align: center;

      > * {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      .power-name {
        grid-column-start: 2;
        text-align: left;
        justify-content: flex-start;
      }

      .power-feat-pips { grid-column-start: 3; }
      .power-action { grid-column-start: 4; }
      .power-recharge { grid-column-start: 5; }
      .power-uses { grid-column-start: 6; }
      .item-controls { grid-column-start: 7; }
      .item-control { width: 28px; }
    }

    :deep(.equipment-grid) {
      grid-template-columns: 32px auto 36px 130px 60px 60px 36px 56px;
      gap: 2px;
      font-size: $font-tiny;
      font-family: $font-stack-label;
      text-align: center;

      > * {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      .equipment-name {
        grid-column-start: 2;
        text-align: left;
        justify-content: flex-start;
      }

      .equipment-feat-pips { grid-column-start: 3; }
      .equipment-bonus { grid-column-start: 4; }
      .equipment-chakra { grid-column-start: 5; }
      .equipment-recharge { grid-column-start: 6; }
      .equipment-quantity { grid-column-start: 7; }
      .item-controls { grid-column-start: 8; }
      .item-control { width: 28px; }
    }
  }
</style>
