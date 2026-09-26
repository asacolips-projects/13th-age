<template>
  <ExpandableItem :item="power" :base-class="baseClass">
    <template #summary="{active, toggle}">
      <!-- Clickable power header, laid out on the columns this listing passes in. -->
      <PowerSummaryRow :power="power" :actor="actor" :active="active" :trigger="trigger"
        :style="{ gridTemplateColumns: columns }" @toggle="toggle">
        <!-- The header cells after the name, defaulting to the catalog row's
             feat pips, action, recharge, uses and controls. -->
        <slot name="cells" :toggle="toggle">
          <PowerFeatPips v-if="hasFeats(power)" :feats="power.system.feats" :item-id="power._id" @toggle-pip="tier => togglePip(actor, power._id, tier)"/>
          <div class="power-action" v-if="power.system.actionType.value">{{getActionShort(power.system.actionType.value)}}</div>
          <div class="power-recharge" v-if="power.system.recharge.value && ['recharge', 'recharge-desperate'].includes(power.system.powerUsage.value)">
            <Rollable name="recharge" type="recharge" :opt="power._id">{{Number(power.system.recharge.value) || 16}}+</Rollable>
          </div>
          <div class="power-uses">
            <span v-if="power.system.quantity.value !== null" class="power-uses-primary" :data-item-id="power._id" :data-quantity="power.system.quantity.value"
              @click.stop="changeQuantity(actor, power._id)" @contextmenu.stop.prevent="changeQuantity(actor, power._id, false)">{{power.system.quantity.value}}</span>
            <template v-if="hasSecondaryUsage(power)">
              <span v-if="power.system.quantity.value !== null" class="power-uses-separator">-</span>
              <span class="power-uses-secondary" :data-item-id="power._id" :data-quantity="power.system.quantitySecondary.value"
                @click.stop="changeQuantity(actor, power._id, true, true)" @contextmenu.stop.prevent="changeQuantity(actor, power._id, false, true)">{{power.system.quantitySecondary.value}}</span>
            </template>
          </div>
          <div class="item-controls">
            <a class="item-control item-edit" :data-item-id="power._id" @click.stop="editItem(actor, power._id)"><i class="fas fa-edit"></i></a>
            <a class="item-control item-delete" :data-item-id="power._id" @click.stop="deleteItem(actor, power._id, $event.shiftKey)"><i class="fas fa-trash"></i></a>
          </div>
        </slot>
      </PowerSummaryRow>
    </template>
    <!-- Expanded power details, defaulting to the full item view. -->
    <template #content="{active}">
      <slot name="details" :active="active">
        <Power v-if="active" :power="power" :actor="actor" :context="context"/>
      </slot>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * The common power-row anatomy behind the listings that share it: an
 * ExpandableItem whose summary is a PowerSummaryRow — portrait, name, then
 * the header cells — and whose expanded body is the power's details.
 *
 * Everything about the row's layout, sizing and roll wiring is standardised
 * here. A listing differs only in the columns its header shows: those come
 * in through `columns`, the cells through the `cells` slot (defaulting to
 * the catalog row's) and the expanded body through the `details` slot
 * (defaulting to the full item view).
 */
import { changeQuantity, deleteItem, editItem, getActionShort, hasFeats, hasSecondaryUsage, togglePip } from '@/methods/Helpers';
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import Power from '@/components/parts/Power.vue';
import PowerFeatPips from '@/components/parts/PowerFeatPips.vue';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';
import Rollable from '@/components/parts/Rollable.vue';

defineProps({
  power: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  context: {type: Object, default: null},
  // Names the item kind for ExpandableItem's wrapper classes.
  baseClass: {type: String, default: 'power'},
  // The header's grid-template-columns, the one thing that differs between
  // listings.
  columns: {type: String, required: true},
  // Whether the trigger reads as a hover tooltip; listings that give the
  // trigger a cell of its own turn this off.
  trigger: {type: Boolean, default: true},
});
</script>

<style scoped lang="scss">
// The summary row's shared grid: typography, the cell centring, the
// portrait's size and the standard cells' column assignments. The column
// template itself arrives inline from the `columns` prop, since that is what
// differs between listings. The grid class and the portrait and name cells
// are PowerSummaryRow's, hence :deep() there; the other cells are slotted,
// from here or the caller, and carry the scope that defined them.
.power-grid {
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

  :deep(.power-name) {
    grid-column-start: 2;
    text-align: left;
    justify-content: flex-start;
  }

  // The portrait, kept inside the standard 32px column.
  :deep(.power-image) {
    width: 25px;
    height: 25px;
    object-fit: cover;
    border-radius: 0.25rem;
  }

  .power-feat-pips { grid-column-start: 3; }
  .power-action { grid-column-start: 4; }
  .power-recharge { grid-column-start: 5; }
  .power-uses { grid-column-start: 6; }
  .item-controls { grid-column-start: 7; }
  .item-control { width: 28px; }
}

// The uses column holds one counter per pool, separated by a dash.
.power-uses {
  gap: 1px;

  .power-uses-separator {
    opacity: 0.6;
  }
}

// Left-click spends a use, right-click restores one.
.power-uses-primary,
.power-uses-secondary {
  cursor: pointer;
}

.item-control {
  cursor: pointer;
}
</style>
