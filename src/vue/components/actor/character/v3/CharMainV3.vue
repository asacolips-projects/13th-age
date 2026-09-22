<template>
  <main class="sheet-main flexcol">
    <!-- Placeholder tab strip. Deliberately not parts/Tabs.vue: its styling is
         nested under .archmage-v2 and its mounted() hook needs the V2 root's
         merged-defaults flags computed plus game.i18n persistence under
         archmage.sheetDisplay.tabs.<group>.value. A V3 tabs part is future work. -->
    <nav class="tab-strip flexrow">
      <button v-for="tab in tabs" :key="tab.id" type="button"
        class="tab-link" :class="{ active: activeTab === tab.id }"
        :title="tab.icon ? localize(`ARCHMAGE.${tab.id}`) : undefined"
        @click="activeTab = tab.id">
        <i v-if="tab.icon" :class="`fas ${tab.icon}`"></i>
        <template v-else>{{ localize(`ARCHMAGE.${tab.id}`) }}</template>
      </button>
    </nav>

    <div class="tab-content">
      <CharCatalogV3 v-if="activeTab === 'catalog'" :actor="context.actor" :editable="context.editable" />
      <CharActionPlanV3 v-if="activeTab === 'actionPlan'" :actor="context.actor" :editable="context.editable" />
      <CharTriggersV3 v-if="activeTab === 'triggers'" :actor="context.actor" :editable="context.editable" />
      <CharEffectsV3 v-if="activeTab === 'effects'" :actor="context.actor" :editable="context.editable" />
      <CharLoadoutV3 v-if="activeTab === 'loadout'" :actor="context.actor" :editable="context.editable" />
      <CharAdvancementV3 v-if="activeTab === 'advancement'" :actor="context.actor" :editable="context.editable" />
      <CharNotesV3 v-if="activeTab === 'notes'" :actor="context.actor" :editable="context.editable" />
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
import CharNotesV3 from './tabs/CharNotesV3.vue';

defineProps(['context']);

const activeTab = ref('catalog');
const tabs = [
  { id: 'catalog' },
  { id: 'actionPlan' },
  { id: 'triggers' },
  { id: 'effects' },
  { id: 'loadout' },
  { id: 'advancement' },
  { id: 'notes', icon: 'fa-note-sticky' }
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
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 0.75rem;
  }
</style>
