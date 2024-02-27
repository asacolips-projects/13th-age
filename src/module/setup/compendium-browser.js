// Import Vue dependencies.
import { createApp } from "../../scripts/lib/vue.esm-browser.js";
import { ArchmageCompendiumBrowser } from "../../vue/components.vue.es.js";

export class ArchmageCompendiumBrowserApplication extends Application {
  constructor(...args) {
    super(...args);

    this.vueApp = null;
    this.vueRoot = null;
    this.vueListenersActive = false;
    this.vueComponents = {
      'compendium-browser': ArchmageCompendiumBrowser
    };
  }

  static get defaultOptions() {
    return {...super.defaultOptions,
      classes: [
        'form',
        'archmage-v2',
        'archmage-dialog'
      ],
      popOut: true,
      template: "systems/archmage/templates/dialog/compendium-browser.html",
      id: 'archmage-compendium-browser',
      title: 'Compendium Browser',
      width: 1024,
      height: 640,
    };
  }

  async getData() {
    // Compendiums are retrieved in the created() section of their respective
    // component tabs.
    return {
      defaultTab: this.options.defaultTab ?? 'creatures',
    };
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  async render(force=false, options={}) {
    const context = await this.getData();

    // @todo refactor below lines to remove .then() calls in favor of await

    // Render the vue application after loading. We'll need to destroy this
    // later in the this.close() method for the sheet.
    if (!this.vueApp || !this.vueRoot) {
      this.vueRoot = null;
      this.vueApp = createApp({
        // Initialize data.
        data() {
          return {
            context: context,
          }
        },
        // Define our character sheet component.
        components: this.vueComponents,
        // Create a method to the update the data while retaining reactivity.
        methods: {
          updateContext(newContext) {
            for (let key of Object.keys(this.context)) {
              this.context[key] = newContext[key];
            }
          }
        }
      });
    }
    // Otherwise, perform update routines on the app.
    else {
      // Pass new values from this.getData() into the app.
      this.vueRoot.updateContext(context);
      // Reactivate the listeners if we need to.
      if (!this.vueListenersActive) {
        setTimeout(() => {
          this.activateVueListeners($(this.form), true);
        }, 150);
      }
      return;
    }

    // If we don't have an active vueRoot, run Foundry's render and then mount
    // the Vue application to the form.
    this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    })
    // Run Vue's render, assign it to our prop for tracking.
    .then(rendered => {
      let $selector = $(`[data-appid="${this.appId}"] .archmage-vue`);
      if ($selector.length > 0) {
        this.vueRoot = this.vueApp.mount(`[data-appid="${this.appId}"] .archmage-vue`);
        // @todo Find a better solution than a timeout.
        setTimeout(() => {
          this.activateVueListeners($(this.form), false);
        }, 150);
        console.log(this);
      }
    });


    // Store our app for later.
    // this.object.apps[this.appId] = this; @OBSOLETE?
    return this;
  }

  /** @override */
  async close(options={}) {
    // Run the upstream close method.
    const result = await super.close(options);
    // Unmount and clean up the vue app on close.
    this.vueApp.unmount();
    this.vueApp = null;
    this.vueRoot = null;
    // Return the close response from earlier.
    return result;
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  activateListeners(html) {
    super.activateListeners(html);
  }

  /**
   * Activate additional listeners on the rendered Vue app.
   * @param {jQuery} html
   */
  activateVueListeners(html, repeat = false) {
    if (!this.options.editable) {
      html.find('input,select,textarea').attr('disabled', true);
      return;
    }

    if (html.find('.archmage-v2-vue').length > 0) {
      this.vueListenersActive = true;
    }

    // this._dragHandler(html);

    // Place one-time executions after this line.
    if (repeat) return;

    html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));

    // Input listeners.
    let inputs = '.section input[type="text"], .section input[type="number"]';
    html.on('focus', inputs, (event) => this._onFocus(event));
  }

  _onFocus(event) {
    let target = event.currentTarget;
    setTimeout(function() {
      if (target == document.activeElement) {
        $(target).trigger('select');
      }
    }, 100);
  }

  async _updateObject(event, formData) {}
}