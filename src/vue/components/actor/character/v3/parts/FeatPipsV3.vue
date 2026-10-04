<template>
  <!-- Powers: one pip per feat, keyed by tier, filled when taken. -->
  <div v-if="feats" class="power-feat-pips" :data-tooltip="localize('ARCHMAGE.feats')">
    <ul class="feat-pips">
      <li v-for="(feat, tier) in filterFeats(feats)" :key="tier"
        :class="`feat-pip${feat.isActive?.value ? ' active' : ''}`"
        :data-item-id="itemId" :data-tier="tier" @click="$emit('toggle-pip', tier)"><div class="hide">{{tier}}</div></li>
    </ul>
  </div>
  <!-- Equipment: the item's active pip, doubled for one that attunes as two
       slots. Clicked, it attunes or unattunes the item. -->
  <div v-else class="equipment-feat-pips" :data-tooltip="tooltip">
    <ul class="feat-pips" :class="{double: count > 1}">
      <li v-for="n in count" :key="n" :class="concat('feat-pip', (active ? ' active' : ''))"
        :data-item-id="itemId" @click="$emit('toggle-pip')"><div class="hide">{{active}}</div></li>
    </ul>
  </div>
</template>

<script setup>
/**
 * The row of pips standing for an item's taken states — a power's feats, or
 * an equipment item's attunement — the V3 sheet's counterpart to the shared
 * PowerFeatPips.
 *
 * For powers, a filled pip means the feat has been taken. Listings of powers
 * nobody owns yet therefore show them all hollow, which is the truth: the
 * power has feats and none of them are active.
 *
 * Unlike the shared component, which expects the sheet to catch the click via
 * the `data-item-id`/`data-tier` attributes, clicking emits `toggle-pip` with
 * the tier and lets the owning row decide what to do. Rows pass no `itemId`
 * and ignore the emit, the pips are display-only.
 */
import { concat, filterFeats, localize } from '@/methods/Helpers';

defineProps({
  feats: {type: Object, default: null},
  // Powers on an actor toggle their feats by clicking a pip.
  itemId: {type: String, default: null},
  // Equipment variant: the item's active state, one pip — or two, stacked,
  // via `count`, for an item above the character's tier — with `tooltip`
  // standing in for the powers' feats tooltip.
  active: {type: Boolean, default: false},
  count: {type: Number, default: 1},
  tooltip: {type: String, default: ''},
});

defineEmits(['toggle-pip']);
</script>

<style scoped lang="scss">
// The pips' presentation, sized and coloured like the hand-rolled pip in
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
    border: 1px solid var(--color-text-primary);
    margin: 0 1px;
    padding: 0;
    cursor: pointer;

    &.active {
      background: var(--color-text-primary);
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
