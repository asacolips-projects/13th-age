<template>
	<section class="section section--initiative flexcol" :data-tooltip="tooltip('pcInitiative')">
		<a class="rollable rollable--init" data-roll-type="init">{{numberFormat(actor.system.attributes.init.mod, 0, true)}} {{localize('ARCHMAGE.initiative')}}</a>
	</section>
</template>

<script>
import { numberFormat, localize, tooltip } from "@/methods/Helpers";
export default {
	name: "CharIniative",
	props: ["actor"],
	setup() {
		return {
			numberFormat,
			localize,
			tooltip
		};
	},
	data() {
		return {};
	},
	computed: {},
	methods: {},
	watch: {},
	async mounted() {}
};
</script>
