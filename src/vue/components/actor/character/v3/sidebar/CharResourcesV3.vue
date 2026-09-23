<template>
  <!-- Per-combat resources: enabled per-actor in the settings tab. -->
  <section v-if="perCombat.commandPoints?.enabled" class="unit unit--command-points">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints') }}</h2>
    <div class="resource-row">
      <input type="number" name="system.resources.perCombat.commandPoints.current"
        v-model="perCombat.commandPoints.current">
      <div class="command-rolls">
        <!-- TODO: Add support for epic feat to bump to d6. -->
        <a class="rollable" data-roll-type="command" data-roll-opt="d4">d4</a>
        <a class="rollable" data-roll-type="command" data-roll-opt="d3">d3</a>
      </div>
    </div>
  </section>

  <section v-if="perCombat.focus?.enabled" class="unit unit--focus">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.focus') }}</h2>
    <div class="resource-row">
      <input type="checkbox" name="system.resources.perCombat.focus.current" v-model="perCombat.focus.current">
    </div>
  </section>

  <section v-if="perCombat.momentum?.enabled" class="unit unit--momentum">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.momentum') }}</h2>
    <div class="resource-row">
      <input type="checkbox" name="system.resources.perCombat.momentum.current" v-model="perCombat.momentum.current">
    </div>
  </section>

  <section v-if="perCombat.rhythm?.enabled && secondEdition" class="unit unit--rhythm">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rhythm') }}</h2>
    <div class="resource-row">
      <select name="system.resources.perCombat.rhythm.current" v-model="perCombat.rhythm.current">
        <option value="none">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.none') }}</option>
        <option value="offense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense') }}</option>
        <option value="defense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense') }}</option>
      </select>
    </div>
  </section>

  <section v-if="perCombat.bravado?.enabled && secondEdition" class="unit unit--bravado">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.bravado') }}</h2>
    <div class="resource-row">
      <input type="number" name="system.resources.perCombat.bravado.current" v-model="perCombat.bravado.current">
    </div>
  </section>

  <!-- Custom resources: enabled per-actor in the settings tab, tracked here. -->
  <section v-for="resource in customResources" :key="resource.key" class="unit unit--custom">
    <input type="text" :name="`system.resources.spendable.${resource.key}.label`" class="resource-label"
      v-model="resource.raw.label" :placeholder="localize(`ARCHMAGE.CHARACTER.RESOURCES.${resource.key}`)">
    <Progress :name="resource.key" :current="resource.raw.current" :max="resource.raw.max" />
    <div class="resource-row">
      <input type="number" :name="`system.resources.spendable.${resource.key}.current`"
        v-model="resource.raw.current">
      <span class="resource-separator">/</span>
      <input type="number" :name="`system.resources.spendable.${resource.key}.max`" v-model="resource.raw.max">
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';

const props = defineProps(['actor']);

const perCombat = computed(() => props.actor?.system?.resources?.perCombat ?? {});
// Same gate the V2 resources strip uses; not reactive, but resource sections
// re-render with the actor context.
const secondEdition = game.settings.get('archmage', 'secondEdition') === true;
const customResources = computed(() =>
  Object.entries(props.actor?.system?.resources?.spendable ?? {})
    .filter(([key, resource]) => key.includes('custom') && resource.enabled)
    .map(([key, resource]) => ({ key, raw: resource }))
);
</script>

<style scoped lang="scss">
.resource-row {
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

.resource-separator {
  color: var(--color-text-dark-secondary, #7a7971);
}

.command-rolls {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-align: center;
}

.unit--custom {
  .resource-label {
    width: 100%;
    margin-bottom: 0.25rem;
    padding: 0 0.25rem;
    font-family: $font-stack-secondary;
    font-size: var(--font-size-12, 0.75rem);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
</style>
