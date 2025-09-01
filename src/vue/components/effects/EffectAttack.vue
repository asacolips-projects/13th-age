<template>
	<div class="form-group">
		<label> {{ localize('ARCHMAGE.ITEM.toHitBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.attackMod" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.meleeBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.meleeBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.rangedBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.rangedBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.divineBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.divineBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label> {{ localize('ARCHMAGE.ITEM.arcaneBonus') }} </label>
		<div class="field">
			<input type="number" v-model="viewModel.arcaneBonus" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label>
			{{ localize('ARCHMAGE.ITEM.meleeWeaponDamageBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
		</label>
		<div class="field">
			<input type="text" v-model="viewModel.meleeDice" placeholder="+2d10" />
		</div>
	</div>

	<div class="form-group" v-if="!isNpc">
		<label>
			{{ localize('ARCHMAGE.ITEM.rangedWeaponDamageBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
		</label>
		<div class="field">
			<input type="text" v-model="viewModel.rangedDice" placeholder="+2d10" />
		</div>
	</div>

	<div class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.critModBonus') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critModBonusHint')" />
		</label>
		<div class="field">
			<input type="number" v-model="viewModel.critMod" placeholder="0" />
		</div>
	</div>

	<div class="form-group">
		<label>
			{{ localize('ARCHMAGE.ITEM.escalationBlocked') }}
			<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.escalationBlockedHint')" />
		</label>
		<div class="field">
			<input type="checkbox" v-model="viewModel.edBlocked" />
		</div>
	</div>
</template>

<script setup>
import { computed, inject, reactive, watch } from 'vue';
import { localize } from '@/methods/Helpers';
import { InfoBubble, } from '@/components';

const props = defineProps(['viewModel']);

const foundryEffect = inject('itemDocument')
const isNpc = foundryEffect?.parent?.type === 'npc'

</script>
