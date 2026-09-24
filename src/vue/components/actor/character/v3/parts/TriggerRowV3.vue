<template>
  <ExpandableItem :item="power" base-class="trigger">
    <template #summary="{active, toggle}">
      <!-- Clickable summary line: the power's portrait, its name and its trigger. -->
      <div class="trigger-summary" :class="[usageClass, availabilityClass, {active}]" @click="toggle">
        <!-- Activates the power; .stop so it doesn't toggle the row. -->
        <RollableV3 class="trigger-icon" :hide-icon="true" @click.stop="activatePower">
          <img :src="power.img" :alt="power.name"/>
        </RollableV3>
        <span class="trigger-name">{{ power.name }}</span>
        <span class="trigger-text">{{ power.system.trigger.value }}</span>
      </div>
    </template>
    <!-- Expanded power details. -->
    <template #content="{active}">
      <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context"/>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * One row of the triggers tab: the power's name and its trigger text,
 * expanding to the power's full details. The expand state belongs to
 * ExpandableItem, keyed to the power by the caller's v-for key.
 */
import { computed, inject } from 'vue';
import { powerAvailabilityClass, powerUsageClass } from '@/methods/Helpers';
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';
import PowerDetailsV3 from './PowerDetailsV3.vue';
import RollableV3 from '../RollableV3.vue';

const props = defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

// The usage colour class and the spent / alt-usage state, computed by the
// same module the V2 sheets use, so every listing colours a power alike.
const usageClass = computed(() => powerUsageClass(props.power, props.actor));
const availabilityClass = computed(() => powerAvailabilityClass(props.power));

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

/**
 * Activate the power: its roll() runs the usage dialog, spends uses and
 * resources, and posts the card to chat.
 */
function activatePower() {
  actorDocument?.items?.get(props.power._id)?.roll();
}
</script>

<style scoped lang="scss">
  // Band geometry: the band is doubled in width so the masked cut, centred on
  // the element, stays a true 45 degrees whatever the row height works out to.
  $band-cut: 24px;
  $band-width: $band-cut * 2;
  $band-mask: linear-gradient(135deg, transparent calc(50% - 0.5px), #000 calc(50% + 0.5px));

  // The summary's three-column layout: the power's portrait, its name, then
  // the trigger filling the rest. The tab's column header repeats these
  // columns so the labels line up with the rows.
  .trigger-summary {
    position: relative;
    display: grid;
    grid-template-columns: 2rem minmax(6rem, 10rem) minmax(0, 1fr);
    gap: 0.75rem;
    align-items: center;
    padding: 0.25rem 0.375rem;
    cursor: pointer;

    // White text over the usage colour, matching the V2 power rows.
    color: var(--c-white);
    text-shadow: 0 0 10px var(--c-black--50);

    // Usage colours: the system-wide gradients, which the colour-blind
    // modes override through their body classes.
    &.at-will { background: var(--v3-power-will); }
    &.once-per-battle { background: var(--v3-power-battle); }
    &.daily { background: var(--v3-power-daily); }
    &.recharge { background: var(--v3-power-recharge); }
    &.other { background: var(--v3-power-other); }

    &:hover .trigger-name {
      text-shadow: 0 0 10px var(--c-white);
    }

    // The "spent" hatching. Drawn with ::after so it paints over the whole
    // row, the alt-usage band on ::before included.
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: repeating-linear-gradient(
        45deg,
        rgba(0,0,0,0.5),
        rgba(0,0,0,0.5) 10px,
        rgba(0,0,0,1) 10px,
        rgba(0,0,0,1) 20px
      );
      pointer-events: none;
      opacity: 0;
      transition: all ease 0.15s;
    }

    &.unavailable::after {
      opacity: 0.3;
    }

    // Powers that alternate between two usages carry a band of the other
    // usage's colour at their trailing edge, and the two swap over when the
    // power changes mode. The extra trailing padding keeps the text clear
    // of the band.
    &.alt-usage {
      padding-right: calc(#{$band-width} + 0.375rem);

      &::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: $band-width;
        mask-image: $band-mask;
        -webkit-mask-image: $band-mask;
        pointer-events: none;
      }

      // A power that has emptied one of its two pools but not the other is
      // half spent, and the band stands for the pool it isn't currently
      // drawing on — so hatch the band alone, by masking the row's hatching
      // to the same shape.
      &.alt-usage--spent:not(.unavailable)::after {
        opacity: 0.3;
        mask-image: $band-mask;
        mask-size: $band-width 100%;
        mask-position: right;
        mask-repeat: no-repeat;
        -webkit-mask-image: $band-mask;
        -webkit-mask-size: $band-width 100%;
        -webkit-mask-position: right;
        -webkit-mask-repeat: no-repeat;
      }

      &.alt-usage--at-will::before { background: var(--v3-power-will); }
      &.alt-usage--once-per-battle::before { background: var(--v3-power-battle); }
      &.alt-usage--daily::before { background: var(--v3-power-daily); }
      &.alt-usage--recharge::before { background: var(--v3-power-recharge); }
      &.alt-usage--other::before { background: var(--v3-power-other); }
    }
  }

  // The portrait: a square that brightens on hover, inviting the click that
  // activates the power.
  .trigger-icon {
    img {
      display: block;
      width: 2rem;
      height: 2rem;
      object-fit: cover;
      border-radius: 0.25rem;
      transition: filter ease-in-out 0.1s;
    }

    &:hover img {
      filter: brightness(1.3) drop-shadow(0 0 3px var(--c-white--50));
    }
  }

  .trigger-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: var(--v3-font-display);
    font-size: var(--v3-font-size-value);
  }

  .trigger-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--v3-font-size-label);
  }

  // The expanded pane clips the slide-fade transition. The wrapper div is
  // ExpandableItem's, hence :deep().
  :deep(.trigger-content) {
    overflow: hidden;
  }
</style>
