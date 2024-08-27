import { createApp } from "../../scripts/lib/vue.esm-browser.js";

export default function VueRenderingMixin(BaseApplication) {

    class VueApplication extends BaseApplication {
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
        const target = this.hasFrame ? element.querySelector('.window-content') : element;
        target.innerHTML = this.vueTemplates.join('');

        // Create and store the Vue application instance.
        this.vueApp = createApp({
          // Data available in the template.
          data() {
            return {
              context: context
            }
          },
          // Components allowed by the application.
          components: this.vueComponents,
          // Method to update the template data on subsequent changes.
          methods: {
            updateContext(newContext) {
              // Note that 'this' refers to this.vueApp, not the full AppV2 instance.
              for (let key of Object.keys(this.context)) {
                if (newContext[key]) {
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
        this.vueApp.provide('itemDocument', this.document);

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
        return;
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
        if (this.options.form.submitOnClose) {
          await this.submit();
        }
        // Unmount the vue instance.
        if (this.vueApp) this.vueApp.unmount();
        await super.close(options);
      }
    }

    return VueApplication;
}
