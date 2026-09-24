<template>
  <main class="sheet-main flexcol">
    <!-- Foundry-native tab strip. Deliberately not parts/Tabs.vue: its styling is
         nested under .archmage-v2 and its mounted() hook needs the V2 root's
         merged-defaults flags computed plus game.i18n persistence under
         archmage.sheetDisplay.tabs.<group>.value. A V3 tabs part is future work. -->
    <nav class="sheet-tabs tabs">
      <a v-for="tab in tabs" :key="tab.id" class="tab-link"
        :class="{ active: activeTab === tab.id }"
        :data-tab="tab.id"
        :data-tooltip="tab.icon ? localize(`ARCHMAGE.${tab.id}`) : undefined"
        data-tooltip-direction="UP"
        @click="setTab(tab.id)">
        <i v-if="tab.icon" :class="`fas ${tab.icon}`"></i>
        <span v-else>{{ localize(`ARCHMAGE.${tab.id}`) }}</span>
      </a>
    </nav>

    <!-- Every tab is mounted for the sheet's lifetime; v-show just hides the
         inactive ones. Keeping them live preserves component state and, because
         each tab-body is its own scroll container, per-tab scroll positions. -->
    <div class="tab-content">
      <div v-show="activeTab === 'catalog'" class="tab-body">
        <CharCatalogV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </div>
      <div v-show="activeTab === 'actionPlan'" class="tab-body">
        <CharActionPlanV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </div>
      <div v-show="activeTab === 'triggers'" class="tab-body">
        <CharTriggersV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </div>
      <div v-show="activeTab === 'effects'" class="tab-body">
        <CharEffectsV3 :actor="context.actor" :editable="context.editable" />
      </div>
      <div v-show="activeTab === 'loadout'" class="tab-body">
        <CharLoadoutV3 :actor="context.actor" :editable="context.editable" />
      </div>
      <div v-show="activeTab === 'advancement'" class="tab-body">
        <CharAdvancementV3 :actor="context.actor" :editable="context.editable" />
      </div>
      <div v-show="activeTab === 'notes'" class="tab-body">
        <CharNotesV3 :actor="context.actor" :editable="context.editable" />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { localize, getActor } from '@/methods/Helpers';
import CharActionPlanV3 from './tabs/CharActionPlanV3.vue';
import CharTriggersV3 from './tabs/CharTriggersV3.vue';
import CharCatalogV3 from './tabs/CharCatalogV3.vue';
import CharEffectsV3 from './tabs/CharEffectsV3.vue';
import CharLoadoutV3 from './tabs/CharLoadoutV3.vue';
import CharAdvancementV3 from './tabs/CharAdvancementV3.vue';
import CharNotesV3 from './tabs/CharNotesV3.vue';

const props = defineProps(['context']);

const tabs = [
  { id: 'catalog' },
  { id: 'actionPlan' },
  { id: 'triggers' },
  { id: 'effects' },
  { id: 'loadout' },
  { id: 'advancement' },
  { id: 'notes', icon: 'fa-note-sticky' }
];

// The last-open tab persists under archmage.sheetDisplay.tabs.v3.value like
// the V2 Tabs part (its own group so stale V2 values can't collide). Fall back
// to the default when unset or pointing at a tab that no longer exists.
const activeTab = ref('catalog');
const storedTab = props.context.actor?.flags?.archmage?.sheetDisplay?.tabs?.v3?.value;
if (tabs.some(tab => tab.id === storedTab)) activeTab.value = storedTab;

function setTab(id) {
  activeTab.value = id;
  // Pack actors have no setFlag; getActor resolves the live document from the
  // context actor's drag data.
  if (props.context.actor?.pack) return;
  getActor(props.context.actor).then(actor => {
    actor?.setFlag('archmage', 'sheetDisplay.tabs.v3.value', id);
  });
}
</script>

<style scoped lang="scss">
  .sheet-main {
    /* Grow to fill the right column beneath the stats header. Explicit flex
       so this doesn't depend on Foundry's .flexcol utility. */
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .sheet-tabs .tab-link {
    padding: 0.25rem;
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* Each tab owns its scroll container so switching tabs (v-show only toggles
     display) leaves every tab's scrollTop intact. Mirrors the old .tab-content
     sizing so tab layouts are unchanged. */
  .tab-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 0.75rem;
  }
</style>
