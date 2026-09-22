<template>
  <main class="sheet-main flexcol">
    <!-- Placeholder tab strip. Deliberately not parts/Tabs.vue: its styling is
         nested under .archmage-v2 and its mounted() hook needs the V2 root's
         merged-defaults flags computed plus game.i18n persistence under
         archmage.sheetDisplay.tabs.<group>.value. A V3 tabs part is future work. -->
    <nav class="tab-strip flexrow">
      <button v-for="tab in tabs" :key="tab.id" type="button"
        class="tab-link" :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id">
        {{ localize(`ARCHMAGE.${tab.id}`) }}
      </button>
    </nav>

    <div class="tab-content">
      <CharActionPlanV3 v-if="activeTab === 'actionPlan'" :actor="context.actor" :editable="context.editable" />
      <CharTriggersV3 v-else-if="activeTab === 'triggers'" :actor="context.actor" :editable="context.editable" />
      <CharCatalogV3 v-else-if="activeTab === 'catalog'" :actor="context.actor" :editable="context.editable" />
      <CharEffectsV3 v-else-if="activeTab === 'effects'" :actor="context.actor" :editable="context.editable" />
      <CharLoadoutV3 v-else-if="activeTab === 'loadout'" :actor="context.actor" :editable="context.editable" />
      <CharAdvancementV3 v-else :actor="context.actor" :editable="context.editable" />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { localize } from '@/methods/Helpers';
import CharActionPlanV3 from './tabs/CharActionPlanV3.vue';
import CharTriggersV3 from './tabs/CharTriggersV3.vue';
import CharCatalogV3 from './tabs/CharCatalogV3.vue';
import CharEffectsV3 from './tabs/CharEffectsV3.vue';
import CharLoadoutV3 from './tabs/CharLoadoutV3.vue';
import CharAdvancementV3 from './tabs/CharAdvancementV3.vue';

defineProps(['context']);

const activeTab = ref('actionPlan');
const tabs = [
  { id: 'actionPlan' },
  { id: 'triggers' },
  { id: 'catalog' },
  { id: 'effects' },
  { id: 'loadout' },
  { id: 'advancement' }
];
</script>

<style scoped lang="scss">
  .sheet-main {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
  }

  .tab-strip {
    flex: 0 0 auto;
    border-bottom: 1px solid var(--color-border-dark, #0003);
  }

  .tab-link {
    padding: 0.375rem 0.75rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    font-weight: 600;
    // color: var(--color-text-dark-secondary, #7a7971);
    cursor: pointer;

    &.active {
      border-bottom-color: var(--color-border-dark, #0003);
      // color: var(--color-text-dark-primary, #191813);
    }
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem;
  }
</style>
