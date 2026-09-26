<template>
  <section class="unit unit--icons">
    <h2 class="unit-title">{{ localize('ARCHMAGE.iconRelationships') }}</h2>
    <ul v-if="icons.length" class="icon-list">
      <li v-for="icon in icons" :key="icon.key" class="icon-row" :class="{ 'icon-row--edit': editing }">
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
            v-model="icon.raw.relationship.value" :title="localize(`ARCHMAGE.${icon.raw.relationship.value}`)">
            <option value="Positive" :title="localize('ARCHMAGE.Positive')">+</option>
            <option value="Negative" :title="localize('ARCHMAGE.Negative')">-</option>
            <option value="Conflicted" :title="localize('ARCHMAGE.Conflicted')">±</option>
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
    'Conflicted': '±'
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
    color: var(--v3-positive);
  }

  &.icon-pips--negative {
    color: var(--v3-negative);
  }

  &.icon-pips--conflicted {
    color: var(--v3-conflicted);
  }
}

.icon-edit--relationship {
  flex: 0 0 auto;
  text-align: center;
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

/* Edit controls don't fit the 250px sidebar on one line: the symbol
   select and bonus input split the first row evenly, the name input
   wraps to a full-width second row, and a row gap separates the groups. */
.icon-row--edit {
  flex-wrap: wrap;
  row-gap: 0.5rem;
  border: 1px solid var(--v3-border-header);
  border-radius: 3px;
  padding: 0.375rem 0.5rem;

  .icon-edit--relationship,
  .icon-edit--bonus {
    flex: 1 1 0;
  }

  .icon-edit--name {
    flex: 1 1 100%;
  }
}
</style>
