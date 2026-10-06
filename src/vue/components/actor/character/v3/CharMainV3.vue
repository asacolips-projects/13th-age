<template>
	<main class="sheet-main flexcol">
		<!-- The catalog tabs are user-configured (see the settings popover
         docked at the strip's end); the Loot tab follows them, fixed. -->
		<div class="strip-row">
			<Tabs
				group="v3"
				:tabs="stripTabs"
				:actor="context.actor"
				:flags="flags"
				no-span="true"
			/>
			<CharCatalogTabSettingsV3 v-if="canConfigureTabs" :actor="context.actor" />
		</div>

		<!-- Every tab is mounted for the sheet's lifetime; the <Tab> wrapper only
         toggles visibility, which preserves component state and, because each
         tab-body is its own scroll container, per-tab scroll positions.
         Exception: the narrow-only character tab below is conditional, since
         its body would duplicate the sidebar's named form inputs. -->
		<div class="tab-content">
			<!-- Narrow layout only: the sidebar's units re-homed as a tab (the
           identity lives in the command bar instead). Conditional on narrow
           rather than visibility-hidden: these inputs carry the same name=
           attributes as the sidebar's, and both copies mounted at once would
           make Foundry's form submit collect each field twice as an array
           (e.g. bonus.value = [1, 1]). -->
			<Tab v-if="narrow" group="v3" :tab="tabs.character" classes="tab-body">
				<div class="sidebar-units">
					<CharSidebarBodyV3 :actor="context.actor" />
				</div>
			</Tab>

			<Tab
				v-for="{ def, state } in catalogTabsView"
				:key="def.id"
				group="v3"
				:tab="state"
				classes="tab-body"
			>
				<CharCatalogV3 :actor="context.actor" :editable="context.editable" :context="context" :tab="def" />
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
			<Tab group="v3" :tab="tabs.loot" classes="tab-body">
				<CharCatalogV3 :actor="context.actor" :editable="context.editable" :context="context" :tab="LOOT_TAB" />
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
import { computed, reactive, ref, watchEffect } from "vue";
import { localize } from "@/methods/Helpers";
import { Tabs, Tab } from "@/components";
import { CATALOG_GROUP_ICONS, LOOT_TAB, catalogTabDefs, catalogTabLabel, migrateCatalogTabs } from "@/methods/CatalogTabs";
import CharCatalogV3 from "./tabs/CharCatalogV3.vue";
import CharCatalogTabSettingsV3 from "./parts/CatalogTabSettingsV3.vue";
import CharTriggersV3 from "./tabs/CharTriggersV3.vue";
import CharEffectsV3 from "./tabs/CharEffectsV3.vue";
import CharLoadoutV3 from "./tabs/CharLoadoutV3.vue";
import CharProgressionV3 from "./tabs/CharProgressionV3.vue";
import CharNotesV3 from "./tabs/CharNotesV3.vue";
import CharSidebarBodyV3 from "./CharSidebarBodyV3.vue";

const props = defineProps(["context", "narrow"]);

// The triggers tab only earns its strip slot when the PC has at least one
// power with trigger text, using the same filter as CharTriggersV3. Reactive
// because the sheet app swaps context.actor on every Foundry render.
const hasTriggers = computed(() => (props.context.actor?.items ?? [])
	.some((x) => x.type === "power" && x.system.trigger?.value));

// Tab definitions for parts/Tabs.vue: the object keys are the tab ids, and the
// component flips `active` on the objects on click, which drives the matching
// <Tab> wrappers above. reactive() so those mutations propagate; the object is
// built once so actor updates never rebuild it. The catalog tabs themselves are
// user-configured and synced in below; the character tab only exists in the
// narrow layout, and the icon map backfills the strip there too (the wide strip
// stays label-only, notes excepted).
const icons = {
	loot: "fa-suitcase",
	triggers: "fa-play",
	effects: "fa-wand-magic-sparkles",
	loadout: "fa-box",
	progression: "fa-chart-line",
	notes: "fa-note-sticky",
	character: "fa-user"
};

const rawTabs = {
	character: { key: "character", label: localize("ARCHMAGE.character") },
	triggers: { key: "triggers", label: localize("ARCHMAGE.triggers") },
	effects: { key: "effects", label: localize("ARCHMAGE.effects") },
	loadout: { key: "loadout", label: localize("ARCHMAGE.loadout") },
	progression: { key: "progression", label: localize("ARCHMAGE.progression"), hideLabel: true },
	loot: { key: "loot", label: localize("ARCHMAGE.loot"), hideLabel: true },
	notes: { key: "notes", label: localize("ARCHMAGE.notes"), hideLabel: true }
};
const tabs = reactive(rawTabs);

// The user-configured catalog tabs (sheetDisplay.catalog.tabs): stable
// reactive state per tab id, synced from the flag-stored definitions so
// re-renders never drop the active tab or the strip's click state. The
// version ref just tells the computeds below when the set changed — the
// flags only swap when the sheet re-renders.
const catalogStates = new Map();
const catalogVersion = ref(0);

watchEffect(() => {
	const defs = catalogTabDefs(props.context.actor);
	const known = new Set(defs.map((def) => def.id));
	for (const id of [...catalogStates.keys()]) {
		if (!known.has(id)) catalogStates.delete(id);
	}
	defs.forEach((def) => {
		let state = catalogStates.get(def.id);
		if (!state) {
			state = reactive({ key: def.id, active: false });
			catalogStates.set(def.id, state);
		}
		state.label = catalogTabLabel(def);
		state.icon = props.narrow ? (CATALOG_GROUP_ICONS[def.groupBy] ?? "fa-book") : undefined;
		state.hideLabel = props.narrow;
	});

	// Nothing active — first render, or the active tab was just removed:
	// light the first catalog tab so the sheet never shows a dead strip.
	if (!Object.values(tabs).some((t) => t.active) && ![...catalogStates.values()].some((s) => s.active)) {
		const first = catalogStates.get(defs[0]?.id);
		if (first) first.active = true;
	}
	catalogVersion.value++;
});

/**
 * The strip's tab view: the static tabs with the catalog ones spliced in
 * after the narrow-only character tab, in the stored tab order.
 */
const catalogTabsView = computed(() => {
	catalogVersion.value;
	return catalogTabDefs(props.context.actor).map((def) => ({
		def,
		state: catalogStates.get(def.id) ?? { key: def.id, active: false }
	}));
});

const stripTabs = computed(() => {
	catalogVersion.value;
	// Order follows the stored tab definitions, so popover reorders take
	// effect — the state map's own insertion order would go stale.
	const merged = { character: tabs.character };
	for (const { state } of catalogTabsView.value) merged[state.key] = state;
	for (const key of ["triggers", "loadout", "effects", "loot", "progression", "notes"]) {
		merged[key] = tabs[key];
	}
	return merged;
});

// Runs immediately (so the first render already has the flag) and again
// whenever the actor's items or the layout mode change. Hidden tabs: triggers
// earn their slot only when the PC has trigger text, and the character tab
// exists only in the narrow layout. If a tab is open when it becomes hidden,
// move the active tab to the first visible one. Icons/labels: narrow swaps the
// strip to icon-only (hideLabel keeps hover tooltips working); the catalog
// tabs' icons were set in the sync above.
watchEffect(() => {
	tabs.triggers.hidden = !hasTriggers.value;
	tabs.character.hidden = !props.narrow;

	for (const key of ["character", "loot", "triggers", "effects", "loadout", "progression", "notes"]) {
		const tab = tabs[key];
		tab.icon = (props.narrow || tab.hideLabel) ? icons[key] : undefined;
		tab.hideLabel ||= props.narrow;
	}

	const hiddenActive = Object.values(tabs).find((t) => t.hidden && t.active);
	if (hiddenActive) {
		const next = Object.values(tabs).find((t) => !t.hidden);
		if (next) {
			hiddenActive.active = false;
			next.active = true;
		}
	}
});

// The settings popover only makes sense where its writes can land.
const canConfigureTabs = computed(() => props.context?.editable === true && !props.context.actor?.pack);

// One-time migration: seed the catalog tab set (and its saved orders) from
// the legacy powers/actionPlan flags, leaving those in place for the v2
// sheet. Fire and forget — the sheet re-renders when the flags land.
if (props.context?.editable === true && !props.context.actor?.pack) {
	migrateCatalogTabs(props.context.actor);
}

// parts/Tabs.vue restores the last-open tab from this blob in mounted() and
// persists clicks through the actor prop (pack actors are skipped there) under
// archmage.sheetDisplay.tabs.v3.value like before — its own group so stale V2
// values can't collide. A stored value pointing at a tab that no longer exists
// (a removed catalog tab among them) would crash its mounted() lookup, so
// sanitize it back to the default.
const storedTab = props.context.actor?.flags?.archmage?.sheetDisplay?.tabs?.v3?.value;
const knownTabs = new Set([
	...Object.keys(rawTabs),
	...catalogTabDefs(props.context.actor).map((def) => def.id)
]);
const flags = {
	sheetDisplay: {
		tabs: {
			v3: { value: knownTabs.has(storedTab) ? storedTab : undefined }
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

  /* The strip and its settings cog share a row; the strip takes the
     remaining width. Local styles for parts/Tabs.vue: its own SCSS is nested
     under .archmage-v2, which the V3 sheet root doesn't have (same situation
     as RollableV3.vue), so keep the strip Foundry-native with just the tweak
     the hand-rolled version had. The section wrapper is the component's
     root, so :deep() reaches the links inside. */
  .strip-row {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .strip-row .section--tabs {
    flex: 1 1 auto;

    /* Core pins .tabs to one line (flex-wrap: nowrap + gap); let the strip
       wrap onto further rows so the sheet scales narrower without clipping
       tabs. The core gap covers the spacing between wrapped rows too. */
    :deep(nav.tabs) {
      flex-wrap: wrap;
    }

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
