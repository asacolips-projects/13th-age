<template>
	<section class="unit unit--abilities">
		<h2 class="unit-title">{{ localize('ARCHMAGE.abilities') }}</h2>
		<div class="ability-grid">
			<template v-for="(ability, key) in abilities" :key="`ability-${key}`">
				<button
					v-if="!editing"
					class="ability-button"
					type="button"
					:data-tooltip="abilityTooltip(ability)"
					@click="rollAbility(key)"
				>
					<span class="ability-abbr">{{ abilityAbbr(ability.label) }}</span>
					<span class="ability-bonus" :class="{ 'is-key-reduced': isKeyReduced(ability) }">{{ formatBonus(ability.lvl) }}</span>
				</button>
				<div v-else class="ability-edit">
					<span class="ability-abbr">{{ abilityAbbr(ability.label) }}</span>
					<input v-model="ability.value" type="number" :name="`system.abilities.${key}.value`">
				</div>
			</template>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import { localize } from "@/methods/Helpers";
import { DiceArchmage } from "@src/module/actor/dice.js";

const props = defineProps(["actor"]);

// DiceArchmage needs the real actor document; props.actor is the context's
// toObject() clone. The sheet provides the document for injection.
const actorDocument = inject("actorDocument");

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject("editMode", ref(false));

const abilities = computed(() => props.actor?.system?.abilities ?? {});

/**
 * Whether the Key Modifier reduced this ability's mod below its raw
 * (nonKey) value — multiclass pairs lower the weaker of the two stats.
 * Mirrors the V2 unit's modColor() highlight.
 * @param ability
 */
function isKeyReduced(ability) {
	return Number.isFinite(ability?.mod) && Number.isFinite(ability?.nonKey?.mod)
		&& ability.mod < ability.nonKey.mod;
}
/**
 * @param bonus
 */
function formatBonus(bonus) {
	return Number.isFinite(bonus) ? (bonus >= 0 ? `+${bonus}` : `${bonus}`) : "–";
}
/**
 * @param ability
 */
function abilityTooltip(ability) {
	// Reduced mods get the V2 explanation; the score column falls back to
	// "–" for missing data rather than masquerading as a real +0.
	const mod = Number.isFinite(ability?.mod) ? formatBonus(ability.mod) : "–";
	const lvl = Number.isFinite(ability?.lvl) ? formatBonus(ability.lvl) : "–";
	const score = ability?.value ?? "–";
	const base = game.i18n.format("ARCHMAGE.TOOLTIP.pcAbilityStats", {
		score: score,
		mod: mod,
		lvl: lvl
	});
	if (!isKeyReduced(ability)) return base;
	return `${base}<br>${game.i18n.format("ARCHMAGE.keyReduced", {
		mod: mod,
		kmod1: actorDocument?.system?.attributes?.keyModifier?.mod1 ?? props.actor?.system?.attributes?.keyModifier?.mod1 ?? "",
		kmod2: actorDocument?.system?.attributes?.keyModifier?.mod2 ?? props.actor?.system?.attributes?.keyModifier?.mod2 ?? ""
	})}`;
}
/**
 * @param label
 */
function abilityAbbr(label) {
	return String(label ?? "").slice(0, 3)
		.toUpperCase();
}
/**
 * @param key
 */
function rollAbility(key) {
	DiceArchmage.BackgroundRoll(actorDocument, { defaultAbility: key });
}
</script>

<style scoped lang="scss">
.ability-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem;
}

.ability-button {
  width: 100%;
  justify-content: center;
}

.ability-edit {
  display: grid;
  grid-template-columns: 1fr 3rem;
  align-items: center;
  gap: 0.25rem;

  input[type='number'] {
    width: 100%;
    min-width: 0;
    padding: 0 0.25rem;
    text-align: center;
  }
}

.ability-abbr {
  text-align: center;
}

.ability-bonus {
  flex: 0 0 3ch;
  text-align: center;
  font-variant-numeric: tabular-nums;

  &.is-key-reduced {
    color: var(--v3-negative);
  }
}
</style>
