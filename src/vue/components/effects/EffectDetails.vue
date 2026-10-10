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

	<div v-if="isSaveEnds" class="form-group">
		<label>{{ localize("ARCHMAGE.SAVE.dc") }}</label>
		<div class="form-fields">
			<input
				v-model="viewModel.saveDC"
				type="number"
				min="1"
				step="1"
				:placeholder="defaultSaveDC"
			>
		</div>
		<p class="hint">{{ localize("ARCHMAGE.SAVE.dcHint") }}</p>
	</div>
</template>

<script setup>
import { reactive, watch, inject, computed } from "vue";
import { localize } from "@/methods/Helpers";

const props = defineProps(["effect", "context"]);
const { effect } = props;
const foundryEffect = inject("itemDocument");

const viewModel = reactive({
	origin: effect.origin,
	disabled: effect.disabled,
	stacksAlways: effect.flags.archmage?.stacksAlways ?? false,
	duration: effect.flags.archmage?.duration ?? null,
	saveDC: effect.flags.archmage?.saveDC ?? ""
});
const defaultSaveDC = computed(() => game.archmage.MacroUtils.SAVE_ENDS_TARGETS[viewModel.duration]);
const isSaveEnds = computed(() => !!defaultSaveDC.value);
watch(viewModel, (newValue) => {
	foundryEffect.update({
		origin: newValue.origin,
		disabled: newValue.disabled
	});

	foundryEffect.setFlag("archmage", "stacksAlways", newValue.stacksAlways);
	foundryEffect.setFlag("archmage", "duration", newValue.duration);
	// Only save ends durations carry a DC, blank means the duration's default.
	const saveDC = Number(newValue.saveDC);
	if (isSaveEnds.value && newValue.saveDC !== "" && Number.isFinite(saveDC)) foundryEffect.setFlag("archmage", "saveDC", saveDC);
	else if (foundryEffect.flags.archmage?.saveDC !== undefined) foundryEffect.unsetFlag("archmage", "saveDC");
}, { deep: true });
</script>
