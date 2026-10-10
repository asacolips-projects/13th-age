import { ref } from "vue";

/**
 * A Foundry ProseMirror editor mounted onto a host element, enriched like the
 * sheets enrich their values: the display-side helper for the same
 * TextEditor.enrichHTML options and the HTMLProseMirrorElement.create wiring
 * the notes and identity fields use. Its change event on blur flows through
 * the enclosing form's submitOnChange, so no explicit save wiring is needed.
 *
 * @param {object} options
 * @param {object} options.host Ref holding the host element the editor
 *   replaces the children of.
 * @param {string} options.field The document field the editor binds to, e.g.
 *   'system.details.biography.value'.
 * @param {Function} options.getValue Accessor for the field's current raw
 *   value.
 * @param {Function} options.owner Accessor for whether the viewer may see
 *   secrets, e.g. () => props.actor?.owner.
 * @param {string} [options.documentUUID] The owning document's UUID, for
 *   ProseMirror's relative links.
 * @param {boolean} [options.toggled] Whether the editor starts open.
 * @param {Function} [options.disabled] Accessor for the editor's disabled
 *   state, evaluated at mount time.
 *
 * @returns {object} The mounted `editorEl` ref, the `enrich` helper and
 *   `mountEditor`.
 */
export function useProseMirrorEditor({
	host,
	field,
	getValue,
	owner,
	documentUUID = null,
	toggled = false,
	disabled = null
}) {
	const editorEl = ref(null);

	/**
	 *
	 * @param raw
	 */
	async function enrich(raw) {
		return foundry.applications.ux.TextEditor.implementation.enrichHTML(raw, {
			secrets: owner(),
			documents: true,
			links: true,
			rolls: true,
			rollData: {},
			async: false
		});
	}

	/**
	 *
	 */
	async function mountEditor() {
		const raw = getValue();
		const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
			name: field,
			value: raw,
			enriched: await enrich(raw),
			toggled,
			documentUUID,
			...(disabled ? { disabled: disabled() } : {})
		});
		editorEl.value = editor;
		host.value.replaceChildren(editor);
		return editor;
	}

	return { editorEl, enrich, mountEditor };
}
