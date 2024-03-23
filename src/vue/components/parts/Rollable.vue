<template>
	<a :class="getClass()" :data-roll-type="type" :data-roll-opt="opt"><slot></slot></a>
</template>

<script>
export default {
	name: "Rollable",
	props: ["name", "hide-icon", "type", "opt"],
	data() {
		return {};
	},
	computed: {},
	methods: {
		getClass() {
			return `rollable${this.hideIcon ? " hide-icon" : ""}${this.name ? ` rollable--${this.name}` : ""}`;
		}
	},
	async mounted() {}
};
</script>
