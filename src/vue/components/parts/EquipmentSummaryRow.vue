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
        <li :class="concat('feat-pip', (equipment.system.isActive ? ' active' : ''))" :data-item-id="equipment._id" @click="$emit('toggle-pip')"><div class="hide">{{equipment.system.isActive}}</div></li>
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
    <div class="equipment-quantity" :data-item-id="equipment._id" :data-quantity="equipment.system.quantity.value"
      @click="$emit('change-quantity', true)" @contextmenu.prevent="$emit('change-quantity', false)"><span>{{equipment.system.quantity.value}}</span></div>
    <div class="item-controls">
      <a class="item-control item-edit" :data-item-id="equipment._id" @click.stop="$emit('edit')"><i class="fas fa-edit"></i></a>
      <a class="item-control item-delete" :data-item-id="equipment._id" @click.stop="$emit('delete', $event.shiftKey)"><i class="fas fa-trash"></i></a>
    </div>
  </div>
</template>

<script setup>
/**
 * One row of an equipment listing: its portrait, its name and whichever
 * summary cells the item has data for. Loot rows share this markup; only the
 * active pip is exclusive to equipment items.
 *
 * Interactions are reported to the listing that renders the row — expanding,
 * editing, deleting, spending uses and toggling the active pip — rather than
 * handled here, since only the listing knows the owning actor.
 */
import { concat, equipmentBonuses, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers';
import Rollable from '@/components/parts/Rollable.vue';

defineProps({
  equipment: {type: Object, required: true},
});

defineEmits(['toggle', 'edit', 'delete', 'change-quantity', 'toggle-pip']);
</script>

<style scoped lang="scss">
// The row itself: white text over the equipment colour, links that glow on
// hover, and a portrait that fades out to the roll icon beneath it.
.equipment-summary {
  color: $c-white;
  text-shadow: 0 0 10px $c-black--50;
  margin: 0 0 1px 0;
  background: $c-power-equipment;

  .rollable,
  a {
    color: $c-white;

    &:hover {
      color: $c-white;
      text-shadow: 0 0 10px $c-white;
    }

    &::before {
      color: $c-white;
    }
  }

  .rollable--item {
    position: relative;

    &::before {
      content: fa-content($fa-var-book);
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      margin: auto;
      line-height: 1;
      font-size: $font-lg;
      width: $font-lg;
      height: $font-lg;
      display: block;
      opacity: 0;
      transition: all ease-in-out 0.25s;
    }

    img {
      transition: all ease-in-out 0.25s;
    }

    &:hover {
      &::before {
        opacity: 1;
      }

      img {
        opacity: 0;
      }
    }
  }
}

// The name cell: its typography and the way the trailing cells dim while the
// name is hovered. The trailing cells are the row's own summary slot content,
// hence :deep().
.equipment-name {
  font-size: $font-xs;
  font-family: $font-stack-secondary;
  overflow: hidden;
  padding-left: $padding-sm;
  text-align: left;
  justify-content: flex-start;

  &:hover {
    ~ :deep(.equipment-feat-pips),
    ~ :deep(.equipment-action) {
      opacity: 0.25;
    }

    .equipment-title {
      position: absolute;
      overflow: visible;
      padding-right: $padding-md;
      z-index: 10;
    }
  }
}

.equipment-title {
  margin: 0;
  border: 0;
  text-align: left;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: $font-xs;
}

.equipment-bonus {
  align-items: stretch;
}

.equipment-chakra {
  text-transform: uppercase;
}

.bonus {
  background: $c-black--25;
  border-radius: $padding-sm;
  margin: 4px 2px;
  font-size: $font-tiny;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bonus-label {
  text-transform: uppercase;
  margin-right: 2px;
}

// Left-click spends a use, right-click restores one.
.equipment-quantity {
  cursor: pointer;
}

.feat-pip {
  cursor: pointer;
}

.item-control {
  cursor: pointer;
}
</style>
