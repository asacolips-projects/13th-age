<template>
  <main class="sheet-main flexcol">
    <Tabs group="v3" :tabs="tabs" :actor="context.actor" :flags="flags" no-span="true" />

    <!-- Every tab is mounted for the sheet's lifetime; the <Tab> wrapper only
         toggles visibility, which preserves component state and, because each
         tab-body is its own scroll container, per-tab scroll positions. -->
    <div class="tab-content">
      <!-- Narrow layout only: the sidebar's units re-homed as a tab (the
           identity lives in the command bar instead). -->
      <Tab group="v3" :tab="tabs.character" classes="tab-body">
        <div class="sidebar-units">
          <CharSidebarBodyV3 :actor="context.actor" />
        </div>
      </Tab>

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
      <Tab group="v3" :tab="tabs.progression" classes="tab-body">
        <CharProgressionV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
      <Tab group="v3" :tab="tabs.notes" classes="tab-body">
        <CharNotesV3 :actor="context.actor" :editable="context.editable" />
      </Tab>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, watchEffect } from 'vue';
import { localize } from '@/methods/Helpers';
import { Tabs, Tab } from '@/components';
import CharActionPlanV3 from './tabs/CharActionPlanV3.vue';
import CharTriggersV3 from './tabs/CharTriggersV3.vue';
import CharCatalogV3 from './tabs/CharCatalogV3.vue';
import CharEffectsV3 from './tabs/CharEffectsV3.vue';
import CharLoadoutV3 from './tabs/CharLoadoutV3.vue';
import CharProgressionV3 from './tabs/CharProgressionV3.vue';
import CharNotesV3 from './tabs/CharNotesV3.vue';
import CharSidebarBodyV3 from './CharSidebarBodyV3.vue';

const props = defineProps(['context', 'narrow']);

// The triggers tab only earns its strip slot when the PC has at least one
// power with trigger text, using the same filter as CharTriggersV3. Reactive
// because the sheet app swaps context.actor on every Foundry render.
const hasTriggers = computed(() => (props.context.actor?.items ?? [])
  .some(x => x.type === 'power' && x.system.trigger?.value));

// Tab definitions for parts/Tabs.vue: the object keys are the tab ids, and the
// component flips `active` on the objects on click, which drives the matching
// <Tab> wrappers above. reactive() so those mutations propagate; the object is
// built once so actor updates never rebuild it. The character tab only exists
// in the narrow layout, and the icon map backfills the strip there too (the
// wide strip stays label-only, notes excepted).
const icons = {
  catalog: 'fa-book',
  actionPlan: 'fa-chess-knight',
  triggers: 'fa-bolt',
  effects: 'fa-wand-magic-sparkles',
  loadout: 'fa-box',
  progression: 'fa-chart-line',
  notes: 'fa-note-sticky',
  character: 'fa-user'
};

const rawTabs = {
  character: { key: 'character', label: localize('ARCHMAGE.character') },
  catalog: { key: 'catalog', label: localize('ARCHMAGE.catalog'), active: true },
  actionPlan: { key: 'actionPlan', label: localize('ARCHMAGE.actionPlan') },
  triggers: { key: 'triggers', label: localize('ARCHMAGE.triggers') },
  effects: { key: 'effects', label: localize('ARCHMAGE.effects') },
  loadout: { key: 'loadout', label: localize('ARCHMAGE.loadout') },
  progression: { key: 'progression', label: localize('ARCHMAGE.progression') },
  notes: { key: 'notes', label: localize('ARCHMAGE.notes'), icon: 'fa-note-sticky', hideLabel: true },
};
const tabs = reactive(rawTabs);

// Runs immediately (so the first render already has the flag) and again
// whenever the actor's items or the layout mode change. Hidden tabs: triggers
// earn their slot only when the PC has trigger text, and the character tab
// exists only in the narrow layout. If a tab is open when it becomes hidden,
// move the active tab to the first visible one. Icons/labels: narrow swaps the
// strip to icon-only (hideLabel keeps hover tooltips working).
watchEffect(() => {
  tabs.triggers.hidden = !hasTriggers.value;
  tabs.character.hidden = !props.narrow;

  for (const tab of Object.values(tabs)) {
    tab.icon = props.narrow ? icons[tab.key] : (tab.key === 'notes' ? icons.notes : undefined);
    tab.hideLabel = props.narrow || tab.key === 'notes';
  }

  const hiddenActive = Object.values(tabs).find(t => t.hidden && t.active);
  if (hiddenActive) {
    const next = Object.values(tabs).find(t => !t.hidden);
    if (next) {
      hiddenActive.active = false;
      next.active = true;
    }
  }
});

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
