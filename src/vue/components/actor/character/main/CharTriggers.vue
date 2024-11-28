<template>
	<section class="section section--powers flexcol">
		<header :class="$style.grid" class="power-header-labels">
			<div></div>
			<div>Power</div>
			<div>Trigger</div>
		</header>

		<div v-for="power in powersWithTriggers" :key="power._id"
			:class="[$style.grid, powerUsageClass(power), powerAvailabilityClass(power)]" class="power-summary">
			<Rollable name="item" :hide-icon="true" type="item" :opt="power._id">
				<img :src="power.img" alt="Power icon" class="power-icon" />
			</Rollable>
			<a class="power-name" @click="expandedPowers[power._id] = !expandedPowers[power._id]">
				<h3 class="power-title unit-subtitle" :class="$style.nowrap"> {{ power.name }} </h3>
			</a>
			<p style="margin: 0" :class="$style.nowrap">{{ power.system.trigger.value }}</p>
			<div class="power-content" :class="[expandedPowers[power._id] ? 'active' : '', $style.fullwidth]">
				<Transition name="slide-fade">
					<Power v-if="expandedPowers[power._id]" :actor="actor" :power="power" :context="context" :flags="flags"
						:ref="`power--${power._id}`" />
				</Transition>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import Power from '@/components/parts/Power.vue';
import Rollable from '@/components/parts/Rollable.vue';

const props = defineProps(['actor', 'context', 'tab', 'flags'])

const powersWithTriggers = computed(() =>
	props.actor.items
		.filter(x => x.type === 'power')
		.filter(x => x.system.trigger?.value)
)

const expandedPowers = ref({});

/**
 * Compute CSS class to assign based on special usage
 */
function powerUsageClass(power) {
	let use = power.system.powerUsage.value ? power.system.powerUsage.value : 'other';
	if (['daily', 'daily-desperate'].includes(use)) use = 'daily';
	if (['recharge', 'recharge-desperate'].includes(use)) use = 'recharge';
	else if (use == 'cyclic') {
		if (this.actor.system.attributes.escalation.value > 0
			&& this.actor.system.attributes.escalation.value % 2 == 0) {
			use = 'at-will cyclic';
		} else use = 'once-per-battle cyclic';
	}
	return use;
}

function powerAvailabilityClass(power) {
	return power.system?.quantity?.value === 0 ? 'unavailable' : '';
}

</script>

<style module lang="scss">
.grid {
	display: grid;
	padding: 0;
	grid-template-columns: 32px 175px auto;
	grid-gap: 0.5rem;
	align-items: center;
}

.fullwidth {
	grid-column: 1 / -1;
}

.nowrap {
	overflow-x: hidden;
	white-space: nowrap;
}
</style>
