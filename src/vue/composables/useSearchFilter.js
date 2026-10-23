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
 * Each row's cleaned text is cached per item id until its source text
 * changes, so a keystroke only re-runs the needle against ready strings
 * instead of re-stripping every row's full description.
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

	// Per-item cache of the cleaned text, keyed by item id and holding the
	// raw source it was computed from, so an edited item re-cleans while
	// untouched rows reuse theirs.
	const cache = new Map();
	const cleanedText = (item) => {
		const raw = searchText(item);
		const id = item?._id ?? item?.id;
		const hit = cache.get(id);
		if (hit && hit.raw === raw) return hit.cleaned;
		const cleaned = cleanFilterKey(stripTags(raw));
		cache.set(id, { raw, cleaned });
		return cleaned;
	};

	const matchesSearch = (item) => {
		if (!needle.value) return true;
		return cleanedText(item).includes(needle.value);
	};

	return { searchValue, matchesSearch };
}
