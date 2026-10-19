import { getCurrentInstance, onBeforeUnmount, onMounted, watch } from "vue";

// Every live popover's dismissal, so opening one can close the others — a
// control that stops propagation (the item index's view button, the group "+")
// never lets the others' document listeners see the click that opened it.
const livePopovers = new Set();

/**
 * Outside-click and Escape dismissal for the v3 tabs' popovers: the view
 * popovers (item index's and triggers tab's) and the loadout's tracker-config
 * popovers all share the lifecycle — a document click outside the popover's
 * root, or Escape, closes it, and the listeners come back down on unmount.
 * Opening one popover closes any others, so two can't sit open at once.
 *
 * Escape only answers to the window the popover belongs to, and swallows
 * itself there, so another sheet's Escape never reaches in — and the first
 * Escape takes the popover down instead of the sheet underneath.
 *
 * @param {object} state Ref holding the popover's open state: a boolean, or
 *   the key of the one open popover (a document click outside closes it by
 *   resetting to `closed`).
 * @param {string} rootSelector CSS selector of the element a click may land
 *   on without dismissing — the popover and the control that opens it.
 * @param {*} [closed=false] The state value meaning "nothing open".
 *
 * @returns {object} The `state` ref, for chaining.
 */
export function useDismissablePopover(state, rootSelector, closed = false) {
	// The component's root element, resolved lazily since the composable runs
	// at setup — used to tell which window an Escape belongs to.
	const instance = getCurrentInstance();

	const dismiss = () => {
		if (state.value !== closed) state.value = closed;
	};

	const onDocClick = (event) => {
		if (state.value && !event.target.closest?.(rootSelector)) state.value = closed;
	};

	const onDocKeydown = (event) => {
		if (event.key !== "Escape" || !state.value) return;
		const el = instance?.proxy?.$el;
		const root = el?.closest?.(".window-app") ?? el;
		if (!(event.target instanceof Element) || !root?.contains(event.target)) return;
		event.stopPropagation();
		state.value = closed;
	};

	// Opening this popover dismisses the live ones, so two never sit open.
	watch(state, (value) => {
		if (value === closed) return;
		for (const popover of livePopovers) {
			if (popover !== dismiss) popover();
		}
	});

	onMounted(() => {
		livePopovers.add(dismiss);
		document.addEventListener("click", onDocClick);
		document.addEventListener("keydown", onDocKeydown);
	});

	onBeforeUnmount(() => {
		livePopovers.delete(dismiss);
		document.removeEventListener("click", onDocClick);
		document.removeEventListener("keydown", onDocKeydown);
	});

	return { state };
}
