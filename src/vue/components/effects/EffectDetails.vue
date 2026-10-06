<template>
	<div v-if="foundryEffect.parent.documentName === 'Actor'" class="form-group">
		<label>{{ localize("EFFECT.FIELDS.origin.label") }}</label>
		<div class="form-fields">
			<input v-model="viewModel.origin" type="text" name="origin">
		</div>
	</div>

	<div class="form-group">
		<label>{{ localize("EFFECT.FIELDS.disabled.label") }}</label>
		<input v-model="viewModel.disabled" type="checkbox">
	</div>

	<div class="form-group">
		<label>{{ localize("ARCHMAGE.ITEM.stacksAlways") }}</label>
		<input v-model="viewModel.stacksAlways" type="checkbox">
	</div>

	<div class="form-group">
		<label>{{ localize("EFFECT.TABS.duration") }}</label>
		<div class="form-fields">
			<select v-model="viewModel.duration" name="duration">
				<option value="">{{ localize('ARCHMAGE.noneOption') }}</option>
				<option v-for="(label, value) in CONFIG.ARCHMAGE.effectDurationTypes" :key="value" :value="value">
					{{ localize(label) }}
				</option>
			</select>
		</div>
	</div>
</template>

<script setup>
import { reactive, watch, inject } from "vue";
import { localize } from "@/methods/Helpers";

const props = defineProps(["effect", "context"]);
const { effect } = props;
const foundryEffect = inject("itemDocument");

const viewModel = reactive({
	origin: effect.origin,
	disabled: effect.disabled,
	stacksAlways: effect.flags.archmage?.stacksAlways ?? false,
	duration: effect.flags.archmage?.duration ?? null
});
watch(viewModel, (newValue) => {
	foundryEffect.update({
		origin: newValue.origin,
		disabled: newValue.disabled
	});

	foundryEffect.setFlag("archmage", "stacksAlways", newValue.stacksAlways);
	foundryEffect.setFlag("archmage", "duration", newValue.duration);
}, { deep: true });
</script>
