<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.toHitBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.attackMod" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.meleeBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.meleeBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.rangedBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.rangedBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.divineBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.divineBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.arcaneBonus') }} </label>
		<div class="field">
			<input v-model="viewModel.arcaneBonus" type="number">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.meleeWeaponDamageBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
		</label>
		<div class="field">
			<input v-model="viewModel.meleeDice" type="text" placeholder="+2d10">
		</div>
	</div>

	<div v-if="!isNpc" class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.rangedWeaponDamageBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
		</label>
		<div class="field">
			<input v-model="viewModel.rangedDice" type="text" placeholder="+2d10">
		</div>
	</div>

	<div class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.critModBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critModBonusHint')" />
		</label>
		<div class="field">
			<input v-model="viewModel.critMod" type="number" placeholder="0">
		</div>
	</div>

	<div class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.escalationBlocked') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.escalationBlockedHint')" />
		</label>
		<div class="field">
			<input v-model="viewModel.edBlocked" type="checkbox">
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
