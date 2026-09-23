<template>
  <!-- Per-combat resources: enabled per-actor in the settings tab. -->
  <section v-if="perCombat.commandPoints?.enabled" class="unit unit--command-points">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints') }}</h2>
    <div class="resource-row">
      <template v-if="!editing">
        <span class="resource-value">{{ perCombat.commandPoints.current }}</span>
        <div class="command-rolls">
          <!-- TODO: Add support for epic feat to bump to d6. -->
          <a class="rollable" data-roll-type="command" data-roll-opt="d4">d4</a>
          <a class="rollable" data-roll-type="command" data-roll-opt="d3">d3</a>
        </div>
      </template>
      <input v-else type="number" name="system.resources.perCombat.commandPoints.current"
        v-model="perCombat.commandPoints.current">
    </div>
  </section>

  <section v-if="perCombat.focus?.enabled" class="unit unit--focus">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.focus') }}</h2>
    <div class="resource-row">
      <!-- Binary state stays toggleable in view mode, like the death saves. -->
      <a v-if="!editing" class="resource-value resource-toggle"
        :class="{ 'resource-value--on': perCombat.focus.current }" @click="toggleResource('focus')">
        {{ perCombat.focus.current ? '✓' : '–' }}
      </a>
      <input v-else type="checkbox" name="system.resources.perCombat.focus.current" v-model="perCombat.focus.current">
    </div>
  </section>

  <section v-if="perCombat.momentum?.enabled" class="unit unit--momentum">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.momentum') }}</h2>
    <div class="resource-row">
      <!-- Binary state stays toggleable in view mode, like the death saves. -->
      <a v-if="!editing" class="resource-value resource-toggle"
        :class="{ 'resource-value--on': perCombat.momentum.current }" @click="toggleResource('momentum')">
        {{ perCombat.momentum.current ? '✓' : '–' }}
      </a>
      <input v-else type="checkbox" name="system.resources.perCombat.momentum.current"
        v-model="perCombat.momentum.current">
    </div>
  </section>

  <section v-if="perCombat.rhythm?.enabled && secondEdition" class="unit unit--rhythm">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rhythm') }}</h2>
    <div class="resource-row">
      <span v-if="!editing" class="resource-value">{{ rhythmLabel(perCombat.rhythm.current) }}</span>
      <select v-else name="system.resources.perCombat.rhythm.current" v-model="perCombat.rhythm.current">
        <option value="none">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.none') }}</option>
        <option value="offense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense') }}</option>
        <option value="defense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense') }}</option>
      </select>
    </div>
  </section>

  <section v-if="perCombat.bravado?.enabled && secondEdition" class="unit unit--bravado">
    <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.bravado') }}</h2>
    <div class="resource-row">
      <span v-if="!editing" class="resource-value">{{ perCombat.bravado.current }}</span>
      <input v-else type="number" name="system.resources.perCombat.bravado.current" v-model="perCombat.bravado.current">
    </div>
  </section>

  <!-- Custom resources: enabled per-actor in the settings tab, tracked here. -->
  <section v-for="resource in customResources" :key="resource.key" class="unit unit--custom">
    <h2 v-if="!editing" class="unit-title">{{ resource.label }}</h2>
    <input v-else type="text" :name="`system.resources.spendable.${resource.key}.label`" class="resource-label"
      v-model="resource.raw.label" :placeholder="localize(`ARCHMAGE.CHARACTER.RESOURCES.${resource.key}`)">
    <Progress :name="resource.key" :current="resource.raw.current" :max="resource.raw.max" />
    <div class="resource-row">
      <template v-if="!editing">
        <span class="resource-value">{{ resource.raw.current }}</span>
        <span class="resource-separator">/</span>
        <span class="resource-value">{{ resource.raw.max }}</span>
      </template>
      <template v-else>
        <input type="number" :name="`system.resources.spendable.${resource.key}.current`"
          v-model="resource.raw.current">
        <span class="resource-separator">/</span>
        <input type="number" :name="`system.resources.spendable.${resource.key}.max`" v-model="resource.raw.max">
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';

const props = defineProps(['actor']);

// Updates from view mode (toggles) go through the real actor document;
// props.actor is the context's toObject() clone.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

// Same gate the V2 resources strip uses; game settings aren't reactive, but
// resource sections re-render with the actor context.
const secondEdition = computed(() => game.settings.get('archmage', 'secondEdition') === true);

const perCombat = computed(() => props.actor?.system?.resources?.perCombat ?? {});

const customResources = computed(() =>
  Object.entries(props.actor?.system?.resources?.spendable ?? {})
    .filter(([key, resource]) => key.includes('custom') && resource.enabled)
    .map(([key, resource]) => ({
      key,
      raw: resource,
      label: resource.label || localize(`ARCHMAGE.CHARACTER.RESOURCES.${key}`)
    }))
);

function rhythmLabel(current) {
  return localize(`ARCHMAGE.CHARACTER.RHYTHMCHOICES.${current || 'none'}`);
}

// Flip a binary per-combat resource straight to the document so it persists
// from view mode, where there is no named input for the form to submit.
function toggleResource(key) {
  const current = perCombat.value[key]?.current === true;
  actorDocument?.update({ [`system.resources.perCombat.${key}.current`]: !current });
}
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

.resource-value {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  font-variant-numeric: tabular-nums;

  &.resource-value--on {
    color: var(--c-hit, #023602);
  }
}

.resource-toggle {
  cursor: pointer;

  &:hover {
    text-shadow: 0 0 5px var(--color-shadow-primary, #0003);
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
</style>
