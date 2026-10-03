<template>
  <div class="power-feat-pips" :data-tooltip="localize('ARCHMAGE.feats')">
    <ul class="feat-pips">
      <li v-for="(feat, tier) in filterFeats(feats)" :key="tier"
        :class="`feat-pip${feat.isActive?.value ? ' active' : ''}`"
        :data-item-id="itemId" :data-tier="tier"><div class="hide">{{tier}}</div></li>
    </ul>
  </div>
</template>

<script setup>
/**
 * The row of pips standing for a power's feats, one per feat with text.
 *
 * A filled pip means the feat has been taken. Listings of powers nobody owns
 * yet therefore show them all hollow, which is the truth: the power has feats
 * and none of them are active.
 */
import { filterFeats, localize } from '@/methods/Helpers';

defineProps({
  feats: {type: Object, default: null},
  // Powers on an actor toggle their feats by clicking a pip.
  itemId: {type: String, default: null},
});
</script>
