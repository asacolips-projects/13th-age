import { computed } from "vue";

/**
 * Sequential enable/disable toggles for a keyed record of the actor's data,
 * shared by the backgrounds and icons sidebar units: "+" enables the first
 * inactive record, "-" disables the last active one, both in the record
 * order.
 *
 * @param {object} document The actor document updates go through.
 * @param {string} field The record's system field, e.g. 'backgrounds'.
 * @param {Function} entries Accessor for the record's entries, as
 *   Object.entries gives them: [key, value] pairs.
 *
 * @returns {object} The `nextKey` and `lastEnabledKey` computeds and the
 *   `enableNext` / `disableLast` functions.
 */
export function useActiveToggles(document, field, entries) {
	// The next record to enable is the first inactive one; the last enabled
	// record is the last active one in the record order.
	const nextKey = computed(() =>
		entries().find(([_, record]) => record.isActive?.value !== true)?.[0] ?? null
	);

	const lastEnabledKey = computed(() => {
		let key = null;
		for (const [k, record] of entries()) {
			if (record.isActive?.value === true) key = k;
		}
		return key;
	});

	/**
	 *
	 */
	function enableNext() {
		if (nextKey.value) {
			document?.update({ [`system.${field}.${nextKey.value}.isActive.value`]: true });
		}
	}

	/**
	 *
	 */
	function disableLast() {
		if (lastEnabledKey.value) {
			document?.update({ [`system.${field}.${lastEnabledKey.value}.isActive.value`]: false });
		}
	}

	return { nextKey, lastEnabledKey, enableNext, disableLast };
}
