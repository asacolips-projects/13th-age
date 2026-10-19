import { computed, ref } from "vue";
import { cleanFilterKey, stripTags } from "@/methods/Helpers";

/**
 * Text filter state for the v3 tabs' listings: the filter box's value and
 * a matcher that indexes each row's searchable text the same way the input
 * is keyed. Enriched-HTML markup is stripped with the cheap regex strip
 * first — searching raw HTML would match tag names and miss matches split
 * across tags — and both sides reduce to bare alphanumerics, so punctuation
 * and spacing don't need to match exactly. Clearing the filter is the bar's
 * clear widget writing the model to null.
 *
 * @param {Function} searchText (item) => the searchable text for a row: its
 *   name plus whatever fields the expanded row shows.
 *
 * @returns {object} The `searchValue` ref and `matchesSearch`.
 */
export function useSearchFilter(searchText) {
	const searchValue = ref(null);

	// The needle reduces once per input change, not once per item per change —
	// the listing filter runs it against every row on every keystroke.
	const needle = computed(() => cleanFilterKey(searchValue.value ?? ""));

	const matchesSearch = (item) => {
		if (!needle.value) return true;
		return cleanFilterKey(stripTags(searchText(item))).includes(needle.value);
	};

	return { searchValue, matchesSearch };
}
