<template>
	<input
		v-model="value"
		:type="type"
		:name="name"
		:readonly="locked"
		:class="classes"
	>
</template>

<script>
export default {
	name: "Input",
	props: ["type", "name", "actor", "classes", "readonly", "reactive"],
	computed: {
		value: {
			get() {
				return foundry.utils.getProperty(this.actor, this.name);
			},
			set(value) {
				if (this.reactive) {
					foundry.utils.setProperty(this.actor, this.name, value);
				}
				else {
					return false;
				}
			}
		},
		locked() {
			return this.readonly || this.actor.lockedFields.includes(this.name);
		}
	}
};
</script>
