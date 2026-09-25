<template>
  <section class="tab-triggers">
    <template v-if="powersWithTriggers.length">
      <!-- Column labels on the same grid as the rows, with the grouping
           toggle at the right-hand end. -->
      <header class="trigger-columns">
        <h2 class="column-label"></h2>
        <h2 class="column-label">{{ localize('ARCHMAGE.power') }}</h2>
        <h2 class="column-label">{{ localize('ARCHMAGE.CHAT.trigger') }}</h2>
        <label class="filter-custom-groups">
          <input type="checkbox" v-model="useCustomGroups">
          <span>Custom Groups</span>
        </label>
      </header>

      <section v-for="group in groups" :key="group.title" class="trigger-group">
        <h3 v-if="group.title" class="group-title">{{ group.title }}</h3>
        <ul class="trigger-list">
          <TriggerRowV3 v-for="power in group.powerRows" :key="power._id" :power="power" :actor="actor" :context="context"/>
        </ul>
      </section>
    </template>

    <p v-else class="trigger-empty">No powers with triggers.</p>
  </section>
</template>

<script setup>
/**
 * The triggers tab: every power with trigger text, listed with the trigger
 * in its own column and expanding to the power's full details. Custom
 * grouping mirrors the V2 triggers tab, persisting under the same flag.
 */
import { computed, ref, watch } from 'vue';
import { getActor, localize } from '@/methods/Helpers';
import TriggerRowV3 from '../parts/TriggerRowV3.vue';

const props = defineProps(['actor', 'editable', 'context']);

const powersWithTriggers = computed(() => (props.actor?.items ?? [])
  .filter(x => x.type === 'power')
  .filter(x => x.system.trigger?.value)
  .sort((a, b) => (a.sort || 0) - (b.sort || 0)));

// Read the V2 flag so the two sheets agree, and keep it current from here.
const useCustomGroups = ref(['true', true].includes(
  props.actor?.flags?.archmage?.sheetDisplay?.triggers?.customGroups?.value));

watch(useCustomGroups, value => {
  // Pack actors have no setFlag; getActor resolves the live document from the
  // context actor's drag data.
  if (props.actor?.pack) return;
  getActor(props.actor).then(actor => {
    actor?.setFlag('archmage', 'sheetDisplay.triggers.customGroups.value', value);
  });
});

const groups = computed(() => {
  if (!useCustomGroups.value) {
    return [{ title: '', powerRows: powersWithTriggers.value }];
  }

  // Group by the free-text group field; ungrouped powers collect at the top.
  const byGroup = new Map();
  for (const power of powersWithTriggers.value) {
    const key = power.system.group?.value || '';
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(power);
  }
  return [...byGroup.keys()].sort().map(title => ({
    title,
    powerRows: byGroup.get(title),
  }));
});
</script>

<style scoped lang="scss">
  // The label row sits on the same columns as TriggerRowV3's summary grid,
  // with matching horizontal padding so the labels line up with the cells.
  // A trailing auto column holds the grouping toggle at the right edge; the
  // 1fr trigger column still starts level with the rows' trigger text.
  .trigger-columns {
    display: grid;
    grid-template-columns: 2rem minmax(6rem, 10rem) minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.375rem 0.25rem;
    border-bottom: 1px solid var(--v3-border);
    font-family: var(--v3-font-label);
    font-size: var(--v3-font-size-label);
  }

  .filter-custom-groups {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
  }

  .column-label {
    margin: 0;
    font-size: var(--v3-font-size-label);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--v3-text-muted);
  }

  .trigger-group {
    margin-top: 0.75rem;
  }

  .group-title {
    margin: 0 0 0.25rem;
    font-family: var(--v3-font-display);
    font-size: var(--v3-font-size-value);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .trigger-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .trigger-empty {
    margin: 0;
    font-style: italic;
    color: var(--v3-text-muted);
  }
</style>
