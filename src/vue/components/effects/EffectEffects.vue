<template>
	<fieldset class="fieldset-description">
		<legend>{{ localize('ARCHMAGE.ITEM.attackBonuses') }}</legend>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.toHitBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.attackMod.value']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.meleeBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.attack.melee.bonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.rangedBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.attack.ranged.bonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.divineBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.attack.divine.bonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label> {{ localize('ARCHMAGE.ITEM.arcaneBonus') }} </label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.attack.arcane.bonus']" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label>
				{{ localize('ARCHMAGE.ITEM.meleeWeaponDamageBonus') }}
				<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
			</label>
			<div class="field">
				<input type="text" v-model="effects['system.attributes.weapon.melee.dice']" placeholder="+2d10" />
			</div>
		</div>

		<div class="form-group" v-if="!isNpc">
			<label>
				{{ localize('ARCHMAGE.ITEM.rangedWeaponDamageBonus') }}
				<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.diceExpressionHint')" />
			</label>
			<div class="field">
				<input type="text" v-model="effects['system.attributes.weapon.ranged.dice']" placeholder="+2d10" />
			</div>
		</div>

		<div class="form-group">
			<label>
				{{ localize('ARCHMAGE.ITEM.critModBonus') }}
				<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.critModBonusHint')" />
			</label>
			<div class="field">
				<input type="number" v-model="effects['system.attributes.critMod.atk.value']" placeholder="0" />
			</div>
		</div>

		<div class="form-group">
			<label>
				{{ localize('ARCHMAGE.ITEM.escalationBlocked') }}
				<InfoBubble :tooltip="localize('ARCHMAGE.ITEM.escalationBlockedHint')" />
			</label>
			<div class="field">
				<input type="checkbox" v-model="effects['system.attributes.escalation.value']" />
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
				<input type="number" v-model="effect.flags.archmage.ongoingDamage" />
			</div>
		</div>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.damageType') }} </label>
			<div class="field">
				<input type="text" v-model="effect.flags.archmage.ongoingDamageType" />
			</div>
		</div>

		<div class="form-group">
			<label> {{ localize('ARCHMAGE.ITEM.ongoingDamageCrit') }} </label>
			<div class="field">
				<input type="checkbox" v-model="effect.flags.archmage.ongoingDamageCrit" />
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

// Pull effects apart into something vue can model
const effects = reactive({});
for (const change of effect.changes) {
	effects[change.key] = change.value;
}

const foundryEffect = inject('itemDocument')
const isNpc = foundryEffect?.parent?.type === 'npc'

watch(effects, async (newEffects) => {
	// TODO: Something changed, convert it back to an effect and send it to the foundry AE
	console.log(newEffects, foundryEffect)
}, { deep: true });

</script>
