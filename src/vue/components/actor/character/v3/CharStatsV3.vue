<template>
  <section class="sheet-stats flexrow">
    <div class="stats-unit stats-unit--defenses">
      <h2 class="unit-title">{{ localize('ARCHMAGE.defenses') }}</h2>
      <p class="unit-value">
        <span class="defense"><span class="defense-label">AC</span> {{ actor?.system?.attributes?.ac?.value }}</span>
        <span class="defense"><span class="defense-label">PD</span> {{ actor?.system?.attributes?.pd?.value }}</span>
        <span class="defense"><span class="defense-label">MD</span> {{ actor?.system?.attributes?.md?.value }}</span>
      </p>
    </div>

    <div class="stats-unit stats-unit--hp">
      <h2 class="unit-title">{{ localize('ARCHMAGE.hitPoints') }}</h2>
      <p class="unit-value flexrow">
        <input type="number" name="system.attributes.hp.value" v-model="actor.system.attributes.hp.value">
        <span class="value-separator">/</span>
        <input type="number" name="system.attributes.hp.max" v-model="actor.system.attributes.hp.max">
      </p>
      <Progress name="hp" :current="actor.system.attributes.hp.value" :max="actor.system.attributes.hp.max"
        :temp="actor.system.attributes.hp.temp" />
      <p class="unit-subrow flexrow">
        <label for="system.attributes.hp.temp">{{ localize('ARCHMAGE.tempHp') }}</label>
        <input type="number" name="system.attributes.hp.temp" v-model="actor.system.attributes.hp.temp">
      </p>
    </div>

    <div class="stats-unit stats-unit--recoveries">
      <h2 class="unit-title">{{ localize('ARCHMAGE.recoveries') }}</h2>
      <p class="unit-value flexrow">
        <input type="number" name="system.attributes.recoveries.value"
          v-model="actor.system.attributes.recoveries.value">
        <span class="value-separator">/</span>
        <input type="number" name="system.attributes.recoveries.max" v-model="actor.system.attributes.recoveries.max">
      </p>
      <Progress name="recoveries" :current="actor.system.attributes.recoveries.value"
        :max="actor.system.attributes.recoveries.max" />
      <p class="unit-subrow">
        <a class="rollable rollable--recovery" @click="rollRecovery">{{ recoveryFormula }}</a>
      </p>
    </div>

    <div class="stats-unit stats-unit--saves">
      <h2 class="unit-title">{{ localize('ARCHMAGE.saves') }}</h2>
      <p class="unit-value unit-value--stacked">
        <a class="rollable rollable--save" @click="rollSave('easy')">6+ ({{ localize('ARCHMAGE.SAVE.easyShort') }})</a>
        <a class="rollable rollable--save" @click="rollSave('normal')">11+ ({{ localize('ARCHMAGE.SAVE.normalShort')
          }})</a>
        <a class="rollable rollable--save" @click="rollSave('hard')">16+ ({{ localize('ARCHMAGE.SAVE.hardShort') }})</a>
        <a class="rollable rollable--save" @click="rollDisengage">{{ disengageValue }}+ {{
          localize('ARCHMAGE.SAVE.disengage') }}</a>
      </p>
    </div>

    <div class="stats-unit stats-unit--death">
      <div class="death-saves">
        <a class="rollable rollable--save" @click="rollSave('death')">{{ localize('ARCHMAGE.SAVE.death') }}</a>
        <p class="unit-subrow attempts flexrow">
          <input type="checkbox" v-for="step in deathFails.max" :key="`death-${step}`"
            :checked="step <= deathFails.value" @change="updateFails('deathFails', step)" />
        </p>
      </div>
      <div class="last-gasp-saves">
        <a class="rollable rollable--save" @click="rollSave('lastGasp')">{{ localize('ARCHMAGE.SAVE.lastGasp') }}</a>
        <p class="unit-subrow attempts flexrow">
          <input type="checkbox" v-for="step in lastGaspFails.max" :key="`lastgasp-${step}`"
            :checked="step <= lastGaspFails.value" @change="updateFails('lastGaspFails', step)" />
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';

const props = defineProps(['actor', 'editable']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

const disengageValue = computed(() => {
  const attrs = props.actor?.system?.attributes;
  return (Number(attrs?.disengage) || 0)
    + (Number(attrs?.disengageBonus) || 0)
    + (Number(attrs?.saves?.disengageBonus) || 0);
});

const recoveryFormula = computed(() => {
  const recoveries = props.actor?.system?.attributes?.recoveries;
  if (recoveries?.formula && recoveries?.avg) return `${recoveries.formula} (${recoveries.avg})`;
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
.sheet-stats {
  flex: 0 0 auto;
  align-items: start;
  min-height: 4.5rem;
  border-bottom: 1px solid var(--color-border-dark, #0003);
}

.stats-unit {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border-right: 1px solid var(--color-border-dark, #0003);

  &:last-child {
    border-right: none;
  }
}

.unit-title {
  margin: 0 0 0.25rem;
  font-family: $font-stack-secondary;
  font-size: var(--font-size-12, 0.75rem);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dark-secondary, #7a7971);
}

.unit-value {
  margin: 0;
  font-size: var(--font-size-16, 1rem);
}

.unit-value--stacked {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: var(--font-size-14, 0.875rem);
}

.unit-subrow {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: var(--font-size-12, 0.75rem);
  color: var(--color-text-dark-secondary, #7a7971);
}

input[type='number'] {
  width: 3.5rem;
  padding: 0 0.25rem;
  text-align: center;
}

.value-separator {
  color: var(--color-text-dark-secondary, #7a7971);
}

.rollable {
  cursor: pointer;

  &:hover {
    text-shadow: 0 0 5px var(--color-shadow-primary, #0003);
  }
}

.defense {
  display: inline-block;
  margin-right: 0.75rem;

  &:last-child {
    margin-right: 0;
  }
}

.defense-label {
  font-weight: 600;
  color: var(--color-text-dark-secondary, #7a7971);
}

.attempts {
  gap: 0.25rem;

  input[type='checkbox'] {
    width: 0.875rem;
    height: 0.875rem;
    margin: 0;
  }
}

.stats-unit--death {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.25rem;
}

// Mirror of src/scss/v2/components/_progress-bar.scss, which is nested
// under .archmage-v2 and doesn't reach the V3 sheet.
:deep(.progress-bar) {
  width: 100%;
  height: 8px;
  margin: 0.25rem 0;
  border-radius: 50px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--c-black--50, #00000080);

  .progress-track,
  .progress-current,
  .progress-temp {
    background: var(--c-black--15, #00000026);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }

  .progress-current,
  .progress-temp {
    right: auto;
    width: 100%;
    transition: all ease-in-out 0.25s;
    background-color: var(--c-progress-full, #41c179);
    border-radius: 50px;
    overflow: hidden;
    z-index: 3;
    border-right: 1px solid var(--c-black--50, #00000080);

    &.progress-hurt {
      background-color: var(--c-progress-hurt, #f7d601);
    }

    &.progress-staggered {
      background-color: var(--c-progress-staggered, #f78c01);
    }

    &.progress-dire {
      background-color: var(--c-progress-dire, #ca0000);
    }
  }
}
</style>
