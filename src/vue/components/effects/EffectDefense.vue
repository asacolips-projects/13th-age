<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.acBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.acBonus" type="number">
		</div>
	</div>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.mdBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.mdBonus" type="number">
		</div>
	</div>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.pdBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.pdBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.hpBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.hpMax" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.recoveriesBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.recoveries" type="number">
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.saveBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.saveBonus" type="number">
		</div>
	</div>

	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.disengageBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.disengageBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.initBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.initBonus" type="number">
		</div>
	</div>

	<div class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.critDefBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critDefBonusHint')" />
		</label>
		<div class="field">
			<input v-model="viewModel.critDefBonus" type="number">
		</div>
	</div>
</template>

<script setup>
import { inject } from "vue";
import { localize } from "@/methods/Helpers";
import { InfoBubble } from "@/components";

defineProps(["viewModel"]);

const foundryEffect = inject("itemDocument");
const isNpc = foundryEffect?.parent?.type === "npc";

</script>
