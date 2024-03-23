// Import Vue dependencies.
import { createApp } from "../../scripts/lib/vue.esm-browser.js";
import { ArchmageCompendiumBrowser } from "../../vue/components.vue.es.js";


/**
 * Application class for the Compendium Browser.
 *
 * Extends the Application class into a Vue-based application.
 *
 * @todo refactor Vue boilerplate code into a mixin that can be used both
 * here and in the actor sheet.
 *
 * @export
 * @class ArchmageCompendiumBrowserApplication
 * @typedef {ArchmageCompendiumBrowserApplication}
 * @extends {Application}
 */
export class ArchmageCompendiumBrowserApplication extends Application {
  /** @override */
  constructor(...args) {
    super(...args);

    this.vueApp = null;
    this.vueRoot = null;
    this.vueListenersActive = false;
    this.vueComponents = {
      'compendium-browser': ArchmageCompendiumBrowser
    };
  }

  /** @override */
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
      title: game.i18n.localize('ARCHMAGE.COMPENDIUMBROWSER.title'),
      width: 1024,
      height: 775,
      resizable: true,
    };
  }

  /** @override */
  async getData() {
    // We only need to return data for the default tab, as compendium content
    // is loaded in the create() method of their respective components.
    return {
      // @todo add more default options, like saved filters.
      defaultTab: this.options.defaultTab ?? 'creatures',
      escalationDie: game.archmage.ArchmageUtility.getEscalation(),
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
    await this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    })

    // Mount our rendered app.
    let $selector = $(`[data-appid="${this.appId}"] .archmage-vue`);
    if ($selector.length > 0) {
      this.vueRoot = this.vueApp.mount(`[data-appid="${this.appId}"] .archmage-vue`);
      // @todo Find a better solution than a timeout.
      setTimeout(() => {
        this.activateVueListeners($(this.form), false);
      }, 150);
    }

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

  /** @override */
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

    // Place one-time executions after this line.
    if (repeat) return;

    // Input listeners.
    let inputs = '.section input[type="text"], .section input[type="number"]';
    html.on('focus', inputs, (event) => this._onFocus(event));
  }


  /**
   * Handle focus events.
   *
   * @param {*} event
   */
  _onFocus(event) {
    let target = event.currentTarget;
    setTimeout(function() {
      if (target == document.activeElement) {
        $(target).trigger('select');
      }
    }, 100);
  }
}
