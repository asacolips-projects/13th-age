import { openBlock, createElementBlock, createElementVNode, toDisplayString, withDirectives, vModelText, resolveComponent, normalizeClass, createVNode, createCommentVNode, pushScopeId, popScopeId, Fragment, renderList, renderSlot } from "../module/lib/vue.esm-browser.js";
function localize(key) {
  return game.i18n.localize(key);
}
function concat(...args) {
  return args.reduce((acc, cur) => {
    return acc + cur;
  }, "");
}
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$4 = {
  name: "CharacterHeader",
  props: ["actor"],
  setup() {
    return {
      localize
    };
  },
  data() {
    return {
      level: {}
    };
  },
  computed: {},
  methods: {},
  async mounted() {
    this.level = this.actor.data.attributes.level;
  }
};
const _hoisted_1$4 = { class: "header character-header grid grid-4col" };
const _hoisted_2$3 = { class: "unit unit--abs-label unit--name" };
const _hoisted_3$1 = { for: "name" };
const _hoisted_4$1 = { class: "unit unit--abs-label unit--race" };
const _hoisted_5$1 = { for: "data.details.race.value" };
const _hoisted_6$1 = { class: "unit unit--abs-label unit--class" };
const _hoisted_7 = { for: "data.details.class.value" };
const _hoisted_8 = { class: "unit unit--abs-label unit--level" };
const _hoisted_9 = { for: "data.attributes.level.value" };
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("header", _hoisted_1$4, [
    createElementVNode("div", _hoisted_2$3, [
      createElementVNode("label", _hoisted_3$1, toDisplayString($setup.localize("ARCHMAGE.name")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "name",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.name = $event)
      }, null, 512), [
        [vModelText, $props.actor.name]
      ])
    ]),
    createElementVNode("div", _hoisted_4$1, [
      createElementVNode("label", _hoisted_5$1, toDisplayString($setup.localize("ARCHMAGE.race")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.race.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.details.race.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.race.value]
      ])
    ]),
    createElementVNode("div", _hoisted_6$1, [
      createElementVNode("label", _hoisted_7, toDisplayString($setup.localize("ARCHMAGE.class")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.class.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $props.actor.data.details.class.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.class.value]
      ])
    ]),
    createElementVNode("div", _hoisted_8, [
      createElementVNode("label", _hoisted_9, toDisplayString($setup.localize("ARCHMAGE.level")), 1),
      withDirectives(createElementVNode("input", {
        type: "number",
        name: "data.attributes.level.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $props.actor.data.attributes.level.value = $event),
        min: "0"
      }, null, 512), [
        [vModelText, $props.actor.data.attributes.level.value]
      ])
    ])
  ]);
}
var CharacterHeader = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4]]);
const _sfc_main$3 = {
  name: "ArchmageCharacterSheet",
  props: ["actor", "owner"],
  setup() {
    return {
      concat
    };
  },
  data() {
    return {
      actorData: {},
      tabs: {
        primary: {
          details: { active: false },
          powers: { active: true },
          inventory: { active: false },
          effects: { active: false },
          settings: { active: false, icon: "fa-cogs", hideLabel: true }
        }
      }
    };
  },
  components: {
    CharacterHeader
  },
  methods: {},
  computed: {
    nightmode() {
      let flags = this.actor.flags ? this.actor.flags.archmage : null;
      return flags && flags.nightmode ? "nightmode" : "";
    },
    flags() {
      let flags = this.actor.flags ? this.actor.flags.archmage : {};
      let baseFlags = {
        "sheetDisplay": {
          "powers": {
            "groupBy": { "value": "powerType" },
            "sortBy": { "value": "custom" }
          },
          "inventory": {
            "sortBy": { "value": "custom" }
          },
          "tabs": {
            "primary": { "value": "powers" }
          }
        }
      };
      return mergeObject(baseFlags, flags);
    }
  },
  watch: {},
  async created() {
    console.log("Creating Sheet");
  },
  async mounted() {
    console.log("Sheet Mounted");
  }
};
const _hoisted_1$3 = { class: "container container--top flexcol" };
const _hoisted_2$2 = /* @__PURE__ */ createElementVNode("section", { class: "container container--bottom flexrow" }, [
  /* @__PURE__ */ createElementVNode("section", { class: "section section--sidebar flexcol" }),
  /* @__PURE__ */ createElementVNode("section", { class: "section section--main flexcol" }, [
    /* @__PURE__ */ createElementVNode("section", { class: "section section--tabs-content flexcol" })
  ])
], -1);
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_CharacterHeader = resolveComponent("CharacterHeader");
  return openBlock(), createElementBlock("div", {
    class: normalizeClass($setup.concat("archmage-v2-vue flexcol ", $options.nightmode))
  }, [
    createElementVNode("section", _hoisted_1$3, [
      createVNode(_component_CharacterHeader, { actor: $props.actor }, null, 8, ["actor"])
    ]),
    _hoisted_2$2
  ], 2);
}
var ArchmageCharacterSheet = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3]]);
var Editor_vue_vue_type_style_index_0_scoped_true_lang = /* @__PURE__ */ (() => ".sheet .editor-wrapper[data-v-6c1d4ffc],.sheet .editor[data-v-6c1d4ffc],.sheet .editor-content[data-v-6c1d4ffc]{height:100%}\n")();
const _sfc_main$2 = {
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
const _withScopeId = (n) => (pushScopeId("data-v-6c1d4ffc"), n = n(), popScopeId(), n);
const _hoisted_1$2 = { class: "editor-wrapper" };
const _hoisted_2$1 = { class: "editor" };
const _hoisted_3 = ["data-edit", "innerHTML"];
const _hoisted_4 = {
  key: 0,
  class: "editor-edit"
};
const _hoisted_5 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1));
const _hoisted_6 = [
  _hoisted_5
];
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$2, [
    createElementVNode("div", _hoisted_2$1, [
      createElementVNode("div", {
        class: "editor-content",
        "data-edit": $props.target,
        innerHTML: $options.enrichHTML()
      }, null, 8, _hoisted_3),
      $data.canEdit ? (openBlock(), createElementBlock("a", _hoisted_4, _hoisted_6)) : createCommentVNode("", true)
    ])
  ]);
}
var Editor = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-6c1d4ffc"]]);
const _sfc_main$1 = {
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
const _hoisted_1$1 = ["data-group"];
const _hoisted_2 = ["data-tab"];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
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
      }, toDisplayString(tab.label), 11, _hoisted_2);
    }), 128))
  ], 10, _hoisted_1$1);
}
var Tabs = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1]]);
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
export { ArchmageCharacterSheet, Editor, Tab, Tabs };
//# sourceMappingURL=components.vue.es.js.map
