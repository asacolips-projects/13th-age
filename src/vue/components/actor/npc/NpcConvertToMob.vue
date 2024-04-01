<template>
	<h3>{{ localize('ARCHMAGE.MOOKMOB.title') }}</h3>
	<p>{{ localize('ARCHMAGE.MOOKMOB.description') }}</p>
	<section class="section section-mob-convert flexrow">
		<label><strong>{{ localize('ARCHMAGE.MOOKMOB.label') }}:</strong></label>
		<input type="number" min="2" step="1" v-model="mookCount">
		<button class="button button--confirm" @click="convertToMob" :disabled="mobConversionDisabled" type="button">
			{{ localize('ARCHMAGE.MOOKMOB.button') }}
		</button>
	</section>
</template>

<script>
import { ref } from 'vue';
import { localize, getActor } from '@/methods/Helpers';

export default {
	name: 'NpcConvertToMob',
	props: ['actor'],
	setup(props) {
		const mookCount = ref(2)
		return { mookCount, localize }
	},
}
</script>

<style lang="scss">
.archmage-v2.npc-sheet {
	.section-mob-convert {
		margin: $padding-lg;
		align-items: center;
		gap: 1rem;

		label {
			flex-grow: 0;
			white-space: nowrap;
		}

		button {
			flex-basis: 200px;
		}
	}
}
</style>
