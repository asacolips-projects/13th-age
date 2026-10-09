<template>
	<div class="autocomplete">
		<input
			ref="inputEl"
			type="text"
			:name="name"
			:value="modelValue"
			:placeholder="placeholder"
			:class="inputClass"
			autocomplete="off"
			@input="onInput"
			@focus="onFocus"
			@keydown="onKeydown"
			@blur="open = false"
		>
		<!-- Teleported to body: inside the sheet the list is boxed in by scroll
		containers (the sidebar) and stacking contexts (the hero's isolation),
		which no z-index inside can escape. mousedown is prevented so choosing
		an entry doesn't blur the input before the click lands. -->
		<Teleport to="body">
			<ul v-if="open && matches.length" class="autocomplete-list" role="listbox" :style="listStyle">
				<li
					v-for="(match, index) in matches"
					:key="match"
					role="option"
					:aria-selected="index === highlighted"
					:class="{ 'is-highlighted': index === highlighted }"
					@mousedown.prevent="choose(match)"
					@mousemove="highlighted = index"
				>
					{{ match }}
				</li>
			</ul>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from "vue";

const props = defineProps(["modelValue", "name", "placeholder", "suggestions", "inputClass"]);
const emit = defineEmits(["update:modelValue"]);

const inputEl = ref(null);
const open = ref(false);
const highlighted = ref(-1);

// Fixed-position coordinates, taken from the input's viewport rect whenever
// the list opens or the page moves under it.
const listStyle = ref({});

// Case-insensitive substring filter over the caller's list; an empty query
// lists everything, so the dropdown doubles as a picker. The caller owns the
// order, which the filter preserves.
const matches = computed(() => {
	const query = String(props.modelValue ?? "").trim()
		.toLowerCase();
	const list = props.suggestions ?? [];
	return query ? list.filter((suggestion) => suggestion.toLowerCase().includes(query)) : list;
});

const positionList = () => {
	if (!open.value || !inputEl.value) return;
	const rect = inputEl.value.getBoundingClientRect();
	listStyle.value = {
		top: `${rect.bottom + 2}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`
	};
};

// While open, track the input through window resizes and any scrolling
// container (capture catches the sheet's inner scrollers, not just the
// window's own scroll).
window.addEventListener("resize", positionList);
window.addEventListener("scroll", positionList, true);
onBeforeUnmount(() => {
	window.removeEventListener("resize", positionList);
	window.removeEventListener("scroll", positionList, true);
});

const onInput = (event) => {
	emit("update:modelValue", event.target.value);
	open.value = true;
	highlighted.value = -1;
	positionList();
};

const onFocus = () => {
	open.value = true;
	highlighted.value = -1;
	positionList();
};

const onKeydown = (event) => {
	if (!open.value) {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			open.value = true;
			positionList();
		}
		return;
	}
	const count = matches.value.length;
	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			if (count) highlighted.value = (highlighted.value + 1) % count;
			break;
		case "ArrowUp":
			event.preventDefault();
			if (count) highlighted.value = highlighted.value <= 0 ? count - 1 : highlighted.value - 1;
			break;
		case "Enter":
			if (highlighted.value >= 0) {
				event.preventDefault();
				choose(matches.value[highlighted.value]);
			}
			break;
		case "Tab":
			// Completing on tab keeps the promise the arrow keys made, then
			// lets focus move on as the key intends.
			if (highlighted.value >= 0) choose(matches.value[highlighted.value]);
			break;
		case "Escape":
			open.value = false;
			highlighted.value = -1;
			break;
	}
};

const choose = (value) => {
	emit("update:modelValue", value);
	open.value = false;
	highlighted.value = -1;
};
</script>

<style scoped lang="scss">
  .autocomplete {
    position: relative;
  }

  .autocomplete-list {
    /* Fixed and teleported to body: geometry arrives as inline style from
       the input's viewport rect, and the z-index plays in the body's stack
       rather than inside the sheet, where scroll containers and stacking
       contexts (the hero's isolation) boxed every in-sheet z-index in. The
       list also has to outrank the sheet window itself: Foundry hands each
       window an ever-climbing z-index (ApplicationV2._maxZ, bumped on every
       focus), so any modest fixed value ends up under the focused sheet —
       including the OUT editor below these fields. */
    position: fixed;
    /* On the body the list is outside the sheet root that defines the V3
       tokens, so re-alias the ones it uses — including the light-mode
       parchment, mirroring ArchmageCharacterSheetV3's override. Core only
       defines --background where it styles the window frame (on
       .application in dark mode), never on the plain body, so the alias
       needs core's dark glass as a fallback to paint on at all. */
    --v3-surface: var(--background, var(--color-cool-5-90, #0b0a13e6));
    --v3-font-base: #{$font-stack-base};

    .theme-light & {
      --v3-surface: url('../../../ui/parchment.jpg') repeat;
    }

    z-index: 100000;
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    max-height: 12rem;
    overflow-y: auto;
    background: var(--v3-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    box-shadow: 0 4px 12px var(--c-black--50);
    font-family: var(--v3-font-base);

    li {
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      /* Theme-aware, like the tracker-bar text: near-white here would
         vanish on the light parchment surface. */
      color: var(--color-text-primary);

      &.is-highlighted {
        background: var(--c-black--25);
      }
    }
  }
</style>
