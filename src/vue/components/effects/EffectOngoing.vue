<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.ongoingDamage') }} </label>
		<div class="field">
			<input type="number" v-model="flags.ongoingDamage" />
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.damageType') }} </label>
		<div class="field">
			<input type="text" v-model="flags.ongoingDamageType" />
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.ongoingDamageCrit') }} </label>
		<div class="field">
			<input type="checkbox" v-model="flags.ongoingDamageCrit" />
		</div>
	</div>
</template>

<script setup>
import { inject, reactive, watch } from 'vue';
import { localize } from '@/methods/Helpers';

const props = defineProps(['effect', 'context']);
const { effect } = props;
const foundryEffect = inject('itemDocument')

const flags = reactive(effect.flags.archmage || {});
watch(() => flags, (newValue) => {
	foundryEffect.setFlag('archmage', 'ongoingDamage', newValue.ongoingDamage);
	foundryEffect.setFlag('archmage', 'ongoingDamageType', newValue.ongoingDamageType);
	foundryEffect.setFlag('archmage', 'ongoingDamageCrit', newValue.ongoingDamageCrit);
}, { deep: true })
</script>
