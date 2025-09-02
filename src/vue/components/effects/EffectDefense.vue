<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.acBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.acBonus" />
		</div>
	</div>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.mdBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.mdBonus" />
		</div>
	</div>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.pdBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.pdBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.hpBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.hpMax" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.recoveriesBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.recoveries" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.saveBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.saveBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.disengageBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.disengageBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.initBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.initBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label>
			{{ localize('ARCHMAGE.ITEM.critDefBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critDefBonusHint')" />
		</label>
		<div class="field">
			<input type="number" v-model="viewModel.critDefBonus" />
		</div>
	</div>
</template>

<script setup>
import { computed, inject, reactive, watch } from 'vue';
import { localize } from '@/methods/Helpers';
import { InfoBubble, } from '@/components';

const props = defineProps(['viewModel']);
const { effect } = props;

const foundryEffect = inject('itemDocument')
const isNpc = foundryEffect?.parent?.type === 'npc'

</script>
