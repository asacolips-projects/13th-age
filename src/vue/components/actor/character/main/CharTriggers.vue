<template>
	<section class="section section--triggers flexcol">
		<header :class="$style.grid" class="power-header-labels">
			<div></div>
			<div>Power</div>
			<div>Trigger</div>
		</header>

		<div v-for="power in powersWithTriggers" :key="power._id" :class="$style.grid">
			<Rollable name="item" :hide-icon="true" type="item" :opt="power._id">
				<img :src="power.img" alt="Power icon" class="power-icon" />
			</Rollable>
			<div>{{ power.name }}</div>
			<div>{{ power.system.trigger.value }}</div>
		</div>
	</section>
</template>

<script setup>
import { computed } from 'vue';
import Power from '@/components/parts/Power.vue';
import Rollable from '@/components/parts/Rollable.vue';

const props = defineProps(['actor', 'context', 'tab', 'flags'])

const powersWithTriggers = computed(() =>
	props.actor.items
		.filter(x => x.type === 'power')
		.filter(x => x.system.trigger?.value)
)
</script>

<style module>
.grid {
	display: grid;
	grid-template-columns: 32px 250px auto;
	grid-gap: 0.5rem;
}
</style>
