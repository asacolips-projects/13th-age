<template>
	<a :class="getClass()" :data-roll-type="type" :data-roll-opt="opt"><slot /></a>
</template>

<script>
export default {
	name: "Rollable",
	props: ["name", "hide-icon", "type", "opt"],
	data() {
		return {};
	},
	computed: {},
	async mounted() {},
	methods: {
		getClass() {
			return `rollable${this.hideIcon ? " hide-icon" : ""}${this.name ? ` rollable--${this.name}` : ""}`;
		}
	}
};
</script>
