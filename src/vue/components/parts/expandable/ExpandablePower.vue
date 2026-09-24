<template>
  <ExpandableItem :item="power" base-class="power">
    <template #summary="{active, toggle}">
      <!-- Clickable power header. -->
      <PowerSummaryRow :power="power" :actor="actor" :active="active" @toggle="toggle">
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
      </PowerSummaryRow>
    </template>
    <!-- Expanded power content. -->
    <template #content="{active}">
      <Power v-if="active" :power="power" :actor="actor" :context="context"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * An expandable power row for the powers tab: summary line and the power's
 * full details, with the expand state held by ExpandableItem. The row owns
 * its own interactions — editing, deleting, spending uses and taking feats —
 * resolving the actor document from the actor data the sheet passes down.
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
});
</script>

<style scoped lang="scss">
// The summary row's grid: the same columns as the powers tab's rows. The
// grid class and the portrait and name cells are PowerSummaryRow's, hence
// :deep() there; the other cells are slotted from this component's template.
.power-grid {
  // The uses column holds two counters for powers with a secondary usage.
  grid-template-columns: 32px auto 36px 44px 60px 44px 64px;
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
