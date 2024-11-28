<template>
	<section class="section section--triggers flexcol">
		<div v-for="power in powersWithTriggers">
			{{ power.name }}
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
