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
					<span class="ability-bonus">{{ formatBonus(ability.lvl) }}</span>
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
 *
 * @param bonus
 */
function formatBonus(bonus) {
	return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}
/**
 *
 * @param ability
 */
function abilityTooltip(ability) {
	return game.i18n.format("ARCHMAGE.TOOLTIP.pcAbilityStats", {
		score: ability?.value ?? "–",
		mod: formatBonus(ability?.mod ?? 0),
		lvl: formatBonus(ability?.lvl ?? 0)
	});
}
/**
 *
 * @param label
 */
function abilityAbbr(label) {
	return String(label ?? "").slice(0, 3)
		.toUpperCase();
}
/**
 *
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
}
</style>
