import { openBlock, createElementBlock, createElementVNode, withDirectives, vModelText, normalizeClass, Fragment, renderList, toDisplayString, resolveComponent, createVNode, pushScopeId, popScopeId, createCommentVNode, renderSlot } from "../module/lib/vue.esm-browser.js";
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$4 = {
  name: "Header",
  props: ["actor"],
  computed: {
    data() {
      return this.actor.data;
    }
  },
  methods: {}
};
const _hoisted_1$4 = { class: "sheet-header" };
const _hoisted_2$2 = ["src", "alt"];
const _hoisted_3$1 = { class: "header-fields" };
const _hoisted_4$1 = { class: "charname flexcol" };
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("header", _hoisted_1$4, [
    createElementVNode("img", {
      src: $props.actor.img,
      alt: $props.actor.name,
      class: "profile-img",
      height: "100",
      width: "100"
    }, null, 8, _hoisted_2$2),
    createElementVNode("div", _hoisted_3$1, [
      createElementVNode("a", {
        onClick: _cache[0] || (_cache[0] = (...args) => _ctx.launchDialog && _ctx.launchDialog(...args))
      }, "Launch Dialog"),
      createElementVNode("h1", _hoisted_4$1, [
        withDirectives(createElementVNode("input", {
          type: "text",
          name: "name",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.name = $event),
          placeholder: "Name"
        }, null, 512), [
          [vModelText, $props.actor.name]
        ])
      ])
    ])
  ]);
}
var Header = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4]]);
const _sfc_main$3 = {
  name: "Tabs",
  props: ["context", "actor", "group", "tabs"],
  data() {
    return {
      currentTab: "features"
    };
  },
  methods: {
    changeTab(event) {
      if (event && event.currentTarget) {
        let $target = $(event.currentTarget);
        this.currentTab = $target.data("tab");
      }
      for (let [k, v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }
      this.tabs[this.currentTab].active = true;
    },
    getTabClass(tab, index) {
      return `item ${tab.active ? " active" : ""}`;
    }
  }
};
const _hoisted_1$3 = ["data-group"];
const _hoisted_2$1 = ["data-tab"];
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("nav", {
    class: normalizeClass("sheet-tabs tabs tabs--" + $props.group),
    "data-group": $props.group
  }, [
    (openBlock(true), createElementBlock(Fragment, null, renderList($props.tabs, (tab, tabKey) => {
      return openBlock(), createElementBlock("a", {
        key: "tab-" + $props.group + "-" + tabKey,
        onClick: _cache[0] || (_cache[0] = (...args) => $options.changeTab && $options.changeTab(...args)),
        class: normalizeClass($options.getTabClass(tab, tabKey)),
        "data-tab": tabKey
      }, toDisplayString(tab.label), 11, _hoisted_2$1);
    }), 128))
  ], 10, _hoisted_1$3);
}
var Tabs = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3]]);
var CharacterSheet_vue_vue_type_style_index_0_scoped_true_lang = /* @__PURE__ */ (() => "h3[data-v-2f23bca2]{margin:40px 0 0}ul[data-v-2f23bca2]{list-style-type:none;padding:0}li[data-v-2f23bca2]{display:inline-block;margin:0 10px}a[data-v-2f23bca2]{color:#42b983}\n")();
const _sfc_main$2 = {
  name: "CharacterSheet",
  props: ["msg", "actor", "context"],
  data() {
    return {
      tabs: {
        primary: {
          features: {
            key: "features",
            active: true,
            label: "Features"
          },
          description: {
            key: "description",
            active: false,
            label: "Description"
          },
          items: {
            key: "items",
            active: false,
            label: "Items"
          },
          spells: {
            key: "spells",
            active: false,
            label: "Spells"
          },
          effects: {
            key: "effects",
            active: false,
            label: "Effects"
          }
        }
      }
    };
  },
  components: {
    Header,
    Tabs
  },
  methods: {}
};
const _withScopeId$1 = (n) => (pushScopeId("data-v-2f23bca2"), n = n(), popScopeId(), n);
const _hoisted_1$2 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createElementVNode("section", { class: "sheet-body" }, null, -1));
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Header = resolveComponent("Header");
  const _component_Tabs = resolveComponent("Tabs");
  return openBlock(), createElementBlock(Fragment, null, [
    createVNode(_component_Header, {
      actor: $props.context.actor
    }, null, 8, ["actor"]),
    createVNode(_component_Tabs, {
      actor: $props.context.actor,
      group: "primary",
      tabs: $data.tabs.primary
    }, null, 8, ["actor", "tabs"]),
    _hoisted_1$2
  ], 64);
}
var CharacterSheet = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-2f23bca2"]]);
var Editor_vue_vue_type_style_index_0_scoped_true_lang = /* @__PURE__ */ (() => ".sheet .editor-wrapper[data-v-576be6d7],.sheet .editor[data-v-576be6d7],.sheet .editor-content[data-v-576be6d7]{height:100%}\n")();
const _sfc_main$1 = {
  name: "Edtior",
  props: ["owner", "target", "content", "button", "editable", "documents", "links", "rolls", "rollData"],
  data() {
    return {
      canEdit: false
    };
  },
  computed: {},
  methods: {
    enrichHTML() {
      var _a, _b, _c, _d;
      const button = Boolean(this.button);
      const editable = Boolean(this.editable);
      this.canEdit = button && editable;
      const editor = TextEditor.enrichHTML(this.content || "", {
        secrets: this.owner,
        documents: (_a = this.documents) != null ? _a : true,
        links: (_b = this.links) != null ? _b : true,
        rolls: (_c = this.rolls) != null ? _c : true,
        rollData: (_d = this.rollData) != null ? _d : {}
      });
      return editor;
    }
  }
};
const _withScopeId = (n) => (pushScopeId("data-v-576be6d7"), n = n(), popScopeId(), n);
const _hoisted_1$1 = { class: "editor-wrapper" };
const _hoisted_2 = { class: "editor" };
const _hoisted_3 = ["data-edit", "innerHTML"];
const _hoisted_4 = {
  key: 0,
  class: "editor-edit"
};
const _hoisted_5 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1));
const _hoisted_6 = [
  _hoisted_5
];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$1, [
    createElementVNode("div", _hoisted_2, [
      createElementVNode("div", {
        class: "editor-content",
        "data-edit": $props.target,
        innerHTML: $options.enrichHTML()
      }, null, 8, _hoisted_3),
      $data.canEdit ? (openBlock(), createElementBlock("a", _hoisted_4, _hoisted_6)) : createCommentVNode("", true)
    ])
  ]);
}
var Editor = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-576be6d7"]]);
const _sfc_main = {
  name: "Tab",
  props: ["context", "actor", "tab", "group"],
  computed: {}
};
const _hoisted_1 = ["data-group", "data-tab"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", {
    class: normalizeClass("tab " + $props.tab.key + ($props.tab.active ? " active" : "")),
    "data-group": $props.group,
    "data-tab": $props.tab.key
  }, [
    renderSlot(_ctx.$slots, "default")
  ], 10, _hoisted_1);
}
var Tab = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export { CharacterSheet, Editor, Tab, Tabs };
//# sourceMappingURL=components.vue.es.js.map
