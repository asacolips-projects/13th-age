<template>
  <ExpandableItem :item="equipment" base-class="equipment">
    <template #summary="{toggle}">
      <!-- Clickable equipment header. -->
      <EquipmentSummaryRow :equipment="equipment" @toggle="toggle"/>
    </template>
    <!-- Expanded equipment content. -->
    <template #content="{active}">
      <Equipment v-if="active" :equipment="equipment" :bonuses="equipmentBonuses(equipment)"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * An expandable equipment row for the inventory tab: summary line and the
 * item's full details, with the expand state held by ExpandableItem.
 */
import { equipmentBonuses } from '@/methods/Helpers';
import ExpandableItem from '@/components/parts/ExpandableItem.vue';
import Equipment from '@/components/parts/Equipment.vue';
import EquipmentSummaryRow from '@/components/parts/EquipmentSummaryRow.vue';

defineProps({
  equipment: {type: Object, required: true},
});
</script>
