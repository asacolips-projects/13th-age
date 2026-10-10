<template>
	<span class="catalog-tabs-menu">
		<button
			type="button"
			class="catalog-tabs-toggle"
			:class="{ open }"
			:data-tooltip="localize('ARCHMAGE.tabSettings')"
			@click.stop="toggle"
		>
			<i class="fas fa-ellipsis-vertical" />
		</button>
		<!-- One popover for the whole tab set: rename each tab, drag the grip
       to reorder, add or remove (one tab minimum). An empty name makes the
       tab fall back to its derived label; the input's placeholder is a
       plain "Title" prompt. -->
		<div v-if="open" class="catalog-tabs-popover" @click.stop>
			<div
				v-for="def in defs"
				:key="def.id"
				class="catalog-tab-row"
				:class="{ 'catalog-tab-row--drop-target': dragOverId === def.id }"
				@dragover="onDragOver($event, def)"
				@dragleave="onDragLeave($event, def)"
				@drop="onDrop($event, def)"
			>
				<i
					class="fas fa-grip-lines row-grip"
					draggable="true"
					:title="localize('ARCHMAGE.dragToReorderTab')"
					@dragstart="onDragStart($event, def)"
					@dragend="onDragEnd"
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
			</div>
			<div class="catalog-tab-actions">
				<button type="button" class="catalog-tab-add" @click="add"><i class="fas fa-plus" /> {{ localize('ARCHMAGE.addTab') }}</button>
			</div>
		</div>
	</span>
</template>

<script setup>
/**
 * The catalog tabs' settings popover, docked beside the tab strip: one row
 * per tab with a name input, a grip to drag-reorder, an X to remove
 * (disabled while only one tab is left), and an add button — the set's
 * size, names and order are all it manages. Changes persist to the
 * sheetDisplay.catalog.tabs flags, which re-render the sheet and with it
 * the strip.
 */
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { localize, saveSheetDisplayPref } from "@/methods/Helpers";
import { catalogTabDefs } from "@/methods/CatalogTabs";

const props = defineProps(["actor"]);

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

// Row reordering: the grip starts the drag, the rows highlight as drop
// targets, and the drop rebuilds the array around the release point (above
// or below the target row, by cursor position). The drag state is transient.
const draggedId = ref(null);
const dragOverId = ref(null);

const onDragStart = (event, def) => {
	draggedId.value = def.id;
	event.dataTransfer.effectAllowed = "move";
	// Tag the payload so nothing downstream mistakes this for an item drag.
	event.dataTransfer.setData("text/plain", JSON.stringify({ type: "CatalogTabOrder", tabId: def.id }));
};

const onDragOver = (event, def) => {
	if (!draggedId.value || dragOverId.value === def.id) return;
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";
	dragOverId.value = def.id;
};

const onDragLeave = (event, def) => {
	if (dragOverId.value !== def.id) return;
	// dragleave also fires when moving between the row's children, so only
	// clear the highlight once the cursor has actually left the row.
	if (event.currentTarget.contains(event.relatedTarget)) return;
	dragOverId.value = null;
};

const onDrop = (event, def) => {
	const source = draggedId.value;
	draggedId.value = null;
	dragOverId.value = null;
	if (!source || source === def.id) return;
	const from = defs.value.findIndex((other) => other.id === source);
	if (from < 0) return;
	const rect = event.currentTarget.getBoundingClientRect();
	const before = (event.clientY - rect.top) < (rect.height / 2);
	const tabs = defs.value.filter((other) => other.id !== source);
	const to = tabs.findIndex((other) => other.id === def.id);
	if (to < 0) return;
	tabs.splice(before ? to : to + 1, 0, defs.value[from]);
	save(tabs);
};

const onDragEnd = () => {
	draggedId.value = null;
	dragOverId.value = null;
};

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
  // Docked at the strip's start, before the first tab.
  .catalog-tabs-menu {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  // Dressed as one of the strip's tab links (Foundry's nav.tabs [data-tab])
  // rather than a button: no chrome, the tab-link padding and icon size, and
  // the link's base/hover/.active colors and text-shadow glow.
  .catalog-tabs-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    border-radius: 0;
    box-shadow: none;
    font-size: var(--font-size-14);
    line-height: 1;
    color: var(--color-text-secondary);
    cursor: var(--cursor-pointer);

    &:hover {
      color: var(--color-text-primary);
      text-shadow: 0 0 10px var(--color-shadow-primary);
    }

    // Lit while its popover is open, like a link's active tab.
    &.open {
      color: var(--color-text-emphatic);
      text-shadow: 0 0 10px var(--color-shadow-primary);
    }
  }

  .catalog-tabs-popover {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: 15rem;
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

  .catalog-tab-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .catalog-tab-add {
    height: var(--input-height);
    font-size: var(--font-size-12);
    border-radius: 3px;
    background: transparent;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
</style>
