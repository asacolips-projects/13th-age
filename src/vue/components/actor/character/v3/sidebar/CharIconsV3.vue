<template>
  <section class="unit unit--icons">
    <h2 class="unit-title">{{ localize('ARCHMAGE.iconRelationships') }}</h2>
    <ul v-if="icons.length" class="icon-list">
      <li v-for="icon in icons" :key="icon.key" class="icon-row">
        <template v-if="!editing">
          <RollableV3 class="icon-roll" data-roll-type="icon" :data-roll-opt="icon.key" />
          <span class="icon-name">{{ icon.name }}</span>
          <span class="icon-pips" :class="`icon-pips--${icon.relationship.toLowerCase()}`">
            <template v-if="icon.bonus > 0">{{ iconSymbol(icon.relationship).repeat(icon.bonus) }}</template>
            <template v-else>–</template>
          </span>
        </template>
        <template v-else>
          <select class="icon-edit icon-edit--relationship" :name="`system.icons.${icon.key}.relationship.value`"
            v-model="icon.raw.relationship.value">
            <option value="Positive">{{ localize('ARCHMAGE.Positive') }}</option>
            <option value="Negative">{{ localize('ARCHMAGE.Negative') }}</option>
            <option value="Conflicted">{{ localize('ARCHMAGE.Conflicted') }}</option>
          </select>
          <input type="number" class="icon-edit icon-edit--bonus" :name="`system.icons.${icon.key}.bonus.value`"
            v-model="icon.raw.bonus.value">
          <input type="text" class="icon-edit icon-edit--name" :name="`system.icons.${icon.key}.name.value`"
            v-model="icon.raw.name.value">
        </template>
      </li>
    </ul>
    <p v-else class="placeholder">None</p>
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import RollableV3 from '../RollableV3.vue';

const props = defineProps(['actor']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

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

  &.icon-pips--positive {
    color: var(--c-hit, #023602);
  }

  &.icon-pips--negative {
    color: var(--c-red, #e01616);
  }

  &.icon-pips--conflicted {
    color: var(--c-yellow, #ddb20b);
  }
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
</style>
