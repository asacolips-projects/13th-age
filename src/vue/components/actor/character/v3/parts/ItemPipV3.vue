<template>
	<!-- The item's state pip: hollow until on, filled once it is. Two pips,
       stacked, mark an item that attunes as two slots. Clicked, it emits and
       the owning row decides what the toggle means. -->
	<div class="equipment-feat-pips" :class="`pip-${variant}`" :data-tooltip="tooltip">
		<ul class="feat-pips" :class="{double: count > 1}">
			<li
				v-for="n in count"
				:key="n"
				:class="concat('feat-pip', (active ? ' active' : ''))"
				:data-item-id="itemId"
				role="button"
				tabindex="0"
				:aria-label="tooltip || undefined"
				:aria-pressed="active"
				@click="$emit('toggle-pip')"
				@keydown.enter.prevent="$emit('toggle-pip')"
				@keydown.space.prevent="$emit('toggle-pip')"
			/>
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
import { concat } from "@/methods/Helpers";

defineProps({
	// Powers on an actor toggle their feats by clicking a pip.
	itemId: { type: String, default: null },
	// The pip's state — filled when true — and, for an item above the
	// character's tier, a count of two for the stacked pair. `tooltip`
	// stands in for the powers' feats tooltip.
	active: { type: Boolean, default: false },
	count: { type: Number, default: 1 },
	tooltip: { type: String, default: "" },
	// Which surface the pip serves: 'attunement' rides the equipment row's
	// white-on-colour text, 'feat' sits on ordinary body text. The variant
	// picks the pip's colour — see the style block.
	variant: { type: String, default: "feat" }
});

defineEmits(["toggle-pip"]);
</script>

<style scoped lang="scss">
  @import 'v3/pips';

// The pip's presentation, sized and coloured like the loadout's slot-track
// pips (the circle-pip mixin), interactive: 8px circles ringed in the body
// text colour, filled once taken.
.feat-pips {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style-type: none;

  .feat-pip {
    @include v3-circle-pip(8px);
    cursor: pointer;
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

// The attunement variant rides on the equipment row — white text over its
// colour fill — so in light mode, where the body-text token darkens, the
// pip retints to the row's white to stay visible. Feats sit on ordinary
// body text and keep the token everywhere.
.theme-light .pip-attunement {
  .feat-pip {
    border-color: var(--c-white);

    &.active {
      background: var(--c-white);
    }
  }
}
</style>
