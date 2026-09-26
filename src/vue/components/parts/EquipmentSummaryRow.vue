<template>
  <div class="equipment-summary grid equipment-grid equipment">
    <!-- Portrait, which activates the item; .stop keeps the click from also
         reaching the sheet's delegated roll listener. -->
    <RollableV3 :overlay="true" @click.stop="activateItem"><img :src="equipment.img" class="equipment-image"/></RollableV3>
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
 * handled here, since only the listing knows the owning actor. The portrait is
 * the exception: it activates the item directly through the injected actor
 * document.
 */
import { inject } from 'vue';
import { concat, equipmentBonuses, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers';
import Rollable from '@/components/parts/Rollable.vue';
import RollableV3 from '@/components/actor/character/v3/RollableV3.vue';

const props = defineProps({
  equipment: {type: Object, required: true},
});

defineEmits(['toggle', 'edit', 'delete', 'change-quantity', 'toggle-pip']);

// DiceArchmage and the roll methods live on the real document, which the
// listing's context only carries as a prepared clone. The sheet provides the
// document for injection.
const actorDocument = inject('actorDocument', null);

/**
 * Activate the item: its roll() is the same entry point the sheet's delegated
 * roll listener used for the portrait.
 */
function activateItem() {
  actorDocument?.items?.get(props.equipment._id)?.roll();
}
</script>

<style scoped lang="scss">
// The row itself: white text over the equipment colour, links that glow on
// hover. The portrait is RollableV3's overlay mode: the icon fades in over
// the image on hover.
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

  // Equipment portraits show a book rather than the die.
  .rollable::before {
    content: fa-content($fa-var-book);
  }
}

// The row's grid, matching the inventory tab's columns. The typography is
// the shared V3 row tokens, the same ones the power rows standardise.
.equipment-grid {
  grid-template-columns: 32px auto 36px 130px 60px 60px 36px 56px;
  gap: 2px;
  font-size: var(--v3-font-size-title);
  font-family: var(--v3-font-label);
  text-align: center;

  > * {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  // The portrait, kept inside the standard 32px column like the power rows.
  .equipment-image {
    width: 25px;
    height: 25px;
    object-fit: cover;
    border-radius: 0.25rem;
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
  // The same size the power rows' titles read at.
  font-size: var(--v3-font-size-label);
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
