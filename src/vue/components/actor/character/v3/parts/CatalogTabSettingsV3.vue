<template>
	<span class="catalog-tabs-menu">
		<button
			type="button"
			class="catalog-tabs-toggle"
			:class="{ open }"
			:title="localize('ARCHMAGE.tabSettings')"
			@click.stop="toggle"
		>
			<i class="fas fa-gear" />
		</button>
		<!-- One popover for the whole tab set: rename each tab, pick its
         group-by, reorder, add or remove (one tab minimum). Empty names
         fall back to the derived label, shown as the input's placeholder. -->
		<div v-if="open" class="catalog-tabs-popover" @click.stop>
			<div class="catalog-tab-row catalog-tab-row--head">
				<span class="row-label">{{ localize('ARCHMAGE.name') }}</span>
				<span class="row-group">{{ localize('ARCHMAGE.groupBy') }}</span>
				<span class="row-actions" />
			</div>
			<div v-for="(def, index) in defs" :key="def.id" class="catalog-tab-row">
				<input
					type="text"
					class="row-label"
					:value="def.label"
					:placeholder="derivedLabel(def)"
					@change="rename(def, $event)"
				>
				<select class="row-group" :value="def.groupBy" @change="regroup(def, $event)">
					<option v-for="option in groupOptions" :key="option.value" :value="option.value">{{ localize(`ARCHMAGE.GROUPS.${option.value}`) }}</option>
				</select>
				<span class="row-actions">
					<button type="button" :disabled="index === 0" :title="localize('ARCHMAGE.moveUp')" @click="move(def, -1)"><i class="fas fa-chevron-up" /></button>
					<button type="button" :disabled="index === defs.length - 1" :title="localize('ARCHMAGE.moveDown')" @click="move(def, 1)"><i class="fas fa-chevron-down" /></button>
					<button type="button" :disabled="defs.length < 2" :title="localize('ARCHMAGE.removeTab')" @click="remove(def)"><i class="fas fa-times" /></button>
				</span>
			</div>
			<button type="button" class="catalog-tab-add" @click="add"><i class="fas fa-plus" /> {{ localize('ARCHMAGE.addTab') }}</button>
		</div>
	</span>
</template>

<script setup>
/**
 * The catalog tabs' settings popover, docked beside the tab strip: one row
 * per tab with a name input and a group-by select, up/down buttons to
 * reorder the strip, an X to remove (disabled while only one tab is left),
 * and an add button. Changes persist to the sheetDisplay.catalog.tabs
 * flags, which re-render the sheet and with it the strip.
 */
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { localize, saveSheetDisplayPref } from "@/methods/Helpers";
import { CATALOG_GROUP_MODES, catalogTabDefs, catalogTabLabel } from "@/methods/CatalogTabs";

const props = defineProps(["actor"]);

const groupOptions = CATALOG_GROUP_MODES.map((value) => ({ value }));

const defs = computed(() => catalogTabDefs(props.actor));

// The popover's open state is transient; a document click outside the menu
// or Escape closes it.
const open = ref(false);

const toggle = () => {
	open.value = !open.value;
};

const onDocClick = (event) => {
	if (open.value && !event.target.closest?.(".catalog-tabs-menu")) open.value = false;
};

const onDocKeydown = (event) => {
	if (event.key === "Escape") open.value = false;
};

onMounted(() => {
	document.addEventListener("click", onDocClick);
	document.addEventListener("keydown", onDocKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", onDocClick);
	document.removeEventListener("keydown", onDocKeydown);
});

const derivedLabel = (def) => catalogTabLabel({ ...def, label: "" });

/**
 * Persist a new tabs array; the sheet re-renders from the flags.
 * @param tabs
 */
const save = (tabs) => saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.tabs", tabs);

const rename = (def, event) => save(defs.value.map((other) =>
	other.id === def.id ? { ...other, label: event.target.value } : other));

const regroup = (def, event) => save(defs.value.map((other) =>
	other.id === def.id ? { ...other, groupBy: event.target.value } : other));

const move = (def, delta) => {
	const tabs = [...defs.value];
	const from = tabs.findIndex((other) => other.id === def.id);
	const to = from + delta;
	if (from < 0 || to < 0 || to >= tabs.length) return;
	[tabs[from], tabs[to]] = [tabs[to], tabs[from]];
	save(tabs);
};

const remove = (def) => {
	// A tab's saved group/row orders are left behind: re-adding a tab with a
	// fresh id starts clean, and sweeping the orphaned paths isn't worth the
	// flag churn.
	if (defs.value.length < 2) return;
	save(defs.value.filter((other) => other.id !== def.id));
};

// New tabs take the first group-by mode nothing uses yet, so the defaults
// cycle through the sensible choices before repeating any.
const add = () => {
	const used = new Set(defs.value.map((def) => def.groupBy));
	const groupBy = CATALOG_GROUP_MODES.find((mode) => !used.has(mode)) ?? "group";
	save([...defs.value, { id: foundry.utils.randomID(), label: "", groupBy, sortBy: "custom" }]);
};
</script>

<style scoped lang="scss">
  // Docked at the strip's end, next to the last tab.
  .catalog-tabs-menu {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    padding: 0 0.25rem;
  }

  .catalog-tabs-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    font-size: var(--font-size-10);
    line-height: 1;

    // Lit while its popover is open.
    &.open i {
      color: var(--v3-rollable);
    }
  }

  .catalog-tabs-popover {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: max(24rem, 40vw);
    padding: 0.5rem 0.625rem;
    background: var(--v3-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    box-shadow: 0 2px 8px var(--c-black--50);
  }

  .catalog-tab-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;

    // Column captions for the input and the select.
    &--head {
      font-family: var(--v3-font-label);
      font-size: var(--font-size-10);
      font-weight: bold;

      .row-label,
      .row-group {
        padding: 0;
      }

      .row-actions {
        width: auto;
      }
    }

    .row-label {
      flex: 1;
      min-width: 0;
      height: 1.5rem;
      padding: 0 0.25rem;
      font-size: var(--font-size-12);
    }

    .row-group {
      flex: 0 0 auto;
      width: 9rem;
      height: 1.5rem;
      font-size: var(--font-size-12);
    }

    .row-actions {
      flex: 0 0 auto;
      display: flex;
      gap: 0.125rem;
      width: 4.5rem;
      justify-content: flex-end;

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.4rem;
        height: 1.4rem;
        padding: 0;
        font-size: var(--font-size-10);
        line-height: 1;
        background: transparent;

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
    }
  }

  .catalog-tab-add {
    align-self: flex-start;
    height: var(--input-height);
    font-size: var(--font-size-12);
    border-radius: 3px;
    background: transparent;
  }
</style>
