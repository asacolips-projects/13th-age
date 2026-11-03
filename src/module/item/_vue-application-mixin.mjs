import { createApp } from "../../scripts/lib/vue.esm-browser.js";

/**
 * Injection keys used to provide documents to the Vue apps via
 * provide/inject. Applications set `documentProvideKey` to the key matching
 * their document, and components inject the same key.
 *
 * @type {Record<string, string>}
 */
export const DOCUMENT_PROVIDE_KEYS = {
	itemDocument: "itemDocument",
	actorDocument: "actorDocument"
};

/**
 * @param BaseApplication
 */
export default function VueRenderingMixin(BaseApplication) {

	class VueApplication extends BaseApplication {
		/** Helper property for checking the shift key during paste events. */
		isShift = false;

		/** Vue application instance created with createApp(). */
		vueApp = null;

		/** Vue root for the mounted application instance. */
		vueRoot = null;

		/** Constant to force updates on change. */
		_renderKey = 0;

		/**
		 * Object to store vue parts.
		 *
		 * @example
		 * vueParts = {
		 *   'document-sheet': {
		 *     component: DocumentSheetVue,
		 *     template: `<document-sheet :context="context">Failed to render</document-sheet>`
		 *   },
		 *   'foobar': {
		 *     component: Foobar,
		 *     template: `<foobar :context="context"/>`
		 *   }
		 * }
		 */
		vueParts = {};

		/** Injection key used to provide the document to the Vue app. Subclasses override (e.g. DOCUMENT_PROVIDE_KEYS.actorDocument). */
		documentProvideKey = DOCUMENT_PROVIDE_KEYS.itemDocument;

		/**
		 * Getter for vueComponents
		 *
		 * Retrieves an object of component tags to component instances from the vueParts property.
		 *
		 * @example
		 * {
		 *   'document-sheet': DocumentSheet,
		 *   'foobar': Foobar,
		 * }
		 */
		get vueComponents() {
			const components = {};
			for (let [key, part] of Object.entries(this.vueParts)) {
				if (part?.component) {
					components[key] = part.component;
				}
			}
			return components;
		}

		/**
		 * Getter for vueTemplates
		 *
		 * Retrieves an array of template part strings to render.
		 *
		 * @example
		 * [
		 *   '<document-sheet :context="context">Failed to render</document-sheet>',
		 *   '<foobar :context="context"/>'
		 * ]
		 */
		get vueTemplates() {
			return Object.values(this.vueParts).map((part) => part.template);
		}

		/**
		 * Render the outer framing HTMLElement and mount the Vue application.
		 *
		 * This occurs when the application is opened, but not on subsequent renders.
		 *
		 * @param {RenderOptions} options
		 * @returns {Promise<HTMLElement>}
		 *
		 * @protected
		 * @override
		 */
		async _renderFrame(options) {
			// Retrieve the context and element.
			const context = await this._prepareContext(options);
			const element = await super._renderFrame(options);

			// Grab our application target and render our parts.
			const target = this.hasFrame ? element.querySelector(".window-content") : element;
			target.innerHTML = this.vueTemplates.join("");

			// Create and store the Vue application instance.
			this.vueApp = createApp({
				// Data available in the template.
				data() {
					return {
						context: context
					};
				},
				// Components allowed by the application.
				components: this.vueComponents,
				// Method to update the template data on subsequent changes.
				methods: {
					updateContext(newContext) {
						// Note that 'this' refers to this.vueApp, not the full AppV2 instance.
						for (let key of Object.keys(this.context)) {
							// Use `in` rather than a truthiness check so falsy updates
							// (e.g. editable: true -> false) propagate.
							if (key in newContext) {
								this.context[key] = newContext[key];
							}
						}
					}
				}
			});
			// Expose global Foundry variables.
			this.vueApp.config.globalProperties.game = game;
			this.vueApp.config.globalProperties.CONFIG = CONFIG;
			this.vueApp.config.globalProperties.foundry = foundry;

			// Expose the document.
			this.vueApp.provide(this.documentProvideKey, this.document);

			// Mount and store the vue application.
			this.vueRoot = this.vueApp.mount(target);

			return element;
		}

		/**
		 * Handle updates for the Vue application instance.
		 *
		 * Normally, this would render the HTML for the content within the application.
		 * However, for Vue, all we want to do is update the 'context' property that's
		 * passed into the Vue application instance.
		 *
		 * Unlinke _renderFrame(), this occurs on every update for the application.
		 *
		 * @param {ApplicationRenderContext} context
		 * @param {RenderOptions} options
		 * @returns {Promise<string>}
		 *
		 * @protected
		 * @override
		 */
		async _renderHTML(context, options) {
			// Force certain updates.
			this._renderKey++;
			context._renderKey = this._renderKey;
			// Update the application root with new values.
			this.vueRoot.updateContext(context);
			// Return doesn't matter, Vue handles updates.

		}

		_onRender(context, options) {
			// Re-renders can replace this.element, so an observer watching the
			// previous one is stale — drop it and let the branches below bind
			// a fresh one.
			if (this._disableObserverEl !== this.element) {
				this._disableObserver?.disconnect();
				this._disableObserver = null;
				this._disableObserverEl = null;
			}

			if (!this.isEditable) {
				// Observers and non-owners get read-only fields. _onRender runs
				// on every re-render, but inputs mounted after it — a tab
				// switch, an expanded row, the narrow/wide layout swap — never
				// see one, so a mutation observer applies the same pass to
				// fields as they arrive.
				const disableFields = (root) => {
					for (let field of root.querySelectorAll("input, textarea, select")) {
						field.setAttribute("readonly", true);
						field.setAttribute("disabled", true);
					}
				};
				disableFields(this.element);
				if (!this._disableObserver) {
					this._disableObserver = new MutationObserver((mutations) => {
						for (const mutation of mutations) {
							for (const node of mutation.addedNodes) {
								if (node.nodeType !== Node.ELEMENT_NODE) continue;
								if (node.matches("input, textarea, select")) {
									node.setAttribute("readonly", true);
									node.setAttribute("disabled", true);
								}
								disableFields(node);
							}
						}
					});
					this._disableObserverEl = this.element;
					this._disableObserver.observe(this.element, { childList: true, subtree: true });
				}
			}
			else {
				// Set a variable when the shift key is pressed to avoid paste events.
				// Bound once per element: _onRender runs on every re-render (with
				// submitOnChange, every save), and Foundry caches the sheet
				// instance while re-renders replace this.element — so an
				// instance-level guard would leave every element after the first
				// one without listeners. Keying the guard on the element, like the
				// paste handler below, rebinds for each new element without
				// stacking duplicates on the re-renders that keep it.
				if (!this.element.dataset.archmageKeysBound) {
					this.element.dataset.archmageKeysBound = "true";
					this.element.addEventListener("keydown", (event) => {
						if (event.key === "Shift" && !this.isShift) {
							this.isShift = true;
						}
					});
					this.element.addEventListener("keyup", (event) => {
						if (event.key === "Shift" && this.isShift) {
							this.isShift = false;
						}
					});
				}
				// Handle paste events — once per editor element, since re-renders
				// re-query .editor-content and Vue may have replaced the element.
				this.element.querySelectorAll(".editor-content").forEach((editor) => {
					if (editor.dataset.archmagePasteBound) return;
					editor.dataset.archmagePasteBound = "true";
					editor.addEventListener("paste", (event) => this._parsePastedContent(event));
				});
			}
		}

		/** @override */
		_replaceHTML(result, content, options) {
			// Pass. We don't need this in Vue land! But Foundry itself does...
		}

		/**
		 * Closes the application and unmounts the vue application instance.
		 *
		 * @param {ApplicationClosingOptions} options
		 * @returns {Promise<BaseApplication>}
		 *
		 * @override
		 */
		async close(options = {}) {
			if (this.options.form.submitOnClose && this.isEditable) {
				await this.submit();
			}
			// Unmount the vue instance.
			if (this.vueApp) this.vueApp.unmount();
			await super.close(options);
		}

		/* -------------------------------------------- */

		_parsePastedContent(event) {
			if (!this.isShift && game.settings.get("archmage", "allowPasteParsing")) {
				const target = event.target;
				const prosemirror = target.closest("prose-mirror");

				if (!prosemirror) return;
				event.preventDefault();

				const options = {
					field: prosemirror.name
				};
				// Retrieve the value from the field and the clipboard.
				const paste = (event.clipboardData || window.clipboardData).getData("text");
				const result = game.archmage.ArchmageUtility.parseClipboardText(paste, options);
				let newValue = result;

				// Handle selections.
				const selection = window.getSelection();
				if (!selection.rangeCount) return;
				selection.deleteFromDocument();
				selection.getRangeAt(0).insertNode(document.createTextNode(newValue));
				selection.collapseToEnd();
			}
		}
	}

	return VueApplication;
}
