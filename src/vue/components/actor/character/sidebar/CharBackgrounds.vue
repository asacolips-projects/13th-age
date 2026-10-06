<template>
	<section v-if="Object.keys(backgrounds).length" class="section section--backgrounds flexcol">
		<h2 class="unit-title">{{ localize('ARCHMAGE.backgrounds') }}</h2>
		<ul class="list list--backgrounds backgrounds">
			<li
				v-for="(item, index) in backgrounds"
				:key="concat('system.backgrounds.', index)"
				class="list-item list-item--backgrounds background flexrow"
				:data-key="index"
				:data-tooltip="tooltip('pcBackground', {desc:item.name.value})"
			>
				<span class="rollable rollable--background flexshrink" data-roll-type="background" :data-roll-opt="item.name.value" />
				<span class="background-sign">+</span>
				<input v-model="item.bonus.value" type="number" :name="concat('system.backgrounds.', index, '.bonus.value')" class="background-bonus">
				<TextareaGrow :name="`system.backgrounds.${index}.name.value`" :value="item.name.value" classes="background-name" :disable-paste-parsing="true" />
			</li>
		</ul>
	</section>
</template>

<script>
import { localize, concat, tooltip } from "@/methods/Helpers";
import TextareaGrow from "@/components/parts/TextareaGrow.vue";
export default {
	name: "CharBackgrounds",
	components: {
		TextareaGrow
	},
	props: ["actor"],
	setup() {
		return {
			localize,
			concat,
			tooltip
		};
	},
	data() {
		return {};
	},
	computed: {
		backgrounds() {
			let filteredBackgrounds = {};
			for (let [k, v] of Object.entries(this.actor.system.backgrounds)) {
				if (v.isActive.value === true) filteredBackgrounds[k] = v;
			}
			return filteredBackgrounds;
		}
	},
	async mounted() {},
	methods: {}
};
</script>
