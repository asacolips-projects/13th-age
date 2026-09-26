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
          <RollableV3 name="save" @click="rollDisengage">{{
            localize('ARCHMAGE.SAVE.disengage') }} {{ disengageValue }}+</RollableV3>
          <span class="save-track">
            <RollableV3 name="save" @click="rollSave('death')">{{ localize('ARCHMAGE.SAVE.death') }}</RollableV3>
            <input type="checkbox" v-for="step in deathFails.max" :key="`death-${step}`"
              :checked="step <= deathFails.value" @change="updateFails('deathFails', step)" />
          </span>
          <span class="save-track">
            <RollableV3 name="save" @click="rollSave('lastGasp')">{{ localize('ARCHMAGE.SAVE.lastGasp') }}</RollableV3>
            <input type="checkbox" v-for="step in lastGaspFails.max" :key="`lastgasp-${step}`"
              :checked="step <= lastGaspFails.value" @change="updateFails('lastGaspFails', step)" />
          </span>
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
import { localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
import RollableV3 from './RollableV3.vue';
import CharResourcesV3 from './CharResourcesV3.vue';

const props = defineProps(['actor', 'editable']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

const disengageValue = computed(() => {
  const attrs = props.actor?.system?.attributes;
  return (Number(attrs?.disengage) || 0)
    + (Number(attrs?.disengageBonus) || 0)
    + (Number(attrs?.saves?.disengageBonus) || 0);
});

const recoveryFormula = computed(() => {
  const recoveries = props.actor?.system?.attributes?.recoveries;
  if (recoveries?.formula && recoveries?.avg) return recoveries.formula; //`${recoveries.formula} (${recoveries.avg})`;
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

// Mirror the V2 behavior: clicking the Nth checkbox sets the fail count to N,
// or unchecks it (N - 1) if it was already checked.
function updateFails(saveType, opt) {
  const current = Number(props.actor?.system?.attributes?.saves?.[saveType]?.value) || 0;
  actorDocument?.update({ [`system.attributes.saves.${saveType}.value`]: current === opt ? opt - 1 : opt });
}
</script>

<style scoped lang="scss">
.sheet-stats-header {
  /* Fixed-height bar pinned to the top of the right column; CharMainV3
     takes the rest. Explicit flex so it doesn't depend on Foundry's
     utility classes being present. */
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--v3-border-header);
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
  border-right: 1px solid var(--v3-border-header);

  &:last-child {
    border-right: none;
  }
}

.unit-title {
  margin: 0 0 0.25rem;
  font-family: var(--v3-font-display);
  font-size: var(--v3-font-size-title);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.unit-value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: var(--v3-font-size-value);
}

.unit-subrow {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: var(--v3-font-size-title);

  /* Slim the progress bars into the subrow line. */
  .progress-bar {
    flex: 1 1 auto;
    width: auto;
    margin: 0;
  }
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
  font-size: var(--v3-font-size-title);
}

.save-track {
  display: flex;
  align-items: center;
  white-space: nowrap;

  .rollable {
    flex: 1;
  }

  /* Auto margin on the first checkbox shoves the fail-track group to the
     right edge; the rest sit 1px apart. */
  input[type='checkbox'] {
    width: 0.875rem;
    height: 0.875rem;
    flex: 0;
    margin: 0 0 0 5px;
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
