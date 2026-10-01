<template>
  <section class="unit unit--icons">
    <div class="unit-header">
      <h2 class="unit-title">{{ localize('ARCHMAGE.iconRelationships') }}</h2>
      <RollableV3 class="icon-roll" data-roll-type="icon" @click="rollIcons" />
    </div>
    <ul v-if="icons.length" class="icon-list">
      <li v-for="icon in icons" :key="icon.key" class="icon-row" :class="{ 'icon-row--edit': editing }">
        <template v-if="!editing">
          <span class="icon-name">
            {{ iconSymbol(icon.relationship) }}
            {{ icon.raw.bonus.value }}
            {{ icon.name }}
          </span>
          <span class="icon-dice">
            <button v-for="die in dice(icon)" :key="die.index" type="button" class="icon-die"
              :data-tooltip="dieTooltip(die.value)" @click="cycleDie(icon, die.index)">
              {{ dieLabel(die.value) }}
            </button>
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
    <div v-if="editing" class="icon-controls">
      <button type="button" class="icon-toggle" :disabled="!nextIconKey" @click="enableNextIcon">+</button>
      <button type="button" class="icon-toggle" :disabled="!lastEnabledKey" @click="disableLastIcon">-</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import RollableV3 from '../RollableV3.vue';

const props = defineProps(['actor']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));
const actorDocument = inject('actorDocument');

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

const allIcons = computed(() =>
  Object.entries(props.actor?.system?.icons ?? {})
);

// The next icon to enable is the first inactive one; the last enabled icon is
// the last active one in the system.icons order.
const nextIconKey = computed(() =>
  allIcons.value.find(([_, icon]) => icon.isActive?.value !== true)?.[0] ?? null
);

const lastEnabledKey = computed(() => {
  let key = null;
  for (const [k, icon] of allIcons.value) {
    if (icon.isActive?.value === true) key = k;
  }
  return key;
});

function enableNextIcon() {
  if (nextIconKey.value) {
    actorDocument?.update({[`system.icons.${nextIconKey.value}.isActive.value`]: true});
  }
}

function disableLastIcon() {
  if (lastEnabledKey.value) {
    actorDocument?.update({[`system.icons.${lastEnabledKey.value}.isActive.value`]: false});
  }
}

function iconSymbol(relationship) {
  const symbols = {
    'Positive': '+',
    'Negative': '-',
    'Conflicted': '±'
  };
  return symbols[relationship] ?? '?';
}

// Die display settings; game settings aren't reactive, but the sections
// re-render with the actor context.
const is2e = CONFIG.ARCHMAGE.is2e;
const altIconRolling = game.settings.get('archmage', 'alternateIconRollingMethod');

// One box per relationship point; the value comes from the icon's results
// array (0 = empty, 5/6 = rolled results).
function dice(icon) {
  return Array.from({length: icon.bonus}, (_, index) => ({
    index,
    value: icon.raw.results?.[index] ?? 0
  }));
}

// Mirror the V2 icon display's text mapping for rolled values; manually
// claimed states pass through as-is.
function dieLabel(value) {
  const labels = {5: '5', 6: '6'};
  if (altIconRolling) {
    delete labels[5];
    labels[6] = '⨉';
  } else if (is2e) {
    labels[5] = '~';
    labels[6] = '+';
  }
  // Empty boxes render a no-break space so the button keeps the same line
  // box (and height) as a filled one.
  return (labels[value] ?? value) || '\u00a0';
}

function dieTooltip(value) {
  const keys = {};
  if (altIconRolling) {
    keys[6] = 'ARCHMAGE.ICONROLLS.tooltip2ealt6';
  } else if (is2e) {
    keys[5] = 'ARCHMAGE.ICONROLLS.tooltip2e5';
    keys[6] = 'ARCHMAGE.ICONROLLS.tooltip2e6';
  } else {
    keys[5] = 'ARCHMAGE.ICONROLLS.tooltip1e5';
    keys[6] = 'ARCHMAGE.ICONROLLS.tooltip1e6';
  }
  return keys[value] ? localize(keys[value]) : '';
}

// Clicking a die box cycles its result through the edition's states and back
// to empty: 5 -> 6 -> empty (1e), + -> ~ -> empty (2e), x -> empty (2e alt).
function cycleDie(icon, index) {
  const cycle = altIconRolling ? [6, 0] : is2e ? [6, 5, 0] : [5, 6, 0];
  const results = [...(icon.raw.results ?? [])];
  while (results.length < icon.bonus) results.push(0);
  const pos = cycle.indexOf(results[index]);
  results[index] = cycle[(pos + 1) % cycle.length];
  actorDocument?.update({[`system.icons.${icon.key}.results`]: results});
}

// Open the icon roll dialog: roll one icon at a time, or all at once.
function rollIcons() {
  actorDocument?.rollIconsDialog();
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

/* The die button floats to the right of the section title. */
.unit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-roll {
  line-height: 1;
}

.icon-name {
  flex: 1;
}

.icon-dice {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 0 0 auto;
}

/* Per-die checkbox: mimics the native checkbox look, shows the die's state
   (empty, rolled 5/6) and cycles it on click. Fixed 1:1 size regardless of
   content so rows don't shift when a box empties. */
.icon-die {
  width: 1.5em;
  border: 1px solid var(--v3-border-header);
  border-radius: 2px;
  background: transparent;
  font-size: 0.7em;
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

.icon-controls {
  display: flex;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  line-height: 0.5em;

  .icon-toggle {
    flex: 1;
  }
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
