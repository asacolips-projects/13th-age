<template>
	<section :class="classes">
		<h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTERSETTINGS.settings') }}</h2>
		<section class="sheet-settings grid grid-6col">
			<!-- Main Settings -->
			<div class="unit unit--base-settings">
				<div class="sub-unit sub-unit--base-ac flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.baseAC') }}</strong>
					<input v-model="actor.system.attributes.ac.base" type="number" name="system.attributes.ac.base" :disabled="overrides.includes('system.attributes.ac.base')">
				</div>
				<div class="sub-unit sub-unit--base-pd flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.basePD') }}</strong>
					<input v-model="actor.system.attributes.pd.base" type="number" name="system.attributes.pd.base" :disabled="overrides.includes('system.attributes.pd.base')">
				</div>
				<div class="sub-unit sub-unit--base-md flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.baseMD') }}</strong>
					<input v-model="actor.system.attributes.md.base" type="number" name="system.attributes.md.base" :disabled="overrides.includes('system.attributes.md.base')">
				</div>
				<div class="sub-unit sub-unit--base-hp flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.baseHP') }}</strong>
					<input
						v-model="actor.system.attributes.hp.base"
						type="number"
						name="system.attributes.hp.base"
						step=".1"
						:disabled="overrides.includes('system.attributes.hp.base')"
					>
				</div>
				<div class="sub-unit sub-unit--base-recoveries flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.baseRecoveries') }}</strong>
					<input v-model="actor.system.attributes.recoveries.base" type="number" name="system.attributes.recoveries.base" :disabled="overrides.includes('system.attributes.recoveries.base')">
				</div>
				<div class="sub-unit sub-unit--recovery-dice flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.recoveryDice') }}</strong>
					<input
						v-model="actor.system.attributes.recoveries.dice"
						type="text"
						name="system.attributes.recoveries.dice"
						:disabled="overrides.includes('system.attributes.recoveries.dice')"
						placeholder="d8"
					>
				</div>
				<div class="sub-unit sub-unit--calculate-max-hp flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.calculateHP') }}</strong>
					<input v-model="actor.system.attributes.hp.automatic" type="checkbox" name="system.attributes.hp.automatic">
				</div>
				<div class="sub-unit sub-unit--calculate-max-recoveries flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.calculateRecoveries') }}</strong>
					<input v-model="actor.system.attributes.recoveries.automatic" type="checkbox" name="system.attributes.recoveries.automatic">
				</div>
				<div class="sub-unit sub-unit--initiative-adjustment flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.hpAdjustment') }}</strong>
					<input
						v-model="actor.system.attributes.hp.extra"
						type="number"
						name="system.attributes.hp.extra"
						:disabled="overrides.includes('system.attributes.hp.extra')"
						placeholder="0"
					>
				</div>
				<div class="sub-unit sub-unit--initiative-adjustment flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.initAdjustment') }}</strong>
					<input
						v-model="actor.system.attributes.init.value"
						type="number"
						name="system.attributes.init.value"
						:disabled="overrides.includes('system.attributes.init.value')"
						placeholder="0"
					>
				</div>
				<div class="sub-unit sub-unit--initiative-adjustment flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.disengageAdjustment') }}</strong>
					<input
						v-model="actor.system.attributes.disengageBonus"
						type="number"
						name="system.attributes.disengageBonus"
						:disabled="overrides.includes('system.attributes.disengageBonus')"
						placeholder="0"
					>
				</div>
				<div class="sub-unit sub-unit--attackMod flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.attackMod') }}</strong>
					<input v-model="actor.system.attributes.attackMod.value" type="number" name="system.attributes.attackMod.value" :disabled="overrides.includes('system.attributes.attackMod.value')">
				</div>
				<div class="sub-unit sub-unit--critModAtk flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.critModAtk') }}</strong>
					<input v-model="actor.system.attributes.critMod.atk.value" type="number" name="system.attributes.critMod.atk.value" :disabled="overrides.includes('system.attributes.critMod.atk.value')">
				</div>
				<div class="sub-unit sub-unit--critModDef flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.critModDef') }}</strong>
					<input v-model="actor.system.attributes.critMod.def.value" type="number" name="system.attributes.critMod.def.value" :disabled="overrides.includes('system.attributes.critMod.def.value')">
				</div>
				<div class="sub-unit sub-unit--keyMod flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.keyMod') }}</strong>
					<select v-model="actor.system.attributes.keyModifier.mod1" name="system.attributes.keyModifier.mod1">
						<option v-for="(option, index) in abilities" :key="index" :value="option.value">{{ option.label }}</option>
					</select> /
					<select v-model="actor.system.attributes.keyModifier.mod2" name="system.attributes.keyModifier.mod2">
						<option v-for="(option, index) in abilities" :key="index" :value="option.value">{{ option.label }}</option>
					</select>
				</div>
				<div class="sub-unit sub-unit--skulls flexrow">
					<strong class="unit-subtitle">{{ localize('ARCHMAGE.maxSkulls') }}</strong>
					<select v-model="actor.system.attributes.saves.deathFails.maxOverride" name="system.attributes.saves.deathFails.maxOverride">
						<option :value="0">{{ localize('Default') }}</option>
						<option :value="4">4</option>
						<option :value="5">5</option>
						<option :value="6">6</option>
						<option :value="7">7</option>
					</select>
				</div>
				<div class="sub-unit sub-unit--melee">
					<div class="sub-unit sub-unit--melee-dice flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.meleeWeaponDice') }}</strong>
						<input
							v-model="actor.system.attributes.weapon.melee.dice"
							type="text"
							name="system.attributes.weapon.melee.dice"
							:disabled="overrides.includes('system.attributes.weapon.melee.dice')"
							placeholder="d8"
						>
					</div>
					<div class="sub-unit sub-unit--shield flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.CHARACTERSETTINGS.shield') }}</strong>
						<input v-model="actor.system.attributes.weapon.melee.shield" type="checkbox" name="system.attributes.weapon.melee.shield">
					</div>
					<div class="sub-unit sub-unit--dualwield flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.CHARACTERSETTINGS.dualwield') }}</strong>
						<input v-model="actor.system.attributes.weapon.melee.dualwield" type="checkbox" name="system.attributes.weapon.melee.dualwield">
					</div>
					<div class="sub-unit sub-unit--twohanded flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.CHARACTERSETTINGS.twohanded') }}</strong>
						<input v-model="actor.system.attributes.weapon.melee.twohanded" type="checkbox" name="system.attributes.weapon.melee.twohanded">
					</div>
					<div class="sub-unit sub-unit--ranged-dice flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.rangedWeaponDice') }}</strong>
						<input
							v-model="actor.system.attributes.weapon.ranged.dice"
							type="text"
							name="system.attributes.weapon.ranged.dice"
							:disabled="overrides.includes('system.attributes.weapon.ranged.dice')"
							placeholder="d8"
						>
					</div>
					<div class="sub-unit sub-unit--jab-dice flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.jabWeaponDice') }}</strong>
						<input
							v-model="actor.system.attributes.weapon.jab.dice"
							type="text"
							name="system.attributes.weapon.jab.dice"
							:disabled="overrides.includes('system.attributes.weapon.jab.dice')"
							placeholder="d6"
						>
					</div>
					<div class="sub-unit sub-unit--punch-dice flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.punchWeaponDice') }}</strong>
						<input
							v-model="actor.system.attributes.weapon.punch.dice"
							type="text"
							name="system.attributes.weapon.punch.dice"
							:disabled="overrides.includes('system.attributes.weapon.punch.dice')"
							placeholder="d8"
						>
					</div>
					<div class="sub-unit sub-unit--kick-dice flexrow">
						<strong class="unit-subtitle">{{ localize('ARCHMAGE.kickWeaponDice') }}</strong>
						<input
							v-model="actor.system.attributes.weapon.kick.dice"
							type="text"
							name="system.attributes.weapon.kick.dice"
							:disabled="overrides.includes('system.attributes.weapon.kick.dice')"
							placeholder="d10"
						>
					</div>
				</div>
			</div>
			<!-- Flag Settings -->
			<div class="unit unit--flags">
				<div v-for="(flag, f) in flags" :key="f" :data-key="f" class="settings-flags">
					<label :for="concat('flags.archmage.', f)" class="unit-subtitle flexrow">
						<input v-if="!flag.options" v-model="flag.value" type="checkbox" :name="concat('flags.archmage.', f, )"> {{ flag.name }}
					</label>
					<select v-if="flag.options" v-model="flag.value" :name="concat('flags.archmage.', f, )">
						<option v-for="(option, o) in flag.options" :key="o" :value="o">{{ localize(option) }}</option>
					</select>
					<p class="notes">{{ flag.hint }}</p>
				</div>
			</div>
			<!-- Background Settings -->
			<div class="unit unit--backgrounds">
				<div v-for="(background, b) in actor.system.backgrounds" :key="b" class="settings-background" :data-key="b">
					<input v-model="background.isActive.value" type="checkbox" :name="concat('system.backgrounds.', b, '.isActive.value')">
					<strong class="unit-subtitle">{{ localize(concat('ARCHMAGE.CHARACTERSETTINGS.', b)) }}</strong>
				</div>
			</div>
			<!-- Icon Settings -->
			<div class="unit unit--icons">
				<div v-for="(icon, i) in actor.system.icons" :key="i" class="settings-icon" :data-key="i">
					<input v-model="icon.isActive.value" type="checkbox" :name="concat('system.icons.', i, '.isActive.value')">
					<strong class="unit-subtitle">{{ localize(concat('ARCHMAGE.CHARACTERSETTINGS.', i)) }}</strong>
				</div>
			</div>
			<!-- Resource Settings -->
			<div class="unit unit--resources">
				<!-- Custom -->
				<div v-for="(resource, r) in resourcesCustom" :key="r" class="settings-resource" :data-key="r">
					<input v-model="resource.enabled" type="checkbox" :name="concat('system.resources.spendable.', r, '.enabled')">
					<strong class="unit-subtitle">{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</strong>
					<br>
					{{ localize(concat('ARCHMAGE.RESTS.header')) }}:&nbsp;
					<select v-model="resource.rest" :name="concat('system.resources.spendable.', r, '.rest')">
						<option v-for="(option, index) in resourceRestTypes" :key="index" :value="option.value">
							{{ localize(concat('ARCHMAGE.RESTS.',option.value)) }}
						</option>
					</select>
				</div>
				<!-- Bravado, Momentum, Command Points and Focus -->
				<div v-for="(resource, r) in resourcesPerCombat" :key="r" class="settings-resource" :data-key="r">
					<input v-model="resource.enabled" type="checkbox" :name="concat('system.resources.perCombat.', r, '.enabled')">
					<strong class="unit-subtitle">{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</strong>
				</div>
				<!-- Ki -->
				<div v-for="(resource, r) in resourcesSpendable" :key="r" class="settings-resource" :data-key="r">
					<input v-model="resource.enabled" type="checkbox" :name="concat('system.resources.spendable.', r, '.enabled')">
					<strong class="unit-subtitle">{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</strong>
				</div>
			</div>

			<div class="flexcol unit unit--hooks" style="grid-column-end: span 6">
				<h3>
					{{ localize('ARCHMAGE.SETTINGS.lifecycleHooks.title') }}
					<InfoBubble :tooltip="localize('ARCHMAGE.SETTINGS.lifecycleHooks.hint')" />
				</h3>
				<div class="flexrow form-group stacked">
					<div class="flexcol field">
						<label style="flex-grow: 0;">{{ localize('ARCHMAGE.SETTINGS.lifecycleHooks.startOfTurn') }}</label>
						<CodemirrorWrapper
							class="attribute-value"
							name="system.lifecycleHooks.startOfTurn"
							:value="actor.system.lifecycleHooks.startOfTurn"
							:disable-paste-parsing="true"
						/>
					</div>
					<div class="flexcol field">
						<label style="flex-grow: 0;">{{ localize('ARCHMAGE.SETTINGS.lifecycleHooks.endOfTurn') }}</label>
						<CodemirrorWrapper
							class="attribute-value"
							name="system.lifecycleHooks.endOfTurn"
							:value="actor.system.lifecycleHooks.endOfTurn"
							:disable-paste-parsing="true"
						/>
					</div>
				</div>
			</div>
		</section>
	</section>
</template>

<script>
import { concat, localize } from "@/methods/Helpers";
import { CodemirrorWrapper, InfoBubble } from "@/components";

export default {
	name: "CharSettings",
	components: { CodemirrorWrapper, InfoBubble },
	props: ["actor", "owner", "tab"],
	setup() {
		return {
			concat,
			localize
		};
	},
	data() {
		return {
			resourceRestTypes: [
				{ value: "none", label: game.i18n.localize("ARCHMAGE.RESTS.none") },
				{ value: "quickreset", label: game.i18n.localize("ARCHMAGE.RESTS.quickreset") },
				{ value: "fullreset", label: game.i18n.localize("ARCHMAGE.RESTS.fullreset") },
				{ value: "quick", label: game.i18n.localize("ARCHMAGE.RESTS.quick") },
				{ value: "full", label: game.i18n.localize("ARCHMAGE.RESTS.full") }
			],
			abilities: [
				{ value: "str", label: game.i18n.localize("ARCHMAGE.str.key") },
				{ value: "con", label: game.i18n.localize("ARCHMAGE.con.key") },
				{ value: "dex", label: game.i18n.localize("ARCHMAGE.dex.key") },
				{ value: "int", label: game.i18n.localize("ARCHMAGE.int.key") },
				{ value: "wis", label: game.i18n.localize("ARCHMAGE.wis.key") },
				{ value: "cha", label: game.i18n.localize("ARCHMAGE.cha.key") }
			]
		};
	},
	computed: {
		flags() {
			let flags = CONFIG.Actor.characterFlags;
			let charFlags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
			for (let [k, v] of Object.entries(flags)) {
				v.value = charFlags && charFlags[k] ? charFlags[k] : null;
				flags[k] = v;
			}
			return flags;
		},
		classes() {
			return `section section--settings flexcol`;
		},
		resourcesCustom() {
			let resources = {};
			for (let [k, v] of Object.entries(this.actor.system.resources.spendable)) {
				if (v.secondEdition && !game.settings.get("archmage", "secondEdition")) continue;
				if (k.includes("custom")) resources[k] = v;
			}
			return resources;
		},
		resourcesPerCombat() {
			let resources = {};
			for (let [k, v] of Object.entries(this.actor.system.resources.perCombat)) {
				if (v.secondEdition && !game.settings.get("archmage", "secondEdition")) continue;
				resources[k] = v;
			}
			return resources;
		},
		resourcesSpendable() {
			let resources = {};
			for (let [k, v] of Object.entries(this.actor.system.resources.spendable)) {
				if (v.secondEdition && !game.settings.get("archmage", "secondEdition")) continue;
				if (!k.includes("custom")) resources[k] = v;
			}
			return resources;
		},
		overrides() {
			return Object.keys(this.actor.overrides);
		}
	},
	async mounted() {},
	methods: { /* See created. */}
};
</script>
