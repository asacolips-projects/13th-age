import { reactive, watch } from "vue";
import { getActor } from "@/methods/Helpers";

/**
 * One sheet field that edits a single path on the actor document: the input
 * binds to a local reactive value instead of the actor data clone, so a
 * rejected edit (permission or validation) rolls back instead of lingering
 * on screen until the next render, and the clone — which feeds every other
 * binding — is never mutated from the view.
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
 * @returns {object} A reactive object whose `value` holds the field for
 *   v-model, and a `write` for the field's change event (`@change="write"`).
 */
export function useDocumentField(actorData, path) {
	const read = (actor) => foundry.utils.getProperty(actor ?? {}, path());

	// A reactive object, not a ref: the templates bind `field.value`, and a ref
	// nested inside a plain object would NOT unwrap there — v-model would
	// receive the ref object itself and feed "[object Object]" to the input on
	// every render.
	const field = reactive({ value: read(actorData()) });

	// The document value the field last showed. While the field differs from
	// it, the user has an edit in progress (typed, or committed and still in
	// flight).
	let synced = field.value;

	// The sheet rebuilds its context (a fresh actor clone) on every document
	// update — including this field's own successful writes — so the field
	// re-syncs from the new clone to show external changes. It doesn't while
	// an edit is in progress: any unrelated update (another field, another
	// user, an effect expiring) would otherwise reset the value mid-typing,
	// and the keystrokes that follow would land on the old text.
	watch(actorData, (actor) => {
		const next = read(actor);
		if (field.value !== synced && field.value !== next) return;
		field.value = next;
		synced = next;
	});

	const write = async () => {
		const actor = await getActor(actorData());
		if (!actor) return;
		const current = read(actor);
		if (field.value === current) {
			synced = current;
			return;
		}
		try {
			await actor.update({ [path()]: field.value });
			// Show what was stored: the update may have adjusted the value (a
			// clamped level, HP capped at max), or been dropped altogether.
			field.value = read(actor);
			synced = field.value;
		}
		catch{
			// Rejected: roll the field back to the document's value.
			field.value = read(actor);
			synced = field.value;
		}
	};

	field.write = write;
	return field;
}
