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
	computed: {
		mobConversionDisabled() {
			for (const item of this.actor.items) {
				if (item.type !== 'action') continue
				if (item?.system?.attack?.value?.match?.(/\(.*? attacks\)/)) return true // Something is already marked as multiattack
			}
			return false
		}
	},
	methods: {
		async convertToMob(ev) {
			const actor = await getActor(this.actor)
			const baseHp = actor.system.attributes.hp.max
			await actor.update({
				name: `${actor.name} (${localize('ARCHMAGE.MOOKMOB.mob')})`,
				'system.attributes.hp.max': baseHp * this.mookCount,
				'system.attributes.hp.value': baseHp * this.mookCount,
			})
			for (const item of actor.items.contents) {
				if (item.type !== 'action') continue
				const attack = item.system.attack.value
				await item.update({ 'system.attack.value': `${attack} ([[ceil(@hp.value/${this.mookCount})]] attacks)` })
			}
		}
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
