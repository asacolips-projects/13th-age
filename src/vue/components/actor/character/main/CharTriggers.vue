<template>
	<section class="section section--powers flexcol">
		<header class="power-filters flexrow" style="margin-bottom: 1em;">
			<input type="hidden" v-model="useCustomGroups" name="flags.archmage.sheetDisplay.triggers.customGroups.value">
			<label :class="$style.label">
				<input type="checkbox" v-model="useCustomGroups">
				Custom Groups
			</label>
		</header>

		<header :class="$style.grid" class="power-header-title">
			<h2></h2>
			<h2>Power</h2>
			<h2>Trigger</h2>
		</header>

		<div v-for="group in groups" :key="group.title" class="power-group">
			<h3 v-if="group.title" class="power-group-title">{{ group.title }}</h3>
			<div class="power-group-content flexcol">
				<div v-for="row in group.powerRows" :key="row.power._id" class="item power-item"
					:class="`power-item--${row.power._id}`" :data-item-id="row.power._id" data-document-class="Item"
					data-draggable="true" draggable="true">
					<div :class="[$style.grid, ...row.classes]" class="power-summary">
						<Rollable name="item" :hide-icon="true" type="item" :opt="row.power._id" class="flexrow">
							<img :src="row.power.img" class="power-icon" />
						</Rollable>
						<a class="power-name" @click="row.expanded = !row.expanded">
							<h3 class="power-title unit-subtitle" :class="$style.nowrap"> {{ row.power.name }} </h3>
						</a>
						<a :class="$style.nowrap" @click="row.expanded = !row.expanded">{{ row.power.system.trigger.value }}</a>
					</div>
					<div class="power-content" :class="[$style.fullwidth, row.expanded ? 'active' : '']">
						<Transition name="slide-fade">
							<Power v-if="row.expanded" :actor="actor" :power="row.power" :context="context" :flags="flags"
								:ref="`power--${row.power._id}`" />
						</Transition>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Power from '@/components/parts/Power.vue';
import Rollable from '@/components/parts/Rollable.vue';

const props = defineProps(['actor', 'context', 'tab', 'flags'])

const powersWithTriggers = computed(() =>
	props.actor.items
		.filter(x => x.type === 'power')
		.filter(x => x.system.trigger?.value)
)

const powerRows = ref([]);
watch(powersWithTriggers, (newPowers) => {
	powerRows.value = newPowers.map(power => ({
		power,
		expanded: false,
		classes: [powerUsageClass(power), powerAvailabilityClass(power)]
	}))
}, { immediate: true })

const useCustomGroups = ref(
	props.flags.sheetDisplay?.triggers?.customGroups?.value === 'true' ||
	props.flags.sheetDisplay?.triggers?.customGroups?.value === true ||
	false
)
const groups = computed(() => {
	if (!useCustomGroups.value) {
		return [{
			title: '',
			powerRows: powerRows.value.sort((a, b) => a.power.sort - b.power.sort)
		}]
	}

	// Group them
	const powerRowsByGroup = {}
	for (const p of powerRows.value) {
		const k = p.power.system.group?.value || ''
		powerRowsByGroup[k] ||= []
		powerRowsByGroup[k].push(p)
	}
	const sortedGroups = Object.keys(powerRowsByGroup).sort()

	// Construct the output
	return sortedGroups.map(k => ({
		title: k,
		powerRows: powerRowsByGroup[k].sort((a, b) => a.power.sort - b.power.sort)
	}))
})

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
.label {
	display: flex !important;
	align-items: center;
}

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
