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
      <p class="placeholder">(WIP) &mdash; {{ localize(`ARCHMAGE.${activeTab}`) }}</p>
      <p v-for="n in 30" :key="n" class="filler">...</p>
    </div>
  </main>
</template>

<script>
import { localize } from '@/methods/Helpers';

export default {
  name: 'CharMainV3',
  props: ['context'],
  data() {
    return {
      activeTab: 'details',
      tabs: [
        { id: 'details' },
        { id: 'powers' },
        { id: 'inventory' },
        { id: 'effects' }
      ]
    }
  },
  methods: {
    localize
  }
}
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
    color: var(--color-text-dark-secondary, #7a7971);
    cursor: pointer;

    &.active {
      border-bottom-color: var(--color-border-dark, #0003);
      color: var(--color-text-dark-primary, #191813);
    }
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .placeholder {
    margin: 0 0 0.5rem;
    font-style: italic;
    color: var(--color-text-dark-secondary, #7a7971);
  }

  .filler {
    margin: 0;
    color: var(--color-text-dark-secondary, #7a7971);
  }
</style>
