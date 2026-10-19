import { ref, watch } from "vue";
import { getActor } from "@/methods/Helpers";

/**
 * One sheet field that edits a single path on the actor document: the input
 * binds to a local ref instead of the actor data clone, so a rejected edit
 * (permission or validation) rolls back instead of lingering on screen
 * until the next render, and the clone — which feeds every other binding —
 * is never mutated from the view.
 *
 * The value persists through the live document on the field's change event,
 * like the sheet form's submitOnChange did for it; the field therefore
 * drops its `name` attribute so the form's own submit doesn't also carry
 * it. Nothing is written when the change leaves the value equal to the
 * document's.
 *
 * @param {Function} actorData Accessor for the sheet's actor data clone —
 *   replaced on every document update, which re-syncs the field.
 * @param {Function} path Accessor for the document path the field edits,
 *   e.g. `system.attributes.hp.value`.
 *
 * @returns {object} The `value` ref for v-model, and a `write` for the
 *   field's change event (`@change="write"`).
 */
export function useDocumentField(actorData, path) {
	const read = (actor) => foundry.utils.getProperty(actor ?? {}, path());

	const value = ref(read(actorData()));

	// The sheet rebuilds its context (a fresh actor clone) on every document
	// update — including this field's own successful writes — so the ref
	// re-syncs from the new clone to show external changes.
	watch(actorData, (actor) => {
		value.value = read(actor);
	});

	const write = async () => {
		const actor = await getActor(actorData());
		if (!actor) return;
		const current = read(actor);
		if (value.value === current) return;
		try {
			await actor.update({ [path()]: value.value });
		}
		catch{
			// Rejected: roll the field back to the document's value.
			value.value = read(actor);
		}
	};

	return { value, write };
}
