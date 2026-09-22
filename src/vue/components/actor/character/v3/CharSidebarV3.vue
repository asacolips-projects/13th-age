<template>
  <aside class="sheet-sidebar">
    <section class="unit unit--abilities">
      <h2 class="unit-title">{{ localize('ARCHMAGE.abilities') }}</h2>
      <div class="ability-grid">
        <template v-for="(ability, key) in abilities" :key="`ability-${key}`">
          <button v-if="!editing" class="ability-button" type="button" @click="rollAbility(key)">
            <span class="ability-abbr">{{ abilityAbbr(ability.label) }}</span>
            <span class="ability-bonus">{{ formatBonus(ability.lvl) }}</span>
          </button>
          <div v-else class="ability-edit">
            <span class="ability-abbr">{{ abilityAbbr(ability.label) }}</span>
            <input type="number" :name="`system.abilities.${key}.value`" v-model="ability.value">
          </div>
        </template>
      </div>
    </section>

    <section class="unit unit--backgrounds">
      <h2 class="unit-title">{{ localize('ARCHMAGE.backgrounds') }}</h2>
      <ul v-if="backgrounds.length" class="background-list">
        <li v-for="background in backgrounds" :key="background.key">
          <button v-if="!editing" class="background-button" type="button"
                  @click="rollBackground(background.name)">
            <span class="background-bonus">{{ formatBonus(background.bonus) }}</span>
            {{ background.name }}
          </button>
          <div v-else class="background-edit">
            <input type="number" :name="`system.backgrounds.${background.key}.bonus.value`" v-model="background.raw.bonus.value">
            <input type="text" :name="`system.backgrounds.${background.key}.name.value`" v-model="background.raw.name.value">
          </div>
        </li>
      </ul>
      <p v-else class="placeholder">None</p>
    </section>

    <section class="unit unit--icons">
      <h2 class="unit-title">{{ localize('ARCHMAGE.iconRelationships') }}</h2>
      <ul v-if="icons.length" class="icon-list">
        <li v-for="icon in icons" :key="icon.key" class="icon-row">
          <template v-if="!editing">
            <span class="rollable icon-roll" data-roll-type="icon" :data-roll-opt="icon.key"></span>
            <span class="icon-name">{{ icon.name }}</span>
            <span class="icon-pips" :class="`icon-pips--${icon.relationship.toLowerCase()}`">
              <template v-if="icon.bonus > 0">{{ iconSymbol(icon.relationship).repeat(icon.bonus) }}</template>
              <template v-else>–</template>
            </span>
          </template>
          <template v-else>
            <select class="icon-edit icon-edit--relationship" :name="`system.icons.${icon.key}.relationship.value`" v-model="icon.raw.relationship.value">
              <option value="Positive">{{ localize('ARCHMAGE.Positive') }}</option>
              <option value="Negative">{{ localize('ARCHMAGE.Negative') }}</option>
              <option value="Conflicted">{{ localize('ARCHMAGE.Conflicted') }}</option>
            </select>
            <input type="number" class="icon-edit icon-edit--bonus" :name="`system.icons.${icon.key}.bonus.value`" v-model="icon.raw.bonus.value">
            <input type="text" class="icon-edit icon-edit--name" :name="`system.icons.${icon.key}.name.value`" v-model="icon.raw.name.value">
          </template>
        </li>
      </ul>
      <p v-else class="placeholder">None</p>
    </section>
  </aside>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import { DiceArchmage } from '@src/module/actor/dice.js';

const props = defineProps(['actor']);

// DiceArchmage needs the real actor document; props.actor is the context's
// toObject() clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

const abilities = computed(() => props.actor?.system?.abilities ?? {});
const backgrounds = computed(() =>
  Object.entries(props.actor?.system?.backgrounds ?? {})
    .filter(([_, bg]) => bg.isActive.value === true && (editing.value || bg.bonus.value || bg.name.value))
    .map(([key, bg]) => ({ key, raw: bg, name: bg.name.value, bonus: bg.bonus.value }))
);
const icons = computed(() =>
  Object.entries(props.actor?.system?.icons ?? {})
    .filter(([_, icon]) => icon.isActive.value === true)
    .map(([key, icon]) => ({
      key,
      raw: icon,
      name: icon.name.value,
      relationship: icon.relationship.value,
      bonus: icon.bonus.value
    }))
);

function formatBonus(bonus) {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}
function abilityAbbr(label) {
  return String(label ?? '').slice(0, 3).toUpperCase();
}
function rollAbility(key) {
  DiceArchmage.BackgroundRoll(actorDocument, { defaultAbility: key });
}
function rollBackground(name) {
  DiceArchmage.BackgroundRoll(actorDocument, { defaultBackground: name });
}
function iconSymbol(relationship) {
  const symbols = {
    'Positive': '+',
    'Negative': '-',
    'Conflicted': '~'
  };
  return symbols[relationship] ?? '?';
}
</script>

<style scoped lang="scss">
  .sheet-sidebar {
    flex: 0 0 250px;
    overflow-y: auto;
    border-right: 1px solid var(--color-border-dark, #0003);
  }

  .unit {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border-dark, #0003);

    &:last-child {
      border-bottom: none;
    }
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-family: $font-stack-secondary;
    font-size: var(--font-size-12, 0.75rem);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ability-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
  }

  .ability-button,
  .background-button {
    width: 100%;
  }

  .ability-button {
    justify-content: center;
  }

  .ability-edit {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    input[type='number'] {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
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

  .background-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .background-bonus {
    text-align: right;
  }

  .background-edit {
    display: flex;
    gap: 0.25rem;

    input[type='number'] {
      flex: 0 0 3rem;
      padding: 0 0.25rem;
      text-align: center;
    }

    input[type='text'] {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  .icon-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .icon-row {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
  }

  .icon-roll {
    align-self: center;
  }

  .icon-name {
    flex: 1;
  }

  .icon-pips {
    font-weight: 600;
    letter-spacing: 0.1em;
    white-space: nowrap;

    &.icon-pips--positive { color: var(--c-hit, #023602); }
    &.icon-pips--negative { color: var(--c-red, #e01616); }
    &.icon-pips--conflicted { color: var(--c-yellow, #ddb20b); }
  }

  .icon-edit--relationship {
    flex: 0 0 auto;
  }

  .icon-edit--bonus {
    flex: 0 0 3rem;
    padding: 0 0.25rem;
    text-align: center;
  }

  .icon-edit--name {
    flex: 1 1 auto;
    min-width: 0;
  }

  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--color-text-dark-secondary, #7a7971);
  }

  .filler {
    margin: 0;
    color: var(--color-text-dark-secondary, #7a7971);
  }
</style>
