<template>
  <ExpandableItem :item="equipment" base-class="equipment">
    <template #summary="{toggle}">
      <!-- Clickable equipment header. -->
      <EquipmentSummaryRow :equipment="equipment" :actor="actor" @toggle="toggle"
        @edit="editItem(actor, equipment._id)"
        @delete="shiftKey => deleteItem(actor, equipment._id, shiftKey)"
        @change-quantity="increase => changeQuantity(actor, equipment._id, increase)"
        @toggle-pip="togglePip(actor, equipment._id)"/>
    </template>
    <!-- Expanded equipment content. -->
    <template #content="{active}">
      <EquipmentDetailsV3 v-if="active" :equipment="equipment" :actor="actor" :context="context"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * An expandable equipment row for the inventory tab: summary line and the
 * item's full details, with the expand state held by ExpandableItem. The row
 * owns its own interactions — editing, deleting, spending uses and toggling
 * the active pip — resolving the actor document from the actor data the sheet
 * passes down.
 */
import { changeQuantity, deleteItem, editItem, togglePip } from '@/methods/Helpers';
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import EquipmentDetailsV3 from '@/components/actor/character/v3/parts/EquipmentDetailsV3.vue';
import EquipmentSummaryRow from '@/components/parts/EquipmentSummaryRow.vue';

defineProps({
  equipment: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  context: {type: Object, default: null},
});
</script>
