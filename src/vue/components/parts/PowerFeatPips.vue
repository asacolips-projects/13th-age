<template>
  <div class="power-feat-pips" :data-tooltip="localize('ARCHMAGE.feats')">
    <ul class="feat-pips">
      <li v-for="(feat, tier) in filterFeats(feats)" :key="tier"
        :class="`feat-pip${feat.isActive?.value ? ' active' : ''}`"
        :data-item-id="itemId" :data-tier="tier" @click="$emit('toggle-pip', tier)"><div class="hide">{{tier}}</div></li>
    </ul>
  </div>
</template>

<script setup>
/**
 * The row of pips standing for a power's feats, one per feat with text.
 *
 * A filled pip means the feat has been taken. Listings of powers nobody owns
 * yet therefore show them all hollow, which is the truth: the power has feats
 * and none of them are active. Clicking a pip asks the owning row to toggle
 * the feat; the row decides whether that's possible.
 */
import { filterFeats, localize } from '@/methods/Helpers';

defineProps({
  feats: {type: Object, default: null},
  // Powers on an actor toggle their feats by clicking a pip.
  itemId: {type: String, default: null},
});

defineEmits(['toggle-pip']);
</script>

<style scoped lang="scss">
// The pips' presentation, mirrored from the V2 SCSS bundle
// (components/character/_feats.scss), which the V3 sheet root never matches.
// These stand alone so the pips read as they do on the V2 sheet, in either
// one; the bundle keeps its copy for the hand-rolled equipment rows.
.feat-pips {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style-type: none;

  .feat-pip {
    display: block;
    width: 8px;
    height: 8px;
    background: transparent;
    border-radius: 50%;
    border: 2px solid $c-white;
    margin: 0 1px;
    padding: 0;
    cursor: pointer;

    &.active {
      background: $c-white;
    }
  }
}
</style>
