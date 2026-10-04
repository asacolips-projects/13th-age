<template>
  <section class="sheet-stats-header">
    <!-- Row 1: vitals -->
    <div class="stats-row">
      <div class="stats-unit stats-unit--hp">
        <h2 class="unit-title">{{ localize('ARCHMAGE.hitPoints') }}</h2>
        <Progress name="hp" :current="actor.system.attributes.hp.value" :max="actor.system.attributes.hp.max"
          :temp="actor.system.attributes.hp.temp" />
        <!-- Current + temp stay editable in play. Max is editable in edit
             mode, except when it's calculated automatically from level/CON. -->
        <p class="unit-value">
          <input type="number" name="system.attributes.hp.value" v-model="actor.system.attributes.hp.value">
          <span class="value-separator">+</span>
          <input type="number" name="system.attributes.hp.temp" placeholder="temp" v-model="actor.system.attributes.hp.temp">
          <span class="value-separator">/</span>
          <input v-if="editing" type="number" name="system.attributes.hp.max"
            v-model="actor.system.attributes.hp.max" :disabled="actor.system.attributes.hp.automatic"
            :data-tooltip="actor.system.attributes.hp.automatic ? localize('ARCHMAGE.calculatedHPMaxHint') : null">
          <span v-else class="value-static">{{ actor.system.attributes.hp.max }}</span>
        </p>
      </div>

      <div class="stats-unit stats-unit--recoveries">
        <h2 class="unit-title">
          {{ localize('ARCHMAGE.recoveries') }}
            <RollableV3 name="recovery" @click="rollRecovery">{{ recoveryFormula }}</RollableV3>
        </h2>
          <Progress name="recoveries" :current="actor.system.attributes.recoveries.value"
            :max="actor.system.attributes.recoveries.max" />
        <p class="unit-value">
          <input type="number" name="system.attributes.recoveries.value"
            v-model="actor.system.attributes.recoveries.value">
          <span class="value-separator">/</span>
          <input v-if="editing" type="number" name="system.attributes.recoveries.max"
            v-model="actor.system.attributes.recoveries.max" :disabled="actor.system.attributes.recoveries.automatic"
            :data-tooltip="actor.system.attributes.recoveries.automatic ? localize('ARCHMAGE.calculatedRecoveriesMaxHint') : null">
          <span v-else class="value-static">{{ actor.system.attributes.recoveries.max }}</span>
        </p>
      </div>

      <div class="stats-unit stats-unit--saves">
        <!-- Disengage roll plus the in-play fail tracks, stacked vertically.
             Difficulty saves (easy/normal/hard) live in the sidebar. -->
        <div class="saves-stack">
          <span class="save-track">
            <RollableV3 name="save" @click="rollSave('death')">{{ localize('ARCHMAGE.SAVE.death') }}</RollableV3>
          <!-- Death fail track: failed steps show skulls in 2e, X's in 1e. -->
          <button v-for="step in deathFails.max" :key="`death-${step}`" type="button" class="fail-step"
            :class="{ 'is-failed': step <= deathFails.value }"
            :aria-pressed="step <= deathFails.value"
            :aria-label="`${localize('ARCHMAGE.SAVE.death')} ${step}`"
            @click="updateFails('deathFails', step)">{{ step <= deathFails.value ? (secondEdition ? '💀' : '❌') : '' }}</button>
          </span>
          <span class="save-track">
            <RollableV3 name="save" @click="rollSave('lastGasp')">{{ localize('ARCHMAGE.SAVE.lastGasp') }}</RollableV3>
            <button v-for="step in lastGaspFails.max" :key="`lastgasp-${step}`" type="button" class="fail-step"
              :class="{ 'is-failed': step <= lastGaspFails.value }"
              :aria-pressed="step <= lastGaspFails.value"
              :aria-label="`${localize('ARCHMAGE.SAVE.lastGasp')} ${step}`"
              @click="updateFails('lastGaspFails', step)">{{ step <= lastGaspFails.value ? '❌' : '' }}</button>
          </span>
          <RollableV3 name="save" @click="rollDisengage">{{
            localize('ARCHMAGE.SAVE.disengage') }}</RollableV3>
        </div>
      </div>
    </div>

    <!-- Row 2: resources + rerolls. Renders nothing when every resource is
         disabled, so no empty row is left behind. -->
    <CharResourcesV3 :actor="actor" />
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { isSecondEdition, localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
import RollableV3 from './RollableV3.vue';
import CharResourcesV3 from './CharResourcesV3.vue';

const props = defineProps(['actor']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

// 2e death saves mark failures with skulls; 1e uses X's. Non-reactive: game
// settings don't change mid-session.
const secondEdition = computed(isSecondEdition);

const recoveryFormula = computed(() => {
  const recoveries = props.actor?.system?.attributes?.recoveries;
  // The averageRecoveries flag swaps the formula display for the pre-rolled average.
  if (props.actor?.flags?.archmage?.averageRecoveries && recoveries?.avg) {
    return String(recoveries.avg);
  }
  if (recoveries?.formula && recoveries?.avg) return recoveries.formula;
  return localize('ARCHMAGE.recoveryRoll');
});

const deathFails = computed(() => {
  const saves = props.actor?.system?.attributes?.saves ?? {};
  return {
    max: parseInt(saves.deathFails?.max) || 4,
    value: Number(saves.deathFails?.value) || 0
  };
});

const lastGaspFails = computed(() => {
  const saves = props.actor?.system?.attributes?.saves ?? {};
  return {
    max: parseInt(saves.lastGaspFails?.max) || 4,
    value: Number(saves.lastGaspFails?.value) || 0
  };
});

function rollSave(difficulty) {
  actorDocument?.rollSave(difficulty);
}

function rollDisengage() {
  actorDocument?.rollDisengage();
}

function rollRecovery(event) {
  actorDocument?.rollRecoveryDialog(event);
}

// Fail-track clicks go through the actor document, shared with the V2
// sheet's _updateFails: clicking step N sets the count to N, or unchecks it
// (N - 1) if it was already checked.
function updateFails(saveType, opt) {
  actorDocument?.updateFails(saveType, opt);
}
</script>

<style scoped lang="scss">
  @import 'v3/unit-title';

.sheet-stats-header {
  /* Fixed-height bar pinned to the top of the right column; CharMainV3
     takes the rest. Explicit flex so it doesn't depend on Foundry's
     utility classes being present. */
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

.stats-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.stats-unit {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.375rem 0.75rem;
  border-right: 1px solid var(--color-border);

  &:last-child {
    border-right: none;
  }
}

.unit-title {
  @include v3-unit-title;
}

/* Recoveries: push the roll link to the right edge of the unit title. */
.stats-unit--recoveries .unit-title {
  display: flex;
  align-items: baseline;

  .rollable {
    margin-left: auto;
    text-transform: none;
  }
}

.unit-value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: var(--font-size-16);
}

/* Disengage roll + fail tracks, stacked vertically and spread evenly
   across the row height. */
.stats-unit--saves {
  display: flex;
  flex-direction: column;
}

.saves-stack {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 0.125rem; /* minimum spacing; justify-content does the spreading */
  flex: 1 1 auto;
  font-size: var(--font-size-12);
}

.save-track {
  display: flex;
  align-items: center;
  white-space: nowrap;

  .rollable {
    flex: 1;
  }
}

/* Fail tracks: unfilled steps are empty boxes; failed ones show a glyph
   (skull for 2e death saves, an X for last-gasp saves).
   height/min-height reset Foundry's global button sizing (28px) that
   would otherwise double the track height. */
.fail-step {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  padding: 0;
  flex: 0 0 var(--font-size-14);
  margin: 0 0 0 3px;
  width: var(--font-size-14);
  height: var(--font-size-14);
  min-height: 0;
  line-height: 1;
  font-size: var(--font-size-14);
  cursor: pointer;
  text-shadow: 0 0 5px var(--c-black);

  &.is-failed {
    border-color: transparent;
  }
}

input[type='number'] {
  width: 3.5rem;
  padding: 0 0.25rem;
  text-align: center;
}

/* Static display of a value that's input-only in edit mode (e.g. hp max). */
.value-static {
  font-variant-numeric: tabular-nums;
}
</style>
