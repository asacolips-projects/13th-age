<template>
	<section class="equipment">
		<!-- Bonuses -->
		<section class="equipment-bonuses flexcol">
			<div v-for="(bonus, index) in bonuses" :key="index" class="equipment-detail">
				<strong class="equipment-detail-label">{{ localize(concat('ARCHMAGE.ITEM.', index, 'Bonus')) }}: </strong><span class="equipment-detail-value">{{ bonus }}</span>
			</div>
		</section>
		<section v-if="equipment.system.chackra" class="equipment-chakra-slot flexcol">
			<div class="equipment-detail">
				<strong class="equipment-detail-label">{{ localize('ARCHMAGE.ITEM.chakraSlot') }}: </strong><span class="equipment-detail-value">{{ localize(concat('ARCHMAGE.CHAKRA.', equipment.system.chackra)) }}</span>
			</div>
		</section>
		<!-- Primary properties (attack, hit, effect, etc.). -->
		<section class="equipment-details flexcol">
			<div class="equipment-detail">
				<Suspense>
					<Enriched tag="span" class="equipment-detail-value" :text="equipment.system.description.value" :dice-formula-mode="diceFormulaMode" />
				</Suspense>
			</div>
		</section>
	</section>
</template>

<script>
import { concat, localize } from "@/methods/Helpers";
import Enriched from "@/components/parts/Enriched.vue";
export default {
	name: "Equipment",
	components: { Enriched },
	props: ["equipment", "bonuses"],
	setup() {
		return {
			concat,
			localize
		};
	},
	data() {
		return {};
	},
	computed: {
		constants() {
			return CONFIG.ARCHMAGE;
		},
		diceFormulaMode() {
			return this.equipment?.actor?.flags?.archmage?.diceFormulaMode ?? "short";
		}
	},
	async mounted() {},
	methods: {}
};
</script>
