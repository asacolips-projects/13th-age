<template>
  <ExpandableItem :item="equipment" base-class="equipment">
    <template #summary="{toggle}">
      <!-- Clickable loot header. -->
      <EquipmentSummaryRow :equipment="equipment" @toggle="toggle"/>
    </template>
    <!-- Expanded loot content. -->
    <template #content="{active}">
      <Loot v-if="active" :equipment="equipment"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * An expandable loot row for the inventory tab: summary line and the item's
 * full details, with the expand state held by ExpandableItem. Legacy 'tool'
 * items are rendered here too.
 */
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import Loot from '@/components/parts/Loot.vue';
import EquipmentSummaryRow from '@/components/parts/EquipmentSummaryRow.vue';

defineProps({
  equipment: {type: Object, required: true},
});
</script>
