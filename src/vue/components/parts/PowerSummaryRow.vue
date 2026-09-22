<template>
  <component :is="tag" :class="classes">
    <!-- Portrait, which rolls the power. -->
    <slot name="image">
      <Rollable v-if="image" name="item" :hide-icon="true" type="item" :opt="power._id">
        <img :src="power.img" class="power-image"/>
      </Rollable>
    </slot>
    <!-- Name, which expands the power. -->
    <slot name="name">
      <a class="power-name" :data-item-id="power._id" @click="$emit('toggle', power._id)">
        <h3 class="power-title unit-subtitle"><span v-if="power.system.powerLevel?.value">[{{power.system.powerLevel.value}}] </span>{{power.name}}</h3>
      </a>
    </slot>
    <!-- Whichever cells the caller wants after the name. -->
    <slot/>
    <!-- Trigger text. The stylesheet reveals this on hover. -->
    <div v-if="showTriggerTooltip" class="power-trigger power-trigger-tooltip">
      <strong>{{localize('ARCHMAGE.CHAT.trigger')}}:</strong> {{power.system.trigger.value}}
    </div>
  </component>
</template>

<script setup>
/**
 * One row of a power listing: its colour, its portrait and its name.
 *
 * Used by the powers tab, the triggers tab, the compendium browser and the item
 * sheet's preview, which each add their own trailing cells through the default
 * slot but agree on what a power row is and how it's coloured.
 */
import { computed } from 'vue';
import Rollable from '@/components/parts/Rollable.vue';
import { localize, powerAvailabilityClass, powerUsageClass } from '@/methods/Helpers';

const props = defineProps({
  power: {type: Object, required: true},
  // Needed to colour cyclic powers, which follow the escalation die.
  actor: {type: [Object, Boolean], default: null},
  // For callers holding the escalation die without an actor to read it from.
  escalationDie: {type: Number, default: null},
  // Element to render as. The compendium browser's rows are list items.
  tag: {type: String, default: 'div'},
  // The grid the cells lay out on. The triggers tab uses its own.
  gridClass: {type: String, default: 'grid power-grid'},
  // Any further classes the caller needs on the row.
  rowClass: {type: String, default: ''},
  // Whether to show the power's portrait.
  image: {type: Boolean, default: true},
  // Whether the power's body is expanded below the row.
  active: {type: Boolean, default: false},
  // Whether a power's trigger is shown as a tooltip on the row. Listings that
  // give the trigger a cell of its own turn this off.
  trigger: {type: Boolean, default: true},
});

defineEmits(['toggle']);

const showTriggerTooltip = computed(() => props.trigger && !!props.power.system.trigger?.value);

const classes = computed(() => [
  'power-summary',
  props.gridClass,
  powerUsageClass(props.power, props.actor, {escalationDie: props.escalationDie}),
  powerAvailabilityClass(props.power),
  showTriggerTooltip.value ? 'power-summary--trigger' : '',
  props.active ? 'active' : '',
  props.rowClass,
].filter(Boolean).join(' '));
</script>

<style scoped lang="scss">
// The row itself: white text over the usage colour, links that glow on hover,
// a portrait that fades out to the roll icon beneath it, and the hatching for
// powers that are spent.
.power-summary {
  color: $c-white;
  text-shadow: 0 0 10px $c-black--50;
  margin: 0 0 1px 0;
  position: relative;
  pointer-events: all;

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

  .rollable--item {
    position: relative;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      margin: auto;
      line-height: 1;
      font-size: $font-lg;
      width: $font-lg;
      height: $font-lg;
      display: block;
      opacity: 0;
      transition: all ease-in-out 0.25s;
    }

    img {
      transition: all ease-in-out 0.25s;
    }

    &:hover {
      &::before {
        opacity: 1;
      }

      img {
        opacity: 0;
      }
    }
  }

  &.at-will { background: $c-power-will; }
  &.once-per-battle { background: $c-power-battle; }
  &.daily { background: $c-power-daily; }
  &.recharge { background: $c-power-recharge; }
  &.other { background: $c-power-other; }

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

  &.unavailable {
    &::after {
      opacity: 0.3;
    }
  }

  // Powers that alternate between two usages (cyclic ones, and those with a
  // secondary pool of uses) are coloured for the usage they're currently in,
  // and carry a band of the other usage's colour at their trailing edge. The
  // two swap over when the power changes mode. The 45 degree cut follows the
  // direction of the usage gradients themselves.
  //
  // The edge is a masked hard stop rather than a clip-path polygon so that it
  // stays a true 45 degrees whatever the row height works out to be.
  //
  // Drawn with ::before so the "spent" hatching on ::after still paints over
  // the whole row, band included.
  &.alt-usage {
    // The cut is centred inside the 64px item controls column, short of the
    // uses column, which starts 66px in (those controls, plus the 2px grid
    // gap). Because the cut is a diagonal, its lower end reaches further left
    // than its centre by half the row height, so the 63px here keeps even that
    // end off the counters for rows up to 63px tall. Half-spent powers hatch
    // the band, and the hatching has to stay clear of both pools of uses.
    //
    // Doubled for the width, as the mask below is centred on the element.
    $band-cut: 63px;
    $band-width: $band-cut * 2;
    $band-mask: linear-gradient(135deg, transparent calc(50% - 0.5px), #000 calc(50% + 0.5px));

    &::before {
      display: block;
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: $band-width;
      mask-image: $band-mask;
      -webkit-mask-image: $band-mask;
      pointer-events: none;
    }

    // A power that has emptied one of its two pools but not the other is half
    // spent, and the band is always the one standing for the pool it isn't
    // currently drawing on. So hatch the band alone, by masking the row's
    // hatching to the same shape. Everything outside the mask box is left
    // unpainted, so the rest of the row stays clear until both pools run out
    // and '.unavailable' hatches the lot.
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

    &.alt-usage--at-will::before { background: $c-power-will; }
    &.alt-usage--once-per-battle::before { background: $c-power-battle; }
    &.alt-usage--daily::before { background: $c-power-daily; }
    &.alt-usage--recharge::before { background: $c-power-recharge; }
    &.alt-usage--other::before { background: $c-power-other; }

    // The band spans the controls column, and would spill into the ones before
    // it on an unusually tall row, so the cells it can reach have to paint
    // above it. Positioning them is enough: ::before comes first in tree
    // order. The name cell is deliberately left alone, as it relies on not
    // being a containing block when its title expands on hover. The cells
    // belong to the caller's summary slot, hence :deep().
    > :deep(.power-recharge),
    > :deep(.power-uses),
    > :deep(.item-controls) {
      position: relative;
    }
  }
}

// The name cell: its typography, the way the trailing cells dim while the
// name is hovered, and the title that escapes its ellipsis to show in full.
// Nested under .power-grid so listings that pass their own grid class (the
// triggers tab) lay their rows out on their own terms. The trailing cells
// belong to the caller's summary slot, hence :deep().
.power-grid {
  .power-name {
    font-size: $font-xs;
    font-family: $font-stack-secondary;
    overflow: hidden;
    padding-left: $padding-sm;
    text-align: left;
    justify-content: flex-start;

    &:hover {
      ~ :deep(.power-feat-pips),
      ~ :deep(.power-action) {
        opacity: 0.25;
      }

      .power-title {
        position: absolute;
        overflow: visible;
        padding-right: $padding-md;
        z-index: 10;
      }
    }
  }

  .power-title {
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.power-title {
  margin: 0;
  border: 0;
  text-align: left;
  font-size: $font-xs;
}

// The trigger read as a tooltip hanging off the row.
.power-summary--trigger {
  .power-trigger {
    display: none;
    position: absolute;
    top: 100%;
    min-width: 300px;
    max-width: 450px;
    padding: $padding-md;
    font-family: $font-stack-base;
    font-size: $font-xs;
    background: $c-white;
    color: $c-black;
    border: $c-black;
    margin: $padding-sm $padding-md $padding-md;
    box-shadow: 0 0 $padding-md $ct-border;
    text-shadow: none;
    left: 0;
    pointer-events: none;
    text-align: left;
    border-radius: $padding-sm;
    border: 1px solid $ct-border;
    z-index: 98;

    &::before {
      content: '';
      display: block;
      position: absolute;
      background: $c-white;
      width: 16px;
      height: 16px;
      top: -9px;
      left: 30px;
      transform: rotate(45deg);
      border: 1px solid $ct-border;
      border-bottom: 0;
      border-right: 0;
      z-index: 99;
    }
  }

  &:hover {
    .power-trigger {
      display: block;
    }
  }

  &.active:hover {
    .power-trigger {
      display: none;
    }
  }
}
</style>
