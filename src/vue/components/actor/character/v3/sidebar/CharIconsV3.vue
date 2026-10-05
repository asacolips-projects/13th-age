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
            <i class="fas icon-relationship" :class="relationshipIcon(icon.relationship)"></i>
            {{ icon.raw.bonus.value }} {{ icon.name }}
          </span>
          <span class="icon-dice">
            <button v-for="die in dice(icon)" :key="die.index" type="button" class="icon-die"
              :data-tooltip="dieTooltip(die.value)" @click="cycleDie(icon, die.index)">
              <i v-if="dieIcon(die.value)" class="fas" :class="dieIcon(die.value)"></i>
            </button>
          </span>
        </template>
        <template v-else>
          <select class="icon-edit icon-edit--relationship" :class="{ 'field-empty': isBlank(icon.raw.relationship.value) }"
            :name="`system.icons.${icon.key}.relationship.value`"
            v-model="icon.raw.relationship.value" :title="localize(`ARCHMAGE.${icon.raw.relationship.value}`)">
            <option value="Positive" :title="localize('ARCHMAGE.Positive')">+</option>
            <option value="Negative" :title="localize('ARCHMAGE.Negative')">-</option>
            <option value="Conflicted" :title="localize('ARCHMAGE.Conflicted')">±</option>
          </select>
          <input type="number" class="icon-edit icon-edit--bonus" :class="{ 'field-empty': isZeroish(icon.raw.bonus.value) }"
            :name="`system.icons.${icon.key}.bonus.value`"
            v-model="icon.raw.bonus.value" placeholder="0">
          <input type="text" class="icon-edit icon-edit--name" :class="{ 'field-empty': isBlank(icon.raw.name.value) }"
            :name="`system.icons.${icon.key}.name.value`"
            v-model="icon.raw.name.value" :placeholder="localize('ARCHMAGE.icon')">
        </template>
      </li>
    </ul>
    <p v-else class="v3-empty">{{ localize('ARCHMAGE.CHARACTERSHEETV3.none') }}</p>
    <div v-if="editing" class="icon-controls">
      <button type="button" class="icon-toggle" :disabled="!nextIconKey" @click="enableNextIcon"><i class="fas fa-plus"></i></button>
      <button type="button" class="icon-toggle" :disabled="!lastEnabledKey" @click="disableLastIcon"><i class="fas fa-minus"></i></button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { isBlank, isZeroish, localize } from '@/methods/Helpers';
import { useActiveToggles } from '@/composables/useActiveToggles';
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

const { nextKey: nextIconKey, lastEnabledKey, enableNext: enableNextIcon, disableLast: disableLastIcon } =
  useActiveToggles(actorDocument, 'icons', () => allIcons.value);

// Font Awesome glyph for the icon's relationship; unknown values fall
// back to a question mark.
function relationshipIcon(relationship) {
  const icons = {
    'Positive': 'fa-plus',
    'Negative': 'fa-minus',
    'Conflicted': 'fa-plus-minus'
  };
  return icons[relationship] ?? 'fa-question';
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

// Font Awesome glyph per rolled state. 1e shows the die face (5/6), 2e a
// plus for a full benefit and a spiral for a partial one. The alternate
// method replaces the 6 with a cross marking a claimed benefit.
function dieIcon(value) {
  const icons = is2e ? {5: 'fa-spiral', 6: 'fa-plus'} : {5: 'fa-5', 6: 'fa-6'};
  if (altIconRolling) {
    delete icons[5];
    icons[6] = 'fa-times';
  }
  return icons[value] ?? '';
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
  @import 'v3/empty';

.icon-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Center instead of baseline: the die boxes are fixed-size squares, so
   center alignment keeps rows steady whether a box is empty or filled. */
.icon-row {
  display: flex;
  align-items: center;
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

  .icon-relationship {
    margin-right: 0.25rem;
  }
}

.icon-dice {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 0 0 auto;
}

/* Per-die checkbox: mimics the native checkbox look, shows the die's state
   (empty, rolled 5/6) as a Font Awesome glyph and cycles it on click. Fixed
   1:1 size regardless of content so rows don't shift when a box empties;
   the glyph is scaled up to fill more of the box. */
.icon-die {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: transparent;
  font-size: var(--font-size-10);

  .fas {
    font-size: 1.2em;
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

.icon-controls {
  display: flex;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;

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
  border: 1px solid var(--color-border);
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
