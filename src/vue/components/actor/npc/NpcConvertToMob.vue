<template>
	<h3>Convert to Mob</h3>
	<p>Converts this actor to a mob, with more HP and a multi-attack that loses attacks as the HP are drained.</p>
	<section class="section section-mob-convert flexrow">
		<label><strong>Number of mooks:</strong></label>
		<input type="number" min="2" step="1" v-model="mookCount">
		<button class="button button--confirm" @click="convertToMob" :disabled="mobConversionDisabled" type="button">Convert
			to Mob</button>
	</section>
</template>

<script>
import { ref } from 'vue';
export default {
	name: 'NpcConvertToMob',
	props: ['actor'],
	setup(props) {
		const mookCount = ref(2)
		return { mookCount }
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
