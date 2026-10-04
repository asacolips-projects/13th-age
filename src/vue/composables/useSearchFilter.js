import { ref } from 'vue';
import { cleanFilterKey, stripTags } from '@/methods/Helpers';

/**
 * Text filter state for the v3 tabs' listings: the filter box's value and
 * clear widget, and a matcher that indexes each row's searchable text the
 * same way the input is keyed. Enriched-HTML markup is stripped with the
 * cheap regex strip first — searching raw HTML would match tag names and
 * miss matches split across tags — and both sides reduce to bare
 * alphanumerics, so punctuation and spacing don't need to match exactly.
 *
 * @param {Function} searchText (item) => the searchable text for a row: its
 *   name plus whatever fields the expanded row shows.
 *
 * @returns {object} The `searchValue` ref, `clearSearch` and `matchesSearch`.
 */
export function useSearchFilter(searchText) {
  const searchValue = ref(null);

  // The filter box's clear widget; resetting to null also hides the button.
  const clearSearch = () => {
    searchValue.value = null;
  };

  const matchesSearch = (item) => {
    const needle = cleanFilterKey(searchValue.value ?? '');
    if (!needle) return true;
    return cleanFilterKey(stripTags(searchText(item))).includes(needle);
  };

  return { searchValue, clearSearch, matchesSearch };
}
