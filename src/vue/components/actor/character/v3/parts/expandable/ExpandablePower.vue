<template>
  <ExpandablePowerRow :power="power" :actor="actor" :context="context"
    columns="32px auto 36px 44px 60px 44px 64px">
    <!-- Expanded power details: the V3 read view, with the feats' die icon
         and uses. The shared row's default is the V2 Power, whose rollable
         icons don't style under the V3 sheet root. -->
    <template #details="{active}">
      <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context"/>
    </template>
  </ExpandablePowerRow>
</template>

<script setup>
/**
 * An expandable power row for the powers tab, also used by the catalog and
 * action plan tabs: the standard catalog header — feat pips, action,
 * recharge, uses, controls — expanding to the power's full details. The
 * row's layout, sizing and roll wiring are ExpandablePowerRow's; this
 * instance exists to name the tab's column set.
 */
import ExpandablePowerRow from './ExpandablePowerRow.vue';
import PowerDetailsV3 from '@/components/actor/character/v3/parts/PowerDetailsV3.vue';

defineProps({
  power: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  context: {type: Object, default: null},
});
</script>
