<template>
  <section class="unit unit--backgrounds">
    <h2 class="unit-title">{{ localize('ARCHMAGE.backgrounds') }}</h2>
    <ul v-if="backgrounds.length" class="background-list">
      <li v-for="background in backgrounds" :key="background.key">
        <button v-if="!editing" class="background-button" type="button" @click="rollBackground(background.name)">
          <span class="background-bonus">{{ formatBonus(background.bonus) }}</span>
          {{ background.name }}
        </button>
        <div v-else class="background-edit">
          <input type="number" :name="`system.backgrounds.${background.key}.bonus.value`"
            v-model="background.raw.bonus.value" placeholder="0"
            :class="{ 'field-empty': isZeroish(background.raw.bonus.value) }">
          <input type="text" :name="`system.backgrounds.${background.key}.name.value`"
            v-model="background.raw.name.value" :placeholder="localize('ARCHMAGE.backgroundName')"
            :class="{ 'field-empty': isBlank(background.raw.name.value) }">
        </div>
      </li>
    </ul>
    <p v-else class="v3-empty">{{ localize('ARCHMAGE.CHARACTERSHEETV3.none') }}</p>
    <div v-if="editing" class="background-controls">
      <button type="button" class="background-toggle" :disabled="!nextBgKey" @click="enableNextBackground"><i class="fas fa-plus"></i></button>
      <button type="button" class="background-toggle" :disabled="!lastEnabledKey" @click="disableLastBackground"><i class="fas fa-minus"></i></button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { isBlank, isZeroish, localize } from '@/methods/Helpers';
import { useActiveToggles } from '@/composables/useActiveToggles';
import { DiceArchmage } from '@src/module/actor/dice.js';

const props = defineProps(['actor']);

// DiceArchmage needs the real actor document; props.actor is the context's
// toObject() clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

const backgrounds = computed(() =>
  Object.entries(props.actor?.system?.backgrounds ?? {})
    .filter(([_, bg]) => bg.isActive.value === true && (editing.value || bg.bonus.value || bg.name.value))
    .map(([key, bg]) => ({ key, raw: bg, name: bg.name.value, bonus: bg.bonus.value }))
);

const allBackgrounds = computed(() =>
  Object.entries(props.actor?.system?.backgrounds ?? {})
);

const { nextKey: nextBgKey, lastEnabledKey, enableNext: enableNextBackground, disableLast: disableLastBackground } =
  useActiveToggles(actorDocument, 'backgrounds', () => allBackgrounds.value);

function formatBonus(bonus) {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}
function rollBackground(name) {
  DiceArchmage.BackgroundRoll(actorDocument, { defaultBackground: name });
}
</script>

<style scoped lang="scss">
  @import 'v3/empty';

.background-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.background-button {
  width: 100%;
}

.background-bonus {
  text-align: right;
}

.background-edit {
  display: flex;
  gap: 0.25rem;

  input[type='number'] {
    flex: 0 0 2rem;
    padding: 0 0.25rem;
    text-align: center;
  }

  input[type='text'] {
    flex: 1 1 auto;
    min-width: 0;
  }
}

.background-controls {
  display: flex;
  gap: 0.25rem;
  padding-top: 0.25rem;

  .background-toggle {
    flex: 1;
  }
}
</style>
