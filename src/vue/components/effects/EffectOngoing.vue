<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.ongoingDamage') }} </label>
		<div class="field">
			<input type="number" step="0.5" v-model="flags.ongoingDamage" />
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.damageType') }} </label>
		<div class="field">
			<input type="text" v-model="flags.ongoingDamageType" />
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.ongoingDamageMultiplier') }} </label>
		<div class="field">
			<select v-model.number="flags.ongoingDamageMultiplier">
				<option v-for="(label, value) in multipliers" :key="value" :value="Number(value)">
					{{ localize(label) }}
				</option>
			</select>
		</div>
	</div>
</template>

<script setup>
import { inject, reactive, watch } from 'vue';
import { localize } from '@/methods/Helpers';

const props = defineProps(['effect', 'context']);
const { effect } = props;
const foundryEffect = inject('itemDocument')

const multipliers = CONFIG.ARCHMAGE.ongoingDamageMultipliers;

const flags = reactive(effect.flags.archmage || {});
if (!flags.ongoingDamageMultiplier) flags.ongoingDamageMultiplier = 1;
watch(() => flags, (newValue) => {
	foundryEffect.setFlag('archmage', 'ongoingDamage', newValue.ongoingDamage);
	foundryEffect.setFlag('archmage', 'ongoingDamageType', newValue.ongoingDamageType);
	foundryEffect.setFlag('archmage', 'ongoingDamageMultiplier', newValue.ongoingDamageMultiplier);
}, { deep: true })
</script>
