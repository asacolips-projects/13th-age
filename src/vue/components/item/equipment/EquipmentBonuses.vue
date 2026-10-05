<template>
	<fieldset class="fieldset-attack">
		<legend>{{ game.i18n.localize('ARCHMAGE.ITEM.attackBonuses') }}</legend>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.meleeBonus') }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.attack.melee.bonus"
					type="number"
					name="system.attributes.attack.melee.bonus"
				>
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.rangedBonus') }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.attack.ranged.bonus"
					type="number"
					name="system.attributes.attack.ranged.bonus"
				>
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.divineBonus') }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.attack.divine.bonus"
					type="number"
					name="system.attributes.attack.divine.bonus"
				>
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.arcaneBonus') }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.attack.arcane.bonus"
					type="number"
					name="system.attributes.attack.arcane.bonus"
				>
			</div>
		</div>
	</fieldset>

	<fieldset class="fieldset-defense">
		<legend>{{ game.i18n.localize('ARCHMAGE.ITEM.defenseBonuses') }}</legend>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.acBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.ac.bonus" type="number" name="system.attributes.ac.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.pdBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.pd.bonus" type="number" name="system.attributes.pd.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.mdBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.md.bonus" type="number" name="system.attributes.md.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.hpBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.hp.bonus" type="number" name="system.attributes.hp.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.recoveriesBonus') }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.recoveries.bonus"
					type="number"
					name="system.attributes.recoveries.bonus"
				>
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.saveBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.save.bonus" type="number" name="system.attributes.save.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.saveBonusHPTreshold') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.save.threshold" type="number" name="system.attributes.save.threshold">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize(disengageKey) }} </label>
			<div class="field">
				<input
					v-model="item.system.attributes.disengage.bonus"
					type="number"
					name="system.attributes.disengage.bonus"
				>
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.rerollAcBonus') }} </label>
			<div class="field flexrow">
				<input
					v-model="item.system.attributes.rerollAc.current"
					type="number"
					name="system.attributes.rerollAc.current"
				>
				<span :class="$style.divider">/</span>
				<input v-model="item.system.attributes.rerollAc.bonus" type="number" name="system.attributes.rerollAc.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.rerollSaveBonus') }} </label>
			<div class="field flexrow">
				<input
					v-model="item.system.attributes.rerollSave.current"
					:class="$style.halfwidth"
					type="number"
					name="system.attributes.rerollSave.current"
				>
				<span :class="$style.divider">/</span>
				<input
					v-model="item.system.attributes.rerollSave.bonus"
					:class="$style.halfwidth"
					type="number"
					name="system.attributes.rerollSave.bonus"
				>
			</div>
		</div>
	</fieldset>

	<fieldset class="fieldset-defense">
		<legend>{{ game.i18n.localize('ARCHMAGE.ITEM.otherBonuses') }}</legend>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.strBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.str.bonus" type="number" name="system.attributes.str.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.dexBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.dex.bonus" type="number" name="system.attributes.dex.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.conBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.con.bonus" type="number" name="system.attributes.con.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.intBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.int.bonus" type="number" name="system.attributes.int.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.wisBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.wis.bonus" type="number" name="system.attributes.wis.bonus">
			</div>
		</div>

		<div class="form-group">
			<label> {{ game.i18n.localize('ARCHMAGE.ITEM.chaBonus') }} </label>
			<div class="field">
				<input v-model="item.system.attributes.cha.bonus" type="number" name="system.attributes.cha.bonus">
			</div>
		</div>
	</fieldset>
</template>

<script setup>
defineProps(["item", "context"]);

const disengageKey = CONFIG.ARCHMAGE.is2e ? "ARCHMAGE.ITEM.disengageBonus" : "ARCHMAGE.ITEM.disengageInitBonus";
</script>

<style lang="css" module>
.divider {
  flex-grow: 0 !important;
  margin: 0 0.5rem;
}
</style>
