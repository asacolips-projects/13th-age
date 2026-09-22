<template>
  <div class="equipment-summary grid equipment-grid equipment">
    <!-- Portrait, which rolls the item. -->
    <Rollable name="item" :hide-icon="true" type="item" :opt="equipment._id"><img :src="equipment.img" class="equipment-image"/></Rollable>
    <!-- Name, which expands the item. -->
    <a class="equipment-name" @click="$emit('toggle')" :data-item-id="equipment._id">
      <h3 class="equipment-title unit-subtitle">{{equipment.name}}</h3>
    </a>
    <!-- Active pip, equipment only. -->
    <div class="equipment-feat-pips" v-if="equipment.type === 'equipment'">
      <ul class="feat-pips">
        <li :class="concat('feat-pip', (equipment.system.isActive ? ' active' : ''))" :data-item-id="equipment._id"><div class="hide">{{equipment.system.isActive}}</div></li>
      </ul>
    </div>
    <div class="equipment-bonus flexrow" v-if="equipment.system.attributes">
      <span class="bonus" v-for="(bonus, bonusProp) in equipmentBonuses(equipment)" :key="bonusProp">
        <span class="bonus-label">{{localizeEquipmentBonus(bonusProp)}} </span>
        <span class="bonus-value">{{numberFormat(bonus, 0, true)}}</span>
      </span>
    </div>
    <div class="equipment-chakra" v-if="equipment.system.chackra">{{localize(concat('ARCHMAGE.CHAKRA.', equipment.system.chackra, "Label"))}}</div>
    <div class="equipment-recharge" v-if="equipment.system.recharge && equipment.system.recharge.value && equipment.system.powerUsage.value == 'recharge'">
      <Rollable name="recharge" type="recharge" :opt="equipment._id">{{Number(equipment.system.recharge.value) || 16}}+</Rollable>
    </div>
    <div class="equipment-quantity" :data-item-id="equipment._id" :data-quantity="equipment.system.quantity.value"><span>{{equipment.system.quantity.value}}</span></div>
    <div class="item-controls">
      <a class="item-control item-edit" :data-item-id="equipment._id"><i class="fas fa-edit"></i></a>
      <a class="item-control item-delete" :data-item-id="equipment._id"><i class="fas fa-trash"></i></a>
    </div>
  </div>
</template>

<script setup>
/**
 * One row of an equipment listing: its portrait, its name and whichever
 * summary cells the item has data for. Loot rows share this markup; only the
 * active pip is exclusive to equipment items.
 */
import { concat, equipmentBonuses, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers';
import Rollable from '@/components/parts/Rollable.vue';

defineProps({
  equipment: {type: Object, required: true},
});

defineEmits(['toggle']);
</script>
