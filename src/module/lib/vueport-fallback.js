// Based on https://github.com/ForgeVTT/fvtt-module-vueport/blob/master/vueport.js by KaKaRoTo.
// This file is only used if the VuePort module is not installed.
'use strict';

class VuePort {
    static async setup() {
        await archmageLoadJs('/systems/archmage/scripts/lib/vue.min.js');
        Vue.config.devtools = false;
        // Expose Foundry objects as global object in Vue plugin
        Vue.use({
            install(Vue, options) {
                Vue.prototype.ui = ui;
                Vue.prototype.game = game;
                Vue.prototype.canvas = canvas;
            },
        });

        await archmageLoadJs('/systems/archmage/scripts/lib/vuex.min.js');
        // TODO: This line doesn't seem to be necessary. Not sure why it was
        // in VuePort originally.
        // Vue.use(Vuex);
        const observer = new window.MutationObserver(VuePort._documentModified.bind(VuePort));
        observer.observe(document, { "subtree": true, "childList": true });
        this._autoRender();
    }
    static async render(template, element, {data = {}, store = null, dependencies=[], renderData}={}) {
        return new Vue({
            render: template ? h => h(this.Components[template], renderData) : undefined,
            el: element,
            data,
            store
          });
    }

    static async _autoRender(element) {
        const components = $(element).find(".vueport-render").addBack(".vueport-render");
        for (let el of components.toArray()) {
            const id = el.id || "vueApp";
            const deps = el.getAttribute("dependencies") || undefined;
            // Can't change the class after render because the element won't exist anymore and there's no guarantee
            // that the Vue element itself won't be a comment/lazy-loaded.
            // Also, we don't want to re-trigger the mutation observer on the vue content
            el.classList.remove("vueport-render");
            el.classList.add("vueport-rendered");
            this[id] = await this.render(null, el, {dependencies: deps && deps.split(" ")});
        }
    }
    static async _documentModified(mutations, observer) {
        const addedNodes = mutations.reduce((nodes, mutation) => nodes.concat(...mutation.addedNodes), [])
        return this._autoRender(addedNodes);
    }
    static async loadCss(config) {
        // TODO: VuePort didn't include any custom CSS, so this is disabled.
        // return Dlopen.loadCss(config);
    }
}

VuePort.VueComponents = {};

// Hooks.on('init', () => VuePort.init());
Hooks.on('setup', () => VuePort.setup());