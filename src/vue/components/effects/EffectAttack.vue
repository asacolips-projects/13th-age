<template>
	<fieldset class="fieldset-description">
		<legend>{{ localize('ARCHMAGE.ITEM.attackBonuses') }}</legend>

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
	</fieldset>
</template>

<script setup>
import { computed, inject, reactive, watch } from 'vue';
import { localize } from '@/methods/Helpers';
import { InfoBubble, } from '@/components';

const props = defineProps(['effect', 'context']);
const { effect } = props;
const foundryEffect = inject('itemDocument')

const viewModel = reactive({ edBlocked: false });

// Maps view model keys to Foundry keys and vice versa
const foundryToViewModel = {
	'system.attributes.attackMod.value': 'attackMod',
	'system.attributes.attack.melee.bonus': 'meleeBonus',
	'system.attributes.attack.ranged.bonus': 'rangedBonus',
	'system.attributes.attack.divine.bonus': 'divineBonus',
	'system.attributes.attack.arcane.bonus': 'arcaneBonus',
	'system.attributes.weapon.melee.dice': 'meleeDice',
	'system.attributes.weapon.ranged.dice': 'rangedDice',
	'system.attributes.critMod.atk.value': 'critMod',
	// no system.attributes.escalation.value, it's handled separately
	'system.attributes.ac.value': 'acBonus',
	'system.attributes.md.value': 'mdBonus',
	'system.attributes.pd.value': 'pdBonus',
	'system.attributes.hp.max': 'hpMax',
	'system.attributes.recoveries.value': 'recoveries',
	'system.attributes.saves.bonus': 'saveBonus',
	'system.attributes.disengageBonus': 'disengageBonus',
	'system.attributes.init.value': 'initBonus',
	'system.attributes.critMod.def.value': 'critDefBonus',
};

// Convert the AE effects into fields for the view model
// This might be triggered by a UI change or a change from elsewhere in Foundry
watch(effect, async (newEffect) => {
	for (const change of newEffect.changes) {
		const viewModelKey = foundryToViewModel[change.key];
		if (viewModelKey) {
			viewModel[viewModelKey] = change.value;
		}

		if (change.key === 'system.attributes.escalation.value') {
			viewModel.edBlocked = change.value === '0';
		}
	}
}, { immediate: true, deep: true })

// Send changes to the view model out to Foundry
watch(viewModel, async (newModel) => {
	const ae = foundry.utils.duplicate(effect)
	const newChanges = []
	for (const [fKey, vmKey] of Object.entries(foundryToViewModel)) {
		let value = newModel[vmKey]
		if (fKey.includes('system.attributes.weapon')) {
			// This is a dice expression and needs a leading '+' or '-'
			value = String(value ?? '').trim()
			if (value.length > 0 && !value.startsWith('+') && !value.startsWith('-')) {
				value = `${value[0] > 0 ? '+' : '-'} ${value}`;
			}
			// TODO: warn if value is not a valid dice expression?
		}

		if (!value) continue

		newChanges.push({
			key: fKey,
			value: value,
			mode: CONST.ACTIVE_EFFECT_MODES.ADD
		})

		// melee.dice also applies to monk weapons
		if (fKey === 'system.attributes.weapon.melee.dice') {
			["jab", "punch", "kick"].forEach(k => {
				newChanges.push({
					key: fKey.replace("melee", k),
					value: value,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD
				});
			});
		}
	}

	// Handle ED block
	if (newModel.edBlocked) {
		newChanges.push({
			key: 'system.attributes.escalation.value',
			mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
			value: '0'
		});
	}

	ae.changes = newChanges.filter(c => c.value !== null)
	effect.changes = ae.changes
	return foundryEffect.update(ae)
}, { deep: true });

const isNpc = computed(() => foundryEffect?.parent?.type === 'npc')

</script>
