<template>
  <!-- The item's state pip: hollow until on, filled once it is. Two pips,
       stacked, mark an item that attunes as two slots. Clicked, it emits and
       the owning row decides what the toggle means. -->
  <div class="equipment-feat-pips" :data-tooltip="tooltip">
    <ul class="feat-pips" :class="{double: count > 1}">
      <li v-for="n in count" :key="n" :class="concat('feat-pip', (active ? ' active' : ''))"
        :data-item-id="itemId" @click="$emit('toggle-pip')"><div class="hide">{{active}}</div></li>
    </ul>
  </div>
</template>

<script setup>
/**
 * A single state pip for an item: one circle standing for an on/off state —
 * equipment's attunement, or a feat's taken state on its row in the feats
 * panel. The power listings show their feats as tier letters instead, so
 * this is the only pip component on the V3 sheet; the shared PowerFeatPips
 * is its V2 counterpart.
 *
 * Clicking emits `toggle-pip`; rows with no toggle to offer ignore it.
 */
import { concat } from '@/methods/Helpers';

defineProps({
  // Powers on an actor toggle their feats by clicking a pip.
  itemId: {type: String, default: null},
  // The pip's state — filled when true — and, for an item above the
  // character's tier, a count of two for the stacked pair. `tooltip`
  // stands in for the powers' feats tooltip.
  active: {type: Boolean, default: false},
  count: {type: Number, default: 1},
  tooltip: {type: String, default: ''},
});

defineEmits(['toggle-pip']);
</script>

<style scoped lang="scss">
// The pip's presentation, sized and coloured like the hand-rolled pip in
// PowerFeatsV3 (`.feat-active-pip`), the one V3 element that already renders
// a feat's taken state: 8px circles ringed in the body text colour, filled
// once taken. No --v3-* token covers the pip, so the core token flows
// straight through; themes retint it like they do the text.
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
    border: 1px solid var(--c-white);
    margin: 0 1px;
    padding: 0;
    cursor: pointer;

    &.active {
      background: var(--c-white);
    }
  }

  // Two pips, stacked, for an item that attunes as two slots.
  &.double {
    flex-direction: column;
    gap: 2px;

    .feat-pip {
      margin: 0;
    }
  }
}
</style>
