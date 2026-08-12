<template>
  <div class="power-feat-pips" :data-tooltip="localize('ARCHMAGE.feats')">
    <ul class="feat-pips">
      <li v-for="(feat, tier) in filterFeats(feats)" :key="tier"
        :class="`feat-pip${allActive || feat.isActive.value ? ' active' : ''}`"
        :data-item-id="itemId" :data-tier="tier"><div class="hide">{{tier}}</div></li>
    </ul>
  </div>
</template>

<script setup>
/**
 * The row of pips standing for a power's feats, one per feat with text.
 */
import { filterFeats, localize } from '@/methods/Helpers';

defineProps({
  feats: {type: Object, default: null},
  // Powers on an actor toggle their feats by clicking a pip.
  itemId: {type: String, default: null},
  // Listings of powers nobody owns yet, such as the compendium browser, show
  // every pip lit rather than marking which feats a character has taken.
  allActive: {type: Boolean, default: false},
});
</script>
