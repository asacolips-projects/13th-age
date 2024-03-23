<template>
	<div :class="`${classes} grow-wrap`" :data-replicated-value="valueAttr">
		<textarea :name="name" :value="valueAttr" @input="updateValue" rows="1"></textarea>
	</div>
</template>

<script>
export default {
	name: "TextareaGrow",
	props: ["classes", "value", "name"],
	data() {
		return {
			valueAttr: ""
		};
	},
	methods: {
		updateValue(event) {
			this.valueAttr = event.target.value;
			this.$emit("update:value", event.target.value);
		}
	},
	async created() {
		this.valueAttr = this.value ?? "";
	}
};
</script>
