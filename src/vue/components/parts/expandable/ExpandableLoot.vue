<template>
  <ExpandableItem :item="equipment" base-class="equipment">
    <template #summary="{toggle}">
      <!-- Clickable loot header. -->
      <EquipmentSummaryRow :equipment="equipment" @toggle="toggle"
        @edit="editItem(actor, equipment._id)"
        @delete="shiftKey => deleteItem(actor, equipment._id, shiftKey)"
        @change-quantity="increase => changeQuantity(actor, equipment._id, increase)"/>
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
 * items are rendered here too. The row owns its own interactions — editing,
 * deleting and spending uses — resolving the actor document from the actor
 * data the sheet passes down.
 */
import { changeQuantity, deleteItem, editItem } from '@/methods/Helpers';
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import Loot from '@/components/parts/Loot.vue';
import EquipmentSummaryRow from '@/components/parts/EquipmentSummaryRow.vue';

defineProps({
  equipment: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
});
</script>
