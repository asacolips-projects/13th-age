<template>
  <main class="sheet-main flexcol">
    <Tabs group="v3" :tabs="tabs" :actor="context.actor" :flags="flags" no-span="true" />

    <!-- Every tab is mounted for the sheet's lifetime; the <Tab> wrapper only
         toggles visibility, which preserves component state and, because each
         tab-body is its own scroll container, per-tab scroll positions. -->
    <div class="tab-content">
      <Tab group="v3" :tab="tabs.catalog" classes="tab-body">
        <CharCatalogV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </Tab>
      <Tab group="v3" :tab="tabs.actionPlan" classes="tab-body">
        <CharActionPlanV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </Tab>
      <Tab group="v3" :tab="tabs.triggers" classes="tab-body">
        <CharTriggersV3 :actor="context.actor" :editable="context.editable" :context="context" />
      </Tab>
      <Tab group="v3" :tab="tabs.effects" classes="tab-body">
        <CharEffectsV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
      <Tab group="v3" :tab="tabs.loadout" classes="tab-body">
        <CharLoadoutV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
      <Tab group="v3" :tab="tabs.advancement" classes="tab-body">
        <CharAdvancementV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
      <Tab group="v3" :tab="tabs.notes" classes="tab-body">
        <CharNotesV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
    </div>
  </main>
</template>

<script setup>
import { reactive } from 'vue';
import { localize } from '@/methods/Helpers';
import { Tabs, Tab } from '@/components';
import CharActionPlanV3 from './tabs/CharActionPlanV3.vue';
import CharTriggersV3 from './tabs/CharTriggersV3.vue';
import CharCatalogV3 from './tabs/CharCatalogV3.vue';
import CharEffectsV3 from './tabs/CharEffectsV3.vue';
import CharLoadoutV3 from './tabs/CharLoadoutV3.vue';
import CharAdvancementV3 from './tabs/CharAdvancementV3.vue';
import CharNotesV3 from './tabs/CharNotesV3.vue';

const props = defineProps(['context']);

// Tab definitions for parts/Tabs.vue: the object keys are the tab ids, and the
// component flips `active` on the objects on click, which drives the matching
// <Tab> wrappers above. reactive() so those mutations propagate; the object is
// built once so actor updates never rebuild it.
const rawTabs = {
  catalog: { key: 'catalog', label: localize('ARCHMAGE.catalog'), active: true },
  actionPlan: { key: 'actionPlan', label: localize('ARCHMAGE.actionPlan') },
  triggers: { key: 'triggers', label: localize('ARCHMAGE.triggers') },
  effects: { key: 'effects', label: localize('ARCHMAGE.effects') },
  loadout: { key: 'loadout', label: localize('ARCHMAGE.loadout') },
  advancement: { key: 'advancement', label: localize('ARCHMAGE.advancement') },
  notes: { key: 'notes', label: localize('ARCHMAGE.notes'), icon: 'fa-note-sticky', hideLabel: true }
};
const tabs = reactive(rawTabs);

// parts/Tabs.vue restores the last-open tab from this blob in mounted() and
// persists clicks through the actor prop (pack actors are skipped there) under
// archmage.sheetDisplay.tabs.v3.value like before — its own group so stale V2
// values can't collide. A stored value pointing at a tab that no longer exists
// would crash its mounted() lookup, so sanitize it back to the default.
const storedTab = props.context.actor?.flags?.archmage?.sheetDisplay?.tabs?.v3?.value;
const flags = {
  sheetDisplay: {
    tabs: {
      v3: { value: Object.hasOwn(rawTabs, storedTab) ? storedTab : undefined }
    }
  }
};
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

  /* Local styles for parts/Tabs.vue: its own SCSS is nested under .archmage-v2,
     which the V3 sheet root doesn't have (same situation as RollableV3.vue),
     so keep the strip Foundry-native with just the tweak the hand-rolled
     version had. The section wrapper is the component's root, so :deep()
     reaches the links inside. */
  .section--tabs {
    flex: 0 0 auto;

    :deep(.tab-link) {
      padding: 0.25rem;
    }
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* Each tab owns its scroll container so switching tabs (visibility only)
     leaves every tab's scrollTop intact. Mirrors the old .tab-body sizing so
     tab layouts are unchanged. Toggled explicitly off the active flag rather
     than relying on core's .tab display rules. */
  .tab-body {
    flex: 1;
    min-height: 0;
    padding: 0.75rem;
  }

  .tab-body.active {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .tab-body:not(.active) {
    display: none;
  }
</style>
