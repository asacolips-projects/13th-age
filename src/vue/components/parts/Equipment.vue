<template>
	<section class="equipment">
		<!-- Bonuses -->
		<section class="equipment-bonuses flexcol">
			<div class="equipment-detail" v-for="(bonus, index) in bonuses" :key="index">
				<strong class="equipment-detail-label">{{localize(concat('ARCHMAGE.ITEM.', index, 'Bonus'))}}: </strong><span class="equipment-detail-value">{{bonus}}</span>
			</div>
		</section>
		<section class="equipment-chakra-slot flexcol" v-if="equipment.system.chackra">
			<div class="equipment-detail">
				<strong class="equipment-detail-label">{{localize('ARCHMAGE.ITEM.chakraSlot')}}: </strong><span class="equipment-detail-value">{{localize(concat('ARCHMAGE.CHAKRA.', equipment.system.chackra))}}</span>
			</div>
		</section>
		<!-- Primary properties (attack, hit, effect, etc.). -->
		<section class="equipment-details flexcol">
			<div class="equipment-detail">
				<span class="equipment-detail-value" v-html="equipment.system.description.value"></span>
			</div>
		</section>
	</section>
</template>

<script>
import { concat, localize } from "@/methods/Helpers";
export default {
	name: "Equipment",
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
		}
	},
	methods: {},
	async mounted() {}
};
</script>
