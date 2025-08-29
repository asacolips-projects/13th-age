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

	<fieldset class="fieldset-description">
		<legend>{{ localize('ARCHMAGE.ITEM.defenseBonuses') }}</legend>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.acBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.ac.value']" />
			</div>
		</div>
		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.mdBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.md.value']" />
			</div>
		</div>
		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.pdBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.pd.value']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.hpBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.hp.max']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.recoveriesBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.recoveries.value']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.saveBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.saves.bonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.disengageBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.disengageBonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.initBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.init.value']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label>
				{{ localize('ARCHMAGE.ITEM.critDefBonus') }}
				<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critDefBonusHint')" />
			</label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.critMod.def.value']" />
			</div>
		</div>
	</fieldset>

	<fieldset class="fieldset-description">
		<legend>{{ localize('ARCHMAGE.ITEM.ongoingDamage') }}</legend>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.ongoingDamage') }} </label>
			<div class="field">
				<input type="number" v-model="viewModel.ongoingDamage" />
			</div>
		</div>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.damageType') }} </label>
			<div class="field">
				<input type="text" v-model="viewModel.ongoingDamageType" />
			</div>
		</div>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.ongoingDamageCrit') }} </label>
			<div class="field">
				<input type="checkbox" v-model="viewModel.ongoingDamageCrit" />
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import { inject, reactive, watch } from 'vue';
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
};

// Convert the AE effects into fields for the view model
// This might be triggered by a UI change or a change from elsewhere in Foundry
watch(effect, async (newEffect) => {
	viewModel.duration = newEffect.flags.archmage?.duration;
	viewModel.ongoingDamage = newEffect.flags.archmage?.ongoingDamage;
	viewModel.ongoingDamageType = newEffect.flags.archmage?.ongoingDamageType;
	viewModel.ongoingDamageCrit = newEffect.flags.archmage?.ongoingDamageCrit;

	for (const change of effect.changes) {
		const viewModelKey = foundryToViewModel[change.key];
		if (viewModelKey) {
			viewModel[viewModelKey] = change.value;
		}

		if (change.key === 'system.attributes.escalation.value') {
			console.log(change)
			viewModel.edBlocked = change.value === '0';
		}
	}
}, { immediate: true, deep: true })

// Send changes to the view model out to Foundry
watch(viewModel, async (newModel) => {
	const ae = foundry.utils.duplicate(effect)

	// Flags
	ae.flags.archmage = {
		duration: newModel.duration,
		ongoingDamage: newModel.ongoingDamage,
		ongoingDamageType: newModel.ongoingDamageType,
		ongoingDamageCrit: newModel.ongoingDamageCrit,
	}

	// AE changes
	const newChanges = []
	for (const [fKey, vmKey] of Object.entries(foundryToViewModel)) {
		let value = newModel[vmKey]
		if (fKey.includes('system.attributes.weapon')) {
			// TODO: this is a dice expression and needs a leading '+' or '-'
		}

		if (!value) continue

		newChanges.push({
			key: fKey,
			value: value,
			mode: CONST.ACTIVE_EFFECT_MODES.ADD
		})

		// TODO: melee.dice applies to monk weapons
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
	console.log(ae)
	return foundryEffect.update(ae)
}, { deep: true });

// Pull effects apart into something vue can model
const effects = reactive({});
for (const change of effect.changes) {
	effects[change.key] = change.value;
}

const isNpc = foundryEffect?.parent?.type === 'npc'

</script>
