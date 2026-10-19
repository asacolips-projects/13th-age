<template>
	<!-- One screen for the whole tab set, laid out like the other tab bodies:
       a header bar with the add control, and the rows centered beneath at a
       readable width. Rename each tab, drag the grip to reorder, add or
       remove (one tab minimum). An empty name makes the tab fall back to its
       derived label; the input's placeholder is a plain "Title" prompt. -->
	<section class="tab-catalog-settings">
		<header class="settings-header">
			<button type="button" class="settings-add" @click="add"><i class="fas fa-plus" /> {{ localize('ARCHMAGE.addTab') }}</button>
		</header>
		<ul class="settings-list">
			<li
				v-for="def in defs"
				:key="def.id"
				class="settings-row"
				:class="{ 'settings-row--drop-target': dragOverRow === def.id }"
				@dragover="onRowDragOver($event, 'tabs', def.id)"
				@dragleave="onRowDragLeave($event, def.id)"
				@drop="onRowDrop($event, 'tabs', def.id)"
			>
				<i
					class="fas fa-grip-lines row-grip"
					draggable="true"
					:title="localize('ARCHMAGE.dragToReorderTab')"
					@dragstart="onRowDragStart($event, 'tabs', def.id)"
					@dragend="onRowDragEnd"
				/>
				<input
					type="text"
					class="row-label"
					:value="def.label"
					:placeholder="localize('ARCHMAGE.title')"
					@change="rename(def, $event)"
				>
				<span class="row-actions">
					<button type="button" :disabled="defs.length < 2" :title="localize('ARCHMAGE.removeTab')" @click="remove(def)"><i class="fas fa-times" /></button>
				</span>
			</li>
		</ul>
	</section>
</template>

<script setup>
/**
 * The catalog tabs' settings panel, the body of the ellipsis tab at the
 * strip's end: one row per tab with a name input, a grip to drag-reorder,
 * an X to remove (disabled while only one tab is left), and an add button —
 * the set's size, names and order are all it manages. Changes persist to
 * the sheetDisplay.catalog.tabs flags, which re-render the sheet and with
 * it the strip.
 */
import { computed } from "vue";
import { localize, saveSheetDisplayPref } from "@/methods/Helpers";
import { catalogTabDefs } from "@/methods/CatalogTabs";
import { useRowReorder } from "@/composables/useRowReorder";

const props = defineProps(["actor"]);

const defs = computed(() => catalogTabDefs(props.actor));

/**
 * Persist a new tabs array; the sheet re-renders from the flags.
 * @param tabs
 */
const save = async (tabs) => {
	await saveSheetDisplayPref(props.actor, "sheetDisplay.catalog.tabs", tabs);
};

const rename = (def, event) => save(defs.value.map((other) =>
	other.id === def.id ? { ...other, label: event.target.value } : other));

const remove = (def) => {
	if (defs.value.length < 2) return;
	save(defs.value.filter((other) => other.id !== def.id));
};

// Row reordering, through the shared composable: the grip starts the drag,
// the rows highlight as drop targets, and the drop rebuilds the array around
// the release point (above or below the target row, by cursor position). The
// tabs persist as a whole array of tab objects rather than a flat id flag, so
// `persist` replaces the flag write: the composable hands back reordered row
// ids, mapped back to their defs here before saving.
const canReorder = computed(() => !props.actor?.pack);
const saveTabOrder = async (ids) => {
	const byId = new Map(defs.value.map((def) => [def.id, def]));
	await save(ids.map((id) => byId.get(id)).filter((def) => def));
};
const {
	dragOverRow, onRowDragStart, onRowDragOver, onRowDragLeave, onRowDrop, onRowDragEnd
} = useRowReorder({
	actor: () => props.actor,
	canReorder,
	rows: () => defs.value,
	rowId: (def) => def.id,
	persist: saveTabOrder,
	startDrag: (event, _containerKey, tabId) => {
		event.dataTransfer.effectAllowed = "move";
		// Tag the payload so nothing downstream mistakes this for an item drag.
		event.dataTransfer.setData("text/plain", JSON.stringify({ type: "CatalogTabOrder", tabId }));
	}
});

const add = () => {
	// "Catalog N", one past the highest number already in the set.
	const nums = defs.value
		.map((def) => /^Catalog (\d+)$/.exec(def.label ?? ""))
		.filter((match) => match)
		.map((match) => Number(match[1]));
	save([...defs.value, { id: foundry.utils.randomID(), label: `Catalog ${(nums.length ? Math.max(...nums) : 0) + 1}` }]);
};
</script>

<style scoped lang="scss">
  // The header bar, matching the effects tab's (controls over a rule); the
  // add button docks at its right like the catalog's per-group "+".
  .settings-header {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    padding-bottom: 0.25rem;
    border-bottom: 1px dashed var(--color-border);
  }

  .settings-add {
    height: var(--input-height);
    font-size: var(--font-size-12);
    border-radius: 3px;
    background: transparent;
  }

  // The rows, centered at a readable width so the name inputs never stretch
  // across the whole body on a wide window.
  .settings-list {
    margin: 0.5rem auto 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: min(100%, 30rem);
  }

  .settings-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;

    // Reorder affordances, matching the catalog's group titles.
    .row-grip {
      flex: 0 0 auto;
      font-size: var(--font-size-14);
      opacity: 0.35;
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    &:hover .row-grip {
      opacity: 1;
    }

    &--drop-target {
      outline: 2px dashed;
      outline-offset: 2px;
    }

    .row-label {
      flex: 1;
      min-width: 0;
      height: 1.5rem;
      padding: 0 0.25rem;
      font-size: var(--font-size-12);
    }

    .row-actions {
      flex: 0 0 auto;
      display: flex;
      gap: 0.125rem;
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
</style>
