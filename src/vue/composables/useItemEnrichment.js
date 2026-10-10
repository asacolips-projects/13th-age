import { computed } from "vue";

/**
 * Shared enrichment plumbing for the v3 detail views: resolves the item's
 * live document and builds the enrichment options, so the same item reads
 * the same way on the listing as on its sheet.
 *
 * @param {Function} item Accessor for the item data, e.g. () => props.power.
 * @param {Function} actor Accessor for the actor data, e.g. () => props.actor.
 *   The context clone carries the drag data the item document is resolved
 *   from and the owner/secrets state.
 * @param {Function} context Accessor for the render context, whose rollData
 *   the enrichment uses.
 *
 * @returns {object} The `itemDocument`, `diceFormulaMode` and
 *   `enrichmentOptions` computeds.
 */
export function useItemEnrichment(item, actor, context) {
	const diceFormulaMode = computed(() => actor()?.flags?.archmage?.diceFormulaMode ?? "short");

	/**
	 * The item's document, when it can be resolved. Enrichment needs it to
	 * resolve relative UUID links, such as @UUID[.someId].
	 */
	const itemDocument = computed(() => {
		const uuid = actor()?.dragData?.uuid;
		const doc = item();
		if (!uuid || !doc?._id) return null;
		try {
			return fromUuidSync(uuid)?.items?.get(doc._id) ?? null;
		}
		catch(error) {
			return null;
		}
	});

	/**
	 * Enrichment options matching the ones the item sheet enriches with, so the
	 * same item reads the same way on both.
	 */
	const enrichmentOptions = computed(() => ({
		secrets: actor()?.owner ?? false,
		rollData: context()?.rollData ?? {},
		relativeTo: itemDocument.value
	}));

	return { diceFormulaMode, itemDocument, enrichmentOptions };
}
