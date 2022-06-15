import { openBlock, createElementBlock, createElementVNode, normalizeClass, Fragment, renderList, createCommentVNode, toDisplayString, renderSlot, withDirectives, vModelText, normalizeStyle, resolveComponent, createVNode, vModelCheckbox, vModelSelect, pushScopeId, popScopeId, createTextVNode, withCtx, createBlock } from "../scripts/lib/vue.esm-browser.js";
function localize(key) {
  return game.i18n.localize(key);
}
function numberFormat(value, dec = 0, sign = false) {
  value = parseFloat(value).toFixed(dec);
  if (sign)
    return value >= 0 ? `+${value}` : value;
  return value;
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
const _sfc_main$m = {
  name: "Tabs",
  props: ["context", "actor", "group", "tabs", "flags"],
  setup() {
    return { concat };
  },
  data() {
    return {
      currentTab: "powers"
    };
  },
  methods: {
    changeTab(event) {
      var _a;
      if (event && event.currentTarget) {
        let $target = $(event.currentTarget);
        this.currentTab = $target.data("tab");
      }
      for (let [k, v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }
      this.tabs[this.currentTab].active = true;
      const actor = (_a = game.actors.get(this.actor._id)) != null ? _a : false;
      if (actor)
        actor.setFlag("archmage", `sheetDisplay.tabs.${this.group}.value`, this.currentTab);
    },
    getTabClass(tab, index) {
      return `tab-link tab-link--${index}${tab.active ? " active" : ""}`;
    }
  },
  async mounted() {
    this.currentTab = this.flags.sheetDisplay.tabs[this.group].value ? this.flags.sheetDisplay.tabs[this.group].value : "details";
    this.changeTab(false);
  }
};
const _hoisted_1$l = { class: "section section--tabs flexshrink" };
const _hoisted_2$i = ["data-group"];
const _hoisted_3$h = ["data-tab"];
const _hoisted_4$g = { key: 1 };
function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$l, [
    createElementVNode("nav", {
      class: normalizeClass("sheet-tabs tabs tabs--" + $props.group),
      "data-group": $props.group
    }, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($props.tabs, (tab, tabKey) => {
        return openBlock(), createElementBlock("a", {
          key: "tab-" + $props.group + "-" + tabKey,
          onClick: _cache[0] || (_cache[0] = (...args) => $options.changeTab && $options.changeTab(...args)),
          class: normalizeClass($options.getTabClass(tab, tabKey)),
          "data-tab": tabKey
        }, [
          tab.icon ? (openBlock(), createElementBlock("i", {
            key: 0,
            class: normalizeClass($setup.concat("fas ", tab.icon))
          }, null, 2)) : createCommentVNode("", true),
          !tab.hideLabel ? (openBlock(), createElementBlock("span", _hoisted_4$g, toDisplayString(tab.label), 1)) : createCommentVNode("", true)
        ], 10, _hoisted_3$h);
      }), 128))
    ], 10, _hoisted_2$i)
  ]);
}
var Tabs = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$m]]);
const _sfc_main$l = {
  name: "Tab",
  props: ["context", "actor", "tab", "group"],
  computed: {}
};
const _hoisted_1$k = ["data-group", "data-tab"];
function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", {
    class: normalizeClass("tab " + $props.tab.key + ($props.tab.active ? " active" : "")),
    "data-group": $props.group,
    "data-tab": $props.tab.key
  }, [
    renderSlot(_ctx.$slots, "default")
  ], 10, _hoisted_1$k);
}
var Tab = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$l]]);
const _sfc_main$k = {
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
const _hoisted_1$j = { class: "header character-header grid grid-4col" };
const _hoisted_2$h = { class: "unit unit--abs-label unit--name" };
const _hoisted_3$g = { for: "name" };
const _hoisted_4$f = { class: "unit unit--abs-label unit--race" };
const _hoisted_5$e = { for: "data.details.race.value" };
const _hoisted_6$d = { class: "unit unit--abs-label unit--class" };
const _hoisted_7$b = { for: "data.details.class.value" };
const _hoisted_8$b = { class: "unit unit--abs-label unit--level" };
const _hoisted_9$a = { for: "data.attributes.level.value" };
function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("header", _hoisted_1$j, [
    createElementVNode("div", _hoisted_2$h, [
      createElementVNode("label", _hoisted_3$g, toDisplayString($setup.localize("ARCHMAGE.name")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "name",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.name = $event)
      }, null, 512), [
        [vModelText, $props.actor.name]
      ])
    ]),
    createElementVNode("div", _hoisted_4$f, [
      createElementVNode("label", _hoisted_5$e, toDisplayString($setup.localize("ARCHMAGE.race")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.race.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.details.race.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.race.value]
      ])
    ]),
    createElementVNode("div", _hoisted_6$d, [
      createElementVNode("label", _hoisted_7$b, toDisplayString($setup.localize("ARCHMAGE.class")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.class.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $props.actor.data.details.class.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.class.value]
      ])
    ]),
    createElementVNode("div", _hoisted_8$b, [
      createElementVNode("label", _hoisted_9$a, toDisplayString($setup.localize("ARCHMAGE.level")), 1),
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
var CharHeader = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$k]]);
const _sfc_main$j = {
  name: "Progress",
  props: ["current", "temp", "max", "name"],
  setup() {
    return {
      concat
    };
  },
  data() {
    return {};
  },
  computed: {
    realMax() {
      let temp = this.temp ? this.temp : 0;
      return Math.max(this.max, this.current + temp);
    }
  },
  methods: {
    getProgressClass(value, modifier = "current", value2 = 0) {
      let percent = this.getProgressPercent(Number(value) + value2, this.max, false);
      let level = "full";
      if (percent > 75) {
        level = "full";
      } else if (percent > 50) {
        level = "hurt";
      } else if (percent > 25) {
        level = "staggered";
      } else {
        level = "dire";
      }
      return `progress-${modifier} progress-${level}`;
    },
    getProgressPercent(value, value2, includeSign = true) {
      let percent = Math.ceil(100 * (value / Math.max(1, value2)));
      if (percent > 100)
        percent = 100;
      else if (percent < 0)
        percent = 0;
      return includeSign ? `${percent}%` : percent;
    }
  }
};
const _hoisted_1$i = /* @__PURE__ */ createElementVNode("div", { class: "progress-track" }, null, -1);
function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", {
    class: normalizeClass($setup.concat("progress-bar progress-bar--", $props.name))
  }, [
    _hoisted_1$i,
    createElementVNode("div", {
      class: normalizeClass($options.getProgressClass($props.current)),
      style: normalizeStyle({ width: $options.getProgressPercent($props.current, $options.realMax) })
    }, null, 6),
    $props.temp ? (openBlock(), createElementBlock("div", {
      key: 0,
      class: normalizeClass($options.getProgressClass($props.temp, "temp", $props.current)),
      style: normalizeStyle({ width: $options.getProgressPercent($props.temp, $options.realMax), left: $options.getProgressPercent($props.current, $options.realMax) })
    }, null, 6)) : createCommentVNode("", true)
  ], 2);
}
var Progress = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$j]]);
const _sfc_main$i = {
  name: "CharAttributes",
  props: ["actor"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data() {
    return {
      avatarClass: "avatar",
      avatarWidth: 105,
      avatarHeight: 105
    };
  },
  components: {
    Progress
  },
  computed: {},
  methods: {
    getAvatarDimensions() {
      let img = this.$refs["avatar"];
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      let ratio = width / height;
      let ratioClass = "square";
      let squareSize = width;
      if (ratio < 0.9) {
        ratioClass = "portrait";
        squareSize = width;
      } else if (ratio > 1.1) {
        ratioClass = "square";
        squareSize = height;
      }
      this.avatarWidth = ratioClass != "square" ? width : squareSize;
      this.avatarHeight = ratioClass != "square" ? height : squareSize;
      let classes = ["avatar", `avatar--${ratioClass}`];
      let flags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
      if (flags.portraitRound)
        classes.push("avatar--round");
      if (flags.portraitFrame)
        classes.push("avatar--frame");
      this.avatarClass = classes.join(" ");
    },
    checkLoaded() {
      if (this.$refs.avatar.complete) {
        this.getAvatarDimensions();
      } else {
        this.$refs.avatar.addEventListener("load", () => {
          this.getAvatarDimensions();
        });
      }
    }
  },
  watch: {
    "actor.img": {
      deep: false,
      handler() {
        this.$nextTick(() => {
          this.checkLoaded();
        });
      }
    },
    "actor.flags.archmage": {
      deep: true,
      handler() {
        this.getAvatarDimensions();
      }
    }
  },
  async mounted() {
    this.$nextTick(() => {
      this.checkLoaded();
    });
  }
};
const _hoisted_1$h = { class: "section section--attributes flexrow" };
const _hoisted_2$g = { class: "unit unit--img profile-img" };
const _hoisted_3$f = ["src", "alt", "width", "height"];
const _hoisted_4$e = { class: "unit unit--attributes grid grid-5col border-both" };
const _hoisted_5$d = { class: "unit unit--has-max unit--hp" };
const _hoisted_6$c = { class: "unit-title" };
const _hoisted_7$a = { class: "resource flexrow" };
const _hoisted_8$a = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_9$9 = {
  key: 0,
  class: "resource-max"
};
const _hoisted_10$9 = { class: "labeled-input flexrow" };
const _hoisted_11$8 = {
  for: "data.attributes.hp.temp",
  class: "unit-subtitle"
};
const _hoisted_12$7 = { class: "unit unit--defenses" };
const _hoisted_13$7 = { class: "unit-title" };
const _hoisted_14$7 = { class: "defenses grid grid-3col" };
const _hoisted_15$6 = { class: "defense defense--ac flexcol" };
const _hoisted_16$6 = { class: "defense-value" };
const _hoisted_17$6 = ["title"];
const _hoisted_18$5 = { class: "defense defense--pd flexcol" };
const _hoisted_19$5 = { class: "defense-value" };
const _hoisted_20$5 = ["title"];
const _hoisted_21$5 = { class: "defense defense--md flexcol" };
const _hoisted_22$5 = { class: "defense-value" };
const _hoisted_23$5 = ["title"];
const _hoisted_24$5 = { class: "unit unit--has-max unit--recoveries" };
const _hoisted_25$5 = { class: "unit-title" };
const _hoisted_26$5 = { class: "resource flexrow" };
const _hoisted_27$5 = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_28$4 = {
  key: 0,
  class: "resource-max"
};
const _hoisted_29$4 = { class: "roll" };
const _hoisted_30$4 = {
  class: "rollable rollable--recover",
  "data-roll-type": "recovery"
};
const _hoisted_31$4 = { class: "unit unit--saves flexcol" };
const _hoisted_32$4 = { class: "unit-title" };
const _hoisted_33$4 = { class: "saves flexcol" };
const _hoisted_34$4 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "easy"
};
const _hoisted_35$4 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "normal"
};
const _hoisted_36$3 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "hard"
};
const _hoisted_37$3 = { class: "unit unit--death" };
const _hoisted_38$3 = { class: "dividers flexcol" };
const _hoisted_39$3 = { class: "death-saves" };
const _hoisted_40$3 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "death"
};
const _hoisted_41$3 = { class: "death-save-attempts flexrow" };
const _hoisted_42$3 = { class: "last-gasp-saves" };
const _hoisted_43$3 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "lastGasp"
};
const _hoisted_44$3 = { class: "lastgasp-save-attempts flexrow" };
function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Progress = resolveComponent("Progress");
  return openBlock(), createElementBlock("section", _hoisted_1$h, [
    createElementVNode("div", _hoisted_2$g, [
      createElementVNode("img", {
        src: $props.actor.img,
        ref: "avatar",
        alt: $setup.localize("ARCHMAGE.avatarAlt"),
        width: $data.avatarWidth,
        height: $data.avatarHeight,
        class: normalizeClass($data.avatarClass),
        "data-edit": "img"
      }, null, 10, _hoisted_3$f)
    ]),
    createElementVNode("div", _hoisted_4$e, [
      createElementVNode("div", _hoisted_5$d, [
        createElementVNode("h2", _hoisted_6$c, toDisplayString($setup.localize("ARCHMAGE.hitPoints")), 1),
        createVNode(_component_Progress, {
          name: "hp",
          current: $props.actor.data.attributes.hp.value,
          temp: $props.actor.data.attributes.hp.temp,
          max: $props.actor.data.attributes.hp.max
        }, null, 8, ["current", "temp", "max"]),
        createElementVNode("div", _hoisted_7$a, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.hp.value",
            class: "resource-current",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.data.attributes.hp.value = $event)
          }, null, 512), [
            [vModelText, $props.actor.data.attributes.hp.value]
          ]),
          _hoisted_8$a,
          $props.actor.data.attributes.hp.automatic ? (openBlock(), createElementBlock("div", _hoisted_9$9, toDisplayString($props.actor.data.attributes.hp.max), 1)) : withDirectives((openBlock(), createElementBlock("input", {
            key: 1,
            type: "number",
            name: "data.attributes.hp.max",
            class: "resource-max",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.attributes.hp.max = $event)
          }, null, 512)), [
            [vModelText, $props.actor.data.attributes.hp.max]
          ])
        ]),
        createElementVNode("div", _hoisted_10$9, [
          createElementVNode("label", _hoisted_11$8, toDisplayString($setup.localize("ARCHMAGE.tempHp")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.hp.temp",
            class: "temp-hp",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $props.actor.data.attributes.hp.temp = $event)
          }, null, 512), [
            [vModelText, $props.actor.data.attributes.hp.temp]
          ])
        ])
      ]),
      createElementVNode("div", _hoisted_12$7, [
        createElementVNode("h2", _hoisted_13$7, toDisplayString($setup.localize("ARCHMAGE.defenses")), 1),
        createElementVNode("div", _hoisted_14$7, [
          createElementVNode("div", _hoisted_15$6, [
            createElementVNode("span", _hoisted_16$6, toDisplayString($props.actor.data.attributes.ac.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.ac.label"), " (", $setup.localize("ARCHMAGE.ac.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.ac.key")), 9, _hoisted_17$6)
          ]),
          createElementVNode("div", _hoisted_18$5, [
            createElementVNode("span", _hoisted_19$5, toDisplayString($props.actor.data.attributes.pd.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.pd.label"), " (", $setup.localize("ARCHMAGE.pd.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.pd.key")), 9, _hoisted_20$5)
          ]),
          createElementVNode("div", _hoisted_21$5, [
            createElementVNode("span", _hoisted_22$5, toDisplayString($props.actor.data.attributes.md.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.md.label"), " (", $setup.localize("ARCHMAGE.md.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.md.key")), 9, _hoisted_23$5)
          ])
        ])
      ]),
      createElementVNode("div", _hoisted_24$5, [
        createElementVNode("h2", _hoisted_25$5, toDisplayString($setup.localize("ARCHMAGE.recoveries")), 1),
        createVNode(_component_Progress, {
          name: "recoveries",
          current: $props.actor.data.attributes.recoveries.value,
          max: $props.actor.data.attributes.recoveries.max
        }, null, 8, ["current", "max"]),
        createElementVNode("div", _hoisted_26$5, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.recoveries.value",
            class: "resource-current",
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $props.actor.data.attributes.recoveries.value = $event)
          }, null, 512), [
            [vModelText, $props.actor.data.attributes.recoveries.value]
          ]),
          _hoisted_27$5,
          $props.actor.data.attributes.recoveries.automatic ? (openBlock(), createElementBlock("div", _hoisted_28$4, toDisplayString($props.actor.data.attributes.recoveries.max), 1)) : withDirectives((openBlock(), createElementBlock("input", {
            key: 1,
            type: "number",
            name: "data.attributes.recoveries.max",
            class: "resource-max",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $props.actor.data.attributes.recoveries.max = $event)
          }, null, 512)), [
            [vModelText, $props.actor.data.attributes.recoveries.max]
          ])
        ]),
        createElementVNode("div", _hoisted_29$4, [
          createElementVNode("a", _hoisted_30$4, toDisplayString($props.actor.data.attributes.level.value) + toDisplayString($props.actor.data.attributes.recoveries.dice) + "+" + toDisplayString($props.actor.data.abilities.con.dmg) + " (" + toDisplayString($props.actor.data.attributes.recoveries.avg) + ")", 1)
        ])
      ]),
      createElementVNode("div", _hoisted_31$4, [
        createElementVNode("h2", _hoisted_32$4, toDisplayString($setup.localize("ARCHMAGE.saves")), 1),
        createElementVNode("div", _hoisted_33$4, [
          createElementVNode("a", _hoisted_34$4, "6+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.easyShort")) + ")", 1),
          createElementVNode("a", _hoisted_35$4, "11+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.normalShort")) + ")", 1),
          createElementVNode("a", _hoisted_36$3, "16+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.hardShort")) + ")", 1)
        ])
      ]),
      createElementVNode("div", _hoisted_37$3, [
        createElementVNode("div", _hoisted_38$3, [
          createElementVNode("div", _hoisted_39$3, [
            createElementVNode("a", _hoisted_40$3, toDisplayString($setup.localize("ARCHMAGE.SAVE.death")), 1),
            createElementVNode("div", _hoisted_41$3, [
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $props.actor.data.attributes.saves.deathFails.steps[0] = $event),
                "data-opt": "1"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.deathFails.steps[0]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $props.actor.data.attributes.saves.deathFails.steps[1] = $event),
                "data-opt": "2"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.deathFails.steps[1]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $props.actor.data.attributes.saves.deathFails.steps[2] = $event),
                "data-opt": "3"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.deathFails.steps[2]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $props.actor.data.attributes.saves.deathFails.steps[3] = $event),
                "data-opt": "4"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.deathFails.steps[3]]
              ])
            ])
          ]),
          createElementVNode("div", _hoisted_42$3, [
            createElementVNode("a", _hoisted_43$3, toDisplayString($setup.localize("ARCHMAGE.SAVE.lastGasp")), 1),
            createElementVNode("div", _hoisted_44$3, [
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $props.actor.data.attributes.saves.lastGaspFails.steps[0] = $event),
                "data-opt": "1"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.lastGaspFails.steps[0]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $props.actor.data.attributes.saves.lastGaspFails.steps[1] = $event),
                "data-opt": "2"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.lastGaspFails.steps[1]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $props.actor.data.attributes.saves.lastGaspFails.steps[2] = $event),
                "data-opt": "3"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.lastGaspFails.steps[2]]
              ]),
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $props.actor.data.attributes.saves.lastGaspFails.steps[3] = $event),
                "data-opt": "4"
              }, null, 512), [
                [vModelCheckbox, $props.actor.data.attributes.saves.lastGaspFails.steps[3]]
              ])
            ])
          ])
        ])
      ])
    ])
  ]);
}
var CharAttributes = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$i]]);
const _sfc_main$h = {
  name: "CharAbilities",
  props: ["actor"],
  setup() {
    return {
      numberFormat,
      localize,
      concat
    };
  },
  data() {
    return {};
  },
  computed: {},
  methods: {
    modColor(abil) {
      if (abil.mod && abil.nonKey.mod) {
        if (abil.mod < abil.nonKey.mod) {
          console.log(abil.label);
          return "#E01616";
        }
      }
      return "inherit";
    },
    modTitle(abil, actor) {
      if (abil.mod && abil.nonKey.mod) {
        if (abil.mod < abil.nonKey.mod) {
          return game.i18n.format("ARCHMAGE.keyReduced", {
            mod: numberFormat(abil.mod, 0, true),
            kmod1: actor.data.attributes.keyModifier.mod1,
            kmod2: actor.data.attributes.keyModifier.mod2
          });
        }
      }
      return "";
    }
  },
  watch: {},
  async mounted() {
  }
};
const _hoisted_1$g = { class: "section section--abilities flexcol" };
const _hoisted_2$f = { class: "list-item-header grid grid-4col" };
const _hoisted_3$e = { class: "unit-title grid-span-2" };
const _hoisted_4$d = { class: "ability-mod-label grid-start-3" };
const _hoisted_5$c = { class: "ability-lvl-label grid-start-4" };
const _hoisted_6$b = { class: "list list--abilities abilities" };
const _hoisted_7$9 = ["data-key"];
const _hoisted_8$9 = ["name", "onUpdate:modelValue"];
const _hoisted_9$8 = ["data-roll-opt"];
const _hoisted_10$8 = ["title"];
function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$g, [
    createElementVNode("div", _hoisted_2$f, [
      createElementVNode("h2", _hoisted_3$e, toDisplayString($setup.localize("ARCHMAGE.abilities")), 1),
      createElementVNode("div", _hoisted_4$d, toDisplayString($setup.localize("ARCHMAGE.mod")), 1),
      createElementVNode("div", _hoisted_5$c, toDisplayString($setup.localize("ARCHMAGE.lvl")), 1)
    ]),
    createElementVNode("ul", _hoisted_6$b, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($props.actor.data.abilities, (item, index) => {
        return openBlock(), createElementBlock("li", {
          key: $setup.concat("data.abilities.", index, ".value"),
          class: "list-item list-item--abilities ability grid grid-4col",
          "data-key": index
        }, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: $setup.concat("data.abilities.", index, ".value"),
            class: "ability-score",
            "onUpdate:modelValue": ($event) => item.value = $event
          }, null, 8, _hoisted_8$9), [
            [vModelText, item.value]
          ]),
          createElementVNode("a", {
            class: "ability-name rollable rollable--ability",
            "data-roll-type": "ability",
            "data-roll-opt": index
          }, toDisplayString($setup.localize($setup.concat("ARCHMAGE.", index, ".label"))), 9, _hoisted_9$8),
          createElementVNode("div", {
            class: "ability-mod",
            style: normalizeStyle($setup.concat("color:", $options.modColor(item))),
            title: $options.modTitle(item, $props.actor)
          }, toDisplayString($setup.numberFormat(item.nonKey.mod, 0, true)), 13, _hoisted_10$8),
          createElementVNode("div", {
            class: "ability-lvl",
            style: normalizeStyle($setup.concat("color:", $options.modColor(item)))
          }, toDisplayString($setup.numberFormat(item.nonKey.lvlmod, 0, true)), 5)
        ], 8, _hoisted_7$9);
      }), 128))
    ])
  ]);
}
var CharAbilities = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$h]]);
const _sfc_main$g = {
  name: "CharBackgrounds",
  props: ["actor"],
  setup() {
    return {
      localize,
      concat
    };
  },
  data() {
    return {};
  },
  computed: {
    backgrounds() {
      let filteredBackgrounds = {};
      for (let [k, v] of Object.entries(this.actor.data.backgrounds)) {
        if (v.isActive.value === true)
          filteredBackgrounds[k] = v;
      }
      return filteredBackgrounds;
    }
  },
  methods: {},
  async mounted() {
  }
};
const _hoisted_1$f = { class: "section section--backgrounds flexcol" };
const _hoisted_2$e = { class: "unit-title" };
const _hoisted_3$d = { class: "list list--backgrounds backgrounds" };
const _hoisted_4$c = ["data-key"];
const _hoisted_5$b = ["data-roll-opt"];
const _hoisted_6$a = /* @__PURE__ */ createElementVNode("span", { class: "background-sign" }, "+", -1);
const _hoisted_7$8 = ["name", "onUpdate:modelValue"];
const _hoisted_8$8 = ["name", "onUpdate:modelValue"];
function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$f, [
    createElementVNode("h2", _hoisted_2$e, toDisplayString($setup.localize("ARCHMAGE.backgrounds")), 1),
    createElementVNode("ul", _hoisted_3$d, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.backgrounds, (item, index) => {
        return openBlock(), createElementBlock("li", {
          key: $setup.concat("data.backgrounds.", index),
          class: "list-item list-item--backgrounds background flexrow",
          "data-key": index
        }, [
          createElementVNode("span", {
            class: "rollable rollable--background flexshrink",
            "data-roll-type": "background",
            "data-roll-opt": item.name.value
          }, null, 8, _hoisted_5$b),
          _hoisted_6$a,
          withDirectives(createElementVNode("input", {
            type: "number",
            name: $setup.concat("data.backgrounds.", index, ".bonus.value"),
            class: "background-bonus",
            "onUpdate:modelValue": ($event) => item.bonus.value = $event
          }, null, 8, _hoisted_7$8), [
            [vModelText, item.bonus.value]
          ]),
          withDirectives(createElementVNode("input", {
            type: "text",
            name: $setup.concat("data.backgrounds.", index, ".name.value"),
            class: "background-name",
            "onUpdate:modelValue": ($event) => item.name.value = $event
          }, null, 8, _hoisted_8$8), [
            [vModelText, item.name.value]
          ])
        ], 8, _hoisted_4$c);
      }), 128))
    ])
  ]);
}
var CharBackgrounds = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$g]]);
const _sfc_main$f = {
  name: "CharIniative",
  props: ["actor"],
  setup() {
    return {
      numberFormat,
      localize
    };
  },
  data() {
    return {};
  },
  computed: {},
  methods: {},
  watch: {},
  async mounted() {
  }
};
const _hoisted_1$e = { class: "section section--initiative flexcol" };
const _hoisted_2$d = {
  class: "rollable rollable--init",
  "data-roll-type": "init"
};
function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$e, [
    createElementVNode("a", _hoisted_2$d, toDisplayString($setup.numberFormat($props.actor.data.attributes.init.mod, 0, true)) + " " + toDisplayString($setup.localize("ARCHMAGE.initiative")), 1)
  ]);
}
var CharInitiative = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f]]);
const _sfc_main$e = {
  name: "CharIconRelationships",
  props: ["actor"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data: () => ({
    editArray: [],
    changeKey: 0
  }),
  computed: {
    icons() {
      let filteredIcons = {};
      for (let [k, v] of Object.entries(this.actor.data.icons)) {
        if (v.isActive.value === true)
          filteredIcons[k] = v;
      }
      return filteredIcons;
    },
    relationshipTypes() {
      return [
        { label: game.i18n.localize("ARCHMAGE.positive"), code: "Positive" },
        { label: game.i18n.localize("ARCHMAGE.negative"), code: "Negative" },
        { label: game.i18n.localize("ARCHMAGE.conflicted"), code: "Conflicted" }
      ];
    }
  },
  methods: {
    iconSymbol(iconKey) {
      let symbols = {
        "Positive": "+",
        "Negative": "-",
        "Conflicted": "~"
      };
      return symbols[iconKey];
    },
    toggleEdit(event) {
      let $target = $(event.currentTarget);
      let $parent = $target.parents(".list-item--icons");
      let $display = $parent.find(".icon-display");
      let $edit = $parent.find(".icon-edit");
      $display.toggleClass("hide");
      $edit.toggleClass("hide");
      let index = parseInt($parent.attr("data-key"));
      this.editArray[index] = $display.hasClass("hide");
    },
    isEdit(index, type) {
      if (this.editArray.length < 1) {
        return type === true ? " hide " : "";
      } else {
        return this.editArray[index] === type ? " hide " : "";
      }
    },
    getRollResult(roll) {
      return roll == 5 || roll == 6 ? roll : 0;
    }
  },
  watch: {},
  async mounted() {
  }
};
const _hoisted_1$d = { class: "section section--icons flexcol" };
const _hoisted_2$c = { class: "unit-title" };
const _hoisted_3$c = { class: "list list--icons icons" };
const _hoisted_4$b = ["data-key"];
const _hoisted_5$a = ["data-roll-opt"];
const _hoisted_6$9 = { class: "icon-symbol flexshrink" };
const _hoisted_7$7 = { class: "icon-name" };
const _hoisted_8$7 = ["data-key", "data-roll-key", "data-roll"];
const _hoisted_9$7 = ["name", "onUpdate:modelValue"];
const _hoisted_10$7 = { value: "Positive" };
const _hoisted_11$7 = { value: "Negative" };
const _hoisted_12$6 = { value: "Conflicted" };
const _hoisted_13$6 = ["name", "onUpdate:modelValue"];
const _hoisted_14$6 = ["name", "onUpdate:modelValue"];
function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$d, [
    createElementVNode("h2", _hoisted_2$c, toDisplayString($setup.localize("ARCHMAGE.iconRelationships")), 1),
    createElementVNode("ul", _hoisted_3$c, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.icons, (item, index) => {
        return openBlock(), createElementBlock("li", {
          key: $setup.concat("data.icons.", index),
          class: "list-item list-item--icons icon flexrow",
          "data-key": index
        }, [
          createElementVNode("div", {
            class: normalizeClass($setup.concat("icon-display flexrow", $options.isEdit(index, _ctx.editArray[index])))
          }, [
            createElementVNode("div", {
              class: "rollable rollable--icon",
              "data-roll-type": "icon",
              "data-roll-opt": index
            }, [
              createElementVNode("span", _hoisted_6$9, toDisplayString($options.iconSymbol(item.relationship.value)), 1),
              createElementVNode("span", _hoisted_7$7, toDisplayString(item.bonus.value) + " " + toDisplayString(item.name.value), 1)
            ], 8, _hoisted_5$a),
            item.results ? (openBlock(), createElementBlock("ul", {
              class: "icon-rolls flexrow",
              key: _ctx.changeKey
            }, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(item.results, (roll, rollIndex) => {
                return openBlock(), createElementBlock("li", {
                  key: rollIndex,
                  class: "icon-roll",
                  "data-key": index,
                  "data-roll-key": rollIndex,
                  "data-roll": $options.getRollResult(roll)
                }, toDisplayString($options.getRollResult(roll)), 9, _hoisted_8$7);
              }), 128))
            ])) : createCommentVNode("", true)
          ], 2),
          createElementVNode("div", {
            class: normalizeClass($setup.concat("icon-edit flexrow", $options.isEdit(index, !_ctx.editArray[index])))
          }, [
            withDirectives(createElementVNode("select", {
              class: "relationship-edit",
              name: $setup.concat("data.icons.", index, ".relationship.value"),
              "onUpdate:modelValue": ($event) => item.relationship.value = $event
            }, [
              createElementVNode("option", _hoisted_10$7, toDisplayString($setup.localize("ARCHMAGE.positive")), 1),
              createElementVNode("option", _hoisted_11$7, toDisplayString($setup.localize("ARCHMAGE.negative")), 1),
              createElementVNode("option", _hoisted_12$6, toDisplayString($setup.localize("ARCHMAGE.conflicted")), 1)
            ], 8, _hoisted_9$7), [
              [vModelSelect, item.relationship.value]
            ]),
            withDirectives(createElementVNode("input", {
              type: "number",
              name: $setup.concat("data.icons.", index, ".bonus.value"),
              class: "icon-bonus-edit",
              "onUpdate:modelValue": ($event) => item.bonus.value = $event
            }, null, 8, _hoisted_13$6), [
              [vModelText, item.bonus.value]
            ]),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: $setup.concat("data.icons.", index, ".name.value"),
              class: "icon-name-edit",
              "onUpdate:modelValue": ($event) => item.name.value = $event
            }, null, 8, _hoisted_14$6), [
              [vModelText, item.name.value]
            ])
          ], 2),
          createElementVNode("span", {
            class: "icon-edit-toggle fas fa-edit",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.toggleEdit && $options.toggleEdit(...args))
          })
        ], 8, _hoisted_4$b);
      }), 128))
    ])
  ]);
}
var CharIconRelationships = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e]]);
var Editor_vue_vue_type_style_index_0_scoped_true_lang = /* @__PURE__ */ (() => ".sheet .editor-wrapper[data-v-576be6d7],.sheet .editor[data-v-576be6d7],.sheet .editor-content[data-v-576be6d7]{height:100%}\n")();
const _sfc_main$d = {
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
const _hoisted_1$c = { class: "editor-wrapper" };
const _hoisted_2$b = { class: "editor" };
const _hoisted_3$b = ["data-edit", "innerHTML"];
const _hoisted_4$a = {
  key: 0,
  class: "editor-edit"
};
const _hoisted_5$9 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1));
const _hoisted_6$8 = [
  _hoisted_5$9
];
function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$c, [
    createElementVNode("div", _hoisted_2$b, [
      createElementVNode("div", {
        class: "editor-content",
        "data-edit": $props.target,
        innerHTML: $options.enrichHTML()
      }, null, 8, _hoisted_3$b),
      $data.canEdit ? (openBlock(), createElementBlock("a", _hoisted_4$a, _hoisted_6$8)) : createCommentVNode("", true)
    ])
  ]);
}
var Editor = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-576be6d7"]]);
const _sfc_main$c = {
  name: "CharOut",
  props: ["actor", "owner"],
  setup() {
    return { localize };
  },
  data() {
    return {};
  },
  components: {
    Editor
  },
  computed: {},
  methods: {},
  async mounted() {
  }
};
const _hoisted_1$b = { class: "section section--out flexcol" };
const _hoisted_2$a = { class: "unit-title" };
const _hoisted_3$a = { class: "out" };
function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Editor = resolveComponent("Editor");
  return openBlock(), createElementBlock("section", _hoisted_1$b, [
    createElementVNode("h2", _hoisted_2$a, toDisplayString($setup.localize("ARCHMAGE.oneUniqueThing")), 1),
    createElementVNode("div", _hoisted_3$a, [
      createVNode(_component_Editor, {
        owner: $props.owner,
        target: "data.details.out.value",
        button: "true",
        editable: "true",
        content: $props.actor.data.details.out.value
      }, null, 8, ["owner", "content"])
    ])
  ]);
}
var CharOut = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c]]);
const _sfc_main$b = {
  name: "CharIncrementals",
  props: ["actor"],
  setup() {
    return {
      localize,
      concat
    };
  },
  data() {
    return {};
  },
  computed: {},
  methods: {
    getOrderedIncrementals(actor) {
      let incrementalKeys = ["abilityScoreBonus", "skills", "extraMagicItem", "feat", "talent", "hp", "iconRelationshipPoint", "powerSpell1", "powerSpell2", "powerSpell3", "powerSpell4"];
      let newIncrementalArray = {};
      incrementalKeys.forEach((e) => newIncrementalArray[e] = actor.data.incrementals[e]);
      return newIncrementalArray;
    }
  },
  async mounted() {
  }
};
const _hoisted_1$a = { class: "section section--incrementals flexcol" };
const _hoisted_2$9 = { class: "unit-title" };
const _hoisted_3$9 = { class: "list list--incrementals incrementals" };
const _hoisted_4$9 = ["data-key"];
const _hoisted_5$8 = ["for", "title"];
const _hoisted_6$7 = ["name", "onUpdate:modelValue"];
function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$a, [
    createElementVNode("h2", _hoisted_2$9, toDisplayString($setup.localize("ARCHMAGE.incrementalAdvances")), 1),
    createElementVNode("ul", _hoisted_3$9, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.getOrderedIncrementals($props.actor), (item, index) => {
        return openBlock(), createElementBlock("li", {
          key: index,
          class: "list-item list-item--incrementals incremental",
          "data-key": index
        }, [
          createElementVNode("label", {
            for: $setup.concat("data.incrementals.", index),
            title: $setup.localize($setup.concat("ARCHMAGE.INCREMENTALS.", index, "Hint"))
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.incrementals.", index),
              "onUpdate:modelValue": ($event) => $props.actor.data.incrementals[index] = $event
            }, null, 8, _hoisted_6$7), [
              [vModelCheckbox, $props.actor.data.incrementals[index]]
            ]),
            createTextVNode(" " + toDisplayString($setup.localize($setup.concat("ARCHMAGE.INCREMENTALS.", index, "Name"))), 1)
          ], 8, _hoisted_5$8)
        ], 8, _hoisted_4$9);
      }), 128))
    ])
  ]);
}
var CharIncrementals = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b]]);
const _sfc_main$a = {
  name: "CharResources",
  props: ["actor"],
  setup() {
    return {
      concat,
      localize
    };
  },
  components: {
    Progress
  },
  data() {
    return {
      commandPoints: 0,
      momentum: false,
      focus: false,
      ki: {
        value: 0,
        max: 0
      },
      disengage: {
        value: 11,
        bonus: 0
      }
    };
  },
  computed: {
    customResources() {
      let resources = {};
      for (let [k, v] of Object.entries(this.actor.data.resources.spendable)) {
        if (k.includes("custom") && v.enabled)
          resources[k] = v;
      }
      return resources;
    },
    resourceCount() {
      let count = 0;
      if (this.actor.data.resources.perCombat.commandPoints.enabled)
        count++;
      if (this.actor.data.resources.spendable.ki.enabled)
        count++;
      if (this.actor.data.resources.perCombat.focus.enabled)
        count++;
      if (this.actor.data.resources.perCombat.momentum.enabled)
        count++;
      return count;
    },
    customResourceCount() {
      let arr = Object.keys(this.customResources);
      return arr && arr.length ? arr.length : 0;
    }
  },
  methods: {
    updateResourceProps() {
      this.commandPoints = this.actor.data.resources.perCombat.commandPoints.current;
      this.momentum = this.actor.data.resources.perCombat.momentum.current;
      this.focus = this.actor.data.resources.perCombat.focus.current;
      this.ki = this.actor.data.resources.spendable.ki;
      this.disengage = {
        value: this.actor.data.attributes.disengage,
        bonus: this.actor.data.attributes.disengageBonus
      };
    }
  },
  watch: {
    "actor.data.resources": {
      deep: true,
      handler() {
        this.updateResourceProps();
      }
    },
    "actor.data.attributes": {
      deep: true,
      handler() {
        this.updateResourceProps();
      }
    }
  },
  async mounted() {
    this.updateResourceProps();
  }
};
const _hoisted_1$9 = ["data-resource-count", "data-custom-count"];
const _hoisted_2$8 = {
  key: 0,
  class: "unit unit--command-points"
};
const _hoisted_3$8 = { class: "unit-title" };
const _hoisted_4$8 = { class: "resource flexrow" };
const _hoisted_5$7 = { class: "resource--left" };
const _hoisted_6$6 = /* @__PURE__ */ createElementVNode("div", { class: "resource--right flexcol" }, [
  /* @__PURE__ */ createElementVNode("a", {
    class: "rollable rollable--command rollable--command-4",
    "data-roll-type": "command",
    "data-roll-opt": "d4"
  }, "d4"),
  /* @__PURE__ */ createElementVNode("a", {
    class: "rollable rollable--command rollable--command-3",
    "data-roll-type": "command",
    "data-roll-opt": "d3"
  }, "d3")
], -1);
const _hoisted_7$6 = {
  key: 1,
  class: "unit unit--has-max unit--ki"
};
const _hoisted_8$6 = { class: "unit-title" };
const _hoisted_9$6 = { class: "resource flexrow" };
const _hoisted_10$6 = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_11$6 = {
  key: 2,
  class: "unit unit--focus"
};
const _hoisted_12$5 = { class: "unit-title" };
const _hoisted_13$5 = { class: "resource flexrow" };
const _hoisted_14$5 = {
  key: 3,
  class: "unit unit--momentum"
};
const _hoisted_15$5 = { class: "unit-title" };
const _hoisted_16$5 = { class: "resource flexrow" };
const _hoisted_17$5 = { class: "unit unit--disengage" };
const _hoisted_18$4 = { class: "unit-title" };
const _hoisted_19$4 = { class: "resource flexcol" };
const _hoisted_20$4 = {
  class: "rollable rollable--disengage disengage-value",
  "data-roll-type": "save",
  "data-roll-opt": "disengage"
};
const _hoisted_21$4 = { class: "disengage-bonus flexrow" };
const _hoisted_22$4 = { class: "disengage-label" };
const _hoisted_23$4 = { class: "unit unit--rest" };
const _hoisted_24$4 = { class: "unit-title" };
const _hoisted_25$4 = { class: "resource flexcol" };
const _hoisted_26$4 = {
  type: "button",
  class: "rest rest--quick",
  "data-rest-type": "quick"
};
const _hoisted_27$4 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-campground" }, null, -1);
const _hoisted_28$3 = {
  type: "button",
  class: "rest rest--full",
  "data-rest-type": "full"
};
const _hoisted_29$3 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-bed" }, null, -1);
const _hoisted_30$3 = {
  key: 4,
  class: "resource-divider"
};
const _hoisted_31$3 = ["name", "onUpdate:modelValue"];
const _hoisted_32$3 = { class: "resource flexrow" };
const _hoisted_33$3 = ["name", "onUpdate:modelValue"];
const _hoisted_34$3 = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_35$3 = ["name", "onUpdate:modelValue"];
function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Progress = resolveComponent("Progress");
  return openBlock(), createElementBlock("section", {
    class: "section section--resources flexrow flexshrink",
    "data-resource-count": $options.resourceCount,
    "data-custom-count": $options.customResourceCount
  }, [
    $props.actor.data.resources.perCombat.commandPoints.enabled ? (openBlock(), createElementBlock("section", _hoisted_2$8, [
      createElementVNode("h2", _hoisted_3$8, toDisplayString($setup.localize("ARCHMAGE.CHARACTER.RESOURCES.commandPoints")), 1),
      createElementVNode("div", _hoisted_4$8, [
        createElementVNode("div", _hoisted_5$7, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.resources.perCombat.commandPoints.current",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.commandPoints = $event)
          }, null, 512), [
            [vModelText, $data.commandPoints]
          ])
        ]),
        _hoisted_6$6
      ])
    ])) : createCommentVNode("", true),
    $props.actor.data.resources.spendable.ki.enabled ? (openBlock(), createElementBlock("section", _hoisted_7$6, [
      createElementVNode("h2", _hoisted_8$6, toDisplayString($setup.localize("ARCHMAGE.CHARACTER.RESOURCES.ki")), 1),
      createVNode(_component_Progress, {
        name: "ki",
        current: $props.actor.data.resources.spendable.ki.current,
        max: $props.actor.data.resources.spendable.ki.max
      }, null, 8, ["current", "max"]),
      createElementVNode("div", _hoisted_9$6, [
        withDirectives(createElementVNode("input", {
          type: "number",
          name: "data.resources.spendable.ki.current",
          class: "resource-current",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.ki.current = $event)
        }, null, 512), [
          [vModelText, $data.ki.current]
        ]),
        _hoisted_10$6,
        withDirectives(createElementVNode("input", {
          type: "number",
          name: "data.resources.spendable.ki.max",
          class: "resource-max",
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.ki.max = $event)
        }, null, 512), [
          [vModelText, $data.ki.max]
        ])
      ])
    ])) : createCommentVNode("", true),
    $props.actor.data.resources.perCombat.focus.enabled ? (openBlock(), createElementBlock("section", _hoisted_11$6, [
      createElementVNode("h2", _hoisted_12$5, toDisplayString($setup.localize("ARCHMAGE.CHARACTER.RESOURCES.focus")), 1),
      createElementVNode("div", _hoisted_13$5, [
        withDirectives(createElementVNode("input", {
          type: "checkbox",
          name: "data.resources.perCombat.focus.current",
          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.focus = $event)
        }, null, 512), [
          [vModelCheckbox, $data.focus]
        ])
      ])
    ])) : createCommentVNode("", true),
    $props.actor.data.resources.perCombat.momentum.enabled ? (openBlock(), createElementBlock("section", _hoisted_14$5, [
      createElementVNode("h2", _hoisted_15$5, toDisplayString($setup.localize("ARCHMAGE.CHARACTER.RESOURCES.momentum")), 1),
      createElementVNode("div", _hoisted_16$5, [
        withDirectives(createElementVNode("input", {
          type: "checkbox",
          name: "data.resources.perCombat.momentum.current",
          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.momentum = $event)
        }, null, 512), [
          [vModelCheckbox, $data.momentum]
        ])
      ])
    ])) : createCommentVNode("", true),
    createElementVNode("section", _hoisted_17$5, [
      createElementVNode("h2", _hoisted_18$4, toDisplayString($setup.localize("ARCHMAGE.SAVE.disengage")), 1),
      createElementVNode("div", _hoisted_19$4, [
        createElementVNode("a", _hoisted_20$4, toDisplayString($data.disengage.value) + "+", 1),
        createElementVNode("div", _hoisted_21$4, [
          createElementVNode("span", _hoisted_22$4, toDisplayString($setup.localize("ARCHMAGE.bonus")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.disengageBonus",
            class: "disengage-bonus",
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.disengage.bonus = $event)
          }, null, 512), [
            [vModelText, $data.disengage.bonus]
          ])
        ])
      ])
    ]),
    createElementVNode("section", _hoisted_23$4, [
      createElementVNode("h2", _hoisted_24$4, toDisplayString($setup.localize("ARCHMAGE.CHAT.Rests")), 1),
      createElementVNode("div", _hoisted_25$4, [
        createElementVNode("button", _hoisted_26$4, [
          _hoisted_27$4,
          createTextVNode(" " + toDisplayString($setup.localize("ARCHMAGE.CHAT.QuickRest")), 1)
        ]),
        createElementVNode("button", _hoisted_28$3, [
          _hoisted_29$3,
          createTextVNode(" " + toDisplayString($setup.localize("ARCHMAGE.CHAT.FullHeal")), 1)
        ])
      ])
    ]),
    $options.resourceCount > 1 && $options.customResourceCount > 0 || $options.customResourceCount > 1 ? (openBlock(), createElementBlock("div", _hoisted_30$3)) : createCommentVNode("", true),
    (openBlock(true), createElementBlock(Fragment, null, renderList($options.customResources, (resource, index) => {
      return openBlock(), createElementBlock("section", {
        key: index,
        class: "unit unit--custom"
      }, [
        withDirectives(createElementVNode("input", {
          type: "text",
          name: $setup.concat("data.resources.spendable.", index, ".label"),
          class: "resource-title-input",
          "onUpdate:modelValue": ($event) => resource.label = $event
        }, null, 8, _hoisted_31$3), [
          [vModelText, resource.label]
        ]),
        createVNode(_component_Progress, {
          name: index,
          current: resource.current,
          max: resource.max
        }, null, 8, ["name", "current", "max"]),
        createElementVNode("div", _hoisted_32$3, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: $setup.concat("data.resources.spendable.", index, ".current"),
            class: "resource-current",
            "onUpdate:modelValue": ($event) => resource.current = $event
          }, null, 8, _hoisted_33$3), [
            [vModelText, resource.current]
          ]),
          _hoisted_34$3,
          withDirectives(createElementVNode("input", {
            type: "number",
            name: $setup.concat("data.resources.spendable.", index, ".max"),
            class: "resource-max",
            "onUpdate:modelValue": ($event) => resource.max = $event
          }, null, 8, _hoisted_35$3), [
            [vModelText, resource.max]
          ])
        ])
      ]);
    }), 128))
  ], 8, _hoisted_1$9);
}
var CharResources = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a]]);
const _sfc_main$9 = {
  props: ["actor", "owner", "tab", "flags"],
  data() {
    return {};
  },
  components: {
    Editor
  },
  computed: {
    classes() {
      return `section section--details flexcol`;
    }
  },
  methods: {},
  async mounted() {
  }
};
function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Editor = resolveComponent("Editor");
  return openBlock(), createElementBlock("section", {
    class: normalizeClass($options.classes)
  }, [
    createVNode(_component_Editor, {
      owner: $props.owner,
      target: "data.details.biography.value",
      button: "true",
      editable: "true",
      content: $props.actor.data.details.biography.value
    }, null, 8, ["owner", "content"])
  ], 2);
}
var CharDetails = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9]]);
const _sfc_main$8 = {
  name: "Power",
  props: ["power"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data() {
    return {};
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
    powerDetailFields() {
      let powerFields = [
        "trigger",
        "sustainOn",
        "target",
        "always",
        "attack",
        "hit",
        "hitEven",
        "hitOdd",
        "crit",
        "miss",
        "missEven",
        "missOdd",
        "cost",
        "castBroadEffect",
        "castPower",
        "sustainedEffect",
        "finalVerse",
        "special",
        "effect",
        "spellLevel3",
        "spellLevel5",
        "spellLevel7",
        "spellLevel9",
        "spellChain",
        "breathWeapon",
        "recharge"
      ];
      powerFields = powerFields.filter((p) => this.power.data[p].value);
      return powerFields;
    }
  },
  methods: {
    filterFeats(featObj) {
      let res = {};
      for (let [tier, feat] of Object.entries(featObj)) {
        if (feat.description.value)
          res[tier] = feat;
      }
      return res;
    }
  },
  async mounted() {
  }
};
const _hoisted_1$8 = { class: "power" };
const _hoisted_2$7 = { class: "power-header flexcol" };
const _hoisted_3$7 = { key: 0 };
const _hoisted_4$7 = { key: 1 };
const _hoisted_5$6 = { class: "power-subheader flexrow" };
const _hoisted_6$5 = { key: 0 };
const _hoisted_7$5 = { key: 1 };
const _hoisted_8$5 = { key: 2 };
const _hoisted_9$5 = { class: "power-details flexcol" };
const _hoisted_10$5 = {
  key: 0,
  class: "power-detail power-detail--description"
};
const _hoisted_11$5 = ["innerHTML"];
const _hoisted_12$4 = { class: "power-detail-label" };
const _hoisted_13$4 = /* @__PURE__ */ createTextVNode();
const _hoisted_14$4 = ["innerHTML"];
const _hoisted_15$4 = { class: "power-feats flexcol" };
const _hoisted_16$4 = { class: "power-detail-label" };
const _hoisted_17$4 = ["innerHTML"];
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$8, [
    createElementVNode("header", _hoisted_2$7, [
      $props.power.data.group.value ? (openBlock(), createElementBlock("strong", _hoisted_3$7, toDisplayString($props.power.data.group.value), 1)) : createCommentVNode("", true),
      $props.power.data.range.value ? (openBlock(), createElementBlock("em", _hoisted_4$7, toDisplayString($props.power.data.range.value), 1)) : createCommentVNode("", true),
      createElementVNode("div", _hoisted_5$6, [
        $props.power.data.actionType.value ? (openBlock(), createElementBlock("strong", _hoisted_6$5, toDisplayString($setup.localize($setup.concat("ARCHMAGE.", $props.power.data.actionType.value))), 1)) : createCommentVNode("", true),
        $props.power.data.powerUsage.value ? (openBlock(), createElementBlock("strong", _hoisted_7$5, toDisplayString($options.constants.powerUsages[$props.power.data.powerUsage.value]), 1)) : createCommentVNode("", true),
        $props.power.data.powerType.value ? (openBlock(), createElementBlock("strong", _hoisted_8$5, toDisplayString($options.constants.powerTypes[$props.power.data.powerType.value]), 1)) : createCommentVNode("", true)
      ])
    ]),
    createElementVNode("section", _hoisted_9$5, [
      $props.power.data.description.value ? (openBlock(), createElementBlock("div", _hoisted_10$5, [
        createElementVNode("span", {
          class: "power-detail-value",
          innerHTML: $props.power.data.description.value
        }, null, 8, _hoisted_11$5)
      ])) : createCommentVNode("", true),
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.powerDetailFields, (field) => {
        return openBlock(), createElementBlock("div", {
          class: "power-detail",
          key: field
        }, [
          createElementVNode("strong", _hoisted_12$4, toDisplayString($props.power.data[field].label) + ":", 1),
          _hoisted_13$4,
          createElementVNode("span", {
            class: "power-detail-value",
            innerHTML: $props.power.data[field].value
          }, null, 8, _hoisted_14$4)
        ]);
      }), 128))
    ]),
    createElementVNode("section", _hoisted_15$4, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.filterFeats($props.power.data.feats), (feat, tier) => {
        return openBlock(), createElementBlock("div", {
          key: tier,
          class: normalizeClass($setup.concat("power-feat ", feat.isActive.value ? "active" : ""))
        }, [
          createElementVNode("strong", _hoisted_16$4, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHAT.", tier))) + ":", 1),
          createElementVNode("div", {
            class: "power-detail-content",
            innerHTML: feat.description.value
          }, null, 8, _hoisted_17$4)
        ], 2);
      }), 128))
    ])
  ]);
}
var Power = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8]]);
const _sfc_main$7 = {
  name: "Rollable",
  props: ["name", "hide-icon", "type", "opt"],
  data() {
    return {};
  },
  computed: {},
  methods: {
    getClass() {
      return `rollable${this.hideIcon ? " hide-icon" : ""}${this.name ? " rollable--" + this.name : ""}`;
    }
  },
  async mounted() {
  }
};
const _hoisted_1$7 = ["data-roll-type", "data-roll-opt"];
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("a", {
    class: normalizeClass($options.getClass()),
    "data-roll-type": $props.type,
    "data-roll-opt": $props.opt
  }, [
    renderSlot(_ctx.$slots, "default")
  ], 10, _hoisted_1$7);
}
var Rollable = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7]]);
const _sfc_main$6 = {
  name: "CharPowers",
  props: ["actor", "tab", "flags"],
  setup() {
    return {
      concat,
      localize
    };
  },
  components: {
    Power,
    Rollable
  },
  data() {
    return {
      powers: [],
      groupOptions: [
        { value: "powerType", label: "Type" },
        { value: "actionType", label: "Action" },
        { value: "powerUsage", label: "Usage" },
        { value: "powerSource", label: "Class/Race/Item" },
        { value: "group", label: "Custom Groups" }
      ],
      sortOptions: [
        { value: "custom", label: "Custom" },
        { value: "name", label: "Name" },
        { value: "level", label: "Level" }
      ],
      groupBy: "powerType",
      sortBy: "custom",
      searchValue: null,
      activePowers: {}
    };
  },
  computed: {
    draggable() {
      return this.sortBy == "custom" ? true : false;
    },
    groups() {
      let groups = {};
      let sortTypes = [
        "powerSource",
        "powerType",
        "powerUsage",
        "actionType"
      ];
      if (sortTypes.includes(this.groupBy)) {
        let sortKey = `${this.groupBy}s`;
        for (let [key, label] of Object.entries(CONFIG.ARCHMAGE[sortKey])) {
          groups[key] = sortKey == "powerTypes" ? `ARCHMAGE.${key}s` : `ARCHMAGE.${key}`;
        }
      } else if (this.groupBy == "group") {
        this.powers.forEach((i) => {
          groups["power"] = "Power";
          if (i.data.group.value) {
            let group = i.data.group.value;
            if (!group || group === void 0) {
              group = "Power";
            }
            groups[this.cleanClassName(group)] = group;
          }
        });
      } else {
        groups["power"] = "Power";
      }
      if (!groups["other"])
        groups["other"] = `ARCHMAGE.other`;
      return groups;
    },
    classes() {
      return `section section--powers flexcol`;
    },
    powerGroups() {
      let sortTypes = [
        "powerSource",
        "powerType",
        "powerUsage",
        "actionType"
      ];
      this.getPowers();
      let powersByGroup = this.powers.reduce((powerGroup, power) => {
        let group = "power";
        let powerData = power.data;
        if (sortTypes.includes(this.groupBy)) {
          group = powerData[this.groupBy] && powerData[this.groupBy].value ? powerData[this.groupBy].value : "other";
          group = group == "maneuver" ? "flexible" : group;
        } else if (this.groupBy == "group") {
          group = powerData.group.value ? this.cleanClassName(powerData.group.value) : "power";
        }
        if (!powerGroup[group]) {
          powerGroup[group] = [];
        }
        powerGroup[group].push(power);
        return powerGroup;
      }, {});
      return powersByGroup;
    }
  },
  methods: {
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, "") : "";
    },
    hasFeats(power) {
      let hasFeats = false;
      if (power.data && power.data && power.data.feats) {
        for (let [tier, feat] of Object.entries(power.data.feats)) {
          if (feat.description.value || feat.isActive.value) {
            hasFeats = true;
            break;
          }
        }
      }
      return hasFeats;
    },
    filterFeats(featObj) {
      let res = {};
      for (let [tier, feat] of Object.entries(featObj)) {
        if (feat.description.value)
          res[tier] = feat;
      }
      return res;
    },
    getActionShort(actionType) {
      let actionTypes = {
        "standard": "STD",
        "move": "MOV",
        "quick": "QCK",
        "free": "FREE",
        "interrupt": "INT"
      };
      return actionTypes[actionType] ? actionTypes[actionType] : "STD";
    },
    getPowers() {
      let powers = this.actor.items.filter((i) => i.type == "power");
      if (this.searchValue) {
        powers = powers.filter((i) => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = this.cleanClassName(i.name);
          return haystack.includes(needle);
        });
      }
      if (this.sortBy == "name") {
        powers = powers.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      } else if (this.sortBy == "level") {
        powers = powers.sort((a, b) => {
          if (a.data.powerLevel.value < b.data.powerLevel.value) {
            return -1;
          }
          if (a.data.powerLevel.value > b.data.powerLevel.value) {
            return 1;
          }
          return 0;
        });
      } else {
        powers = powers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      }
      powers.forEach((i) => {
        if (this.activePowers[i._id] == void 0) {
          this.activePowers[i._id] = false;
        }
      });
      this.powers = powers;
    },
    togglePower(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.itemId;
      if (id) {
        if (this.activePowers[id] !== void 0) {
          this.activePowers[id] = !this.activePowers[id];
        } else {
          this.activePowers[id] = true;
        }
      }
    },
    getPowerStyle(powerId) {
      let power = this.$refs[`power--${powerId}`];
      let height = 0;
      if (power) {
        const element = this.$el.querySelector(`.power-item--${powerId} .power-content .power`);
        height = this.activePowers[powerId] ? `${element.offsetHeight}px` : `0px`;
      }
      return {
        maxHeight: height
      };
    }
  },
  watch: {
    "actor.items": {
      deep: true,
      handler() {
        this.getPowers();
      }
    },
    "searchValue": {
      deep: false,
      handler() {
        this.getPowers();
      }
    }
  },
  async mounted() {
    this.groupBy = this.flags.sheetDisplay.powers.groupBy.value ? this.flags.sheetDisplay.powers.groupBy.value : "powerType";
    this.sortBy = this.flags.sheetDisplay.powers.sortBy.value ? this.flags.sheetDisplay.powers.sortBy.value : "custom";
    this.getPowers();
  }
};
const _hoisted_1$6 = { class: "power-filters flexrow" };
const _hoisted_2$6 = { class: "group-powers" };
const _hoisted_3$6 = { for: "power-group" };
const _hoisted_4$6 = ["value"];
const _hoisted_5$5 = { class: "sort-powers" };
const _hoisted_6$4 = { for: "power-sort" };
const _hoisted_7$4 = ["value"];
const _hoisted_8$4 = { class: "filter-search-powers" };
const _hoisted_9$4 = { for: "power-filter-search" };
const _hoisted_10$4 = ["placeholder"];
const _hoisted_11$4 = { class: "import-powers" };
const _hoisted_12$3 = {
  class: "item-import button",
  title: "Create Power",
  "data-item-type": "power",
  "data-type": "power",
  type: "button"
};
const _hoisted_13$3 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-atlas" }, null, -1);
const _hoisted_14$3 = { class: "power-group-header" };
const _hoisted_15$3 = { class: "power-header-title grid power-grid" };
const _hoisted_16$3 = { class: "power-group-title unit-title" };
const _hoisted_17$3 = { class: "item-controls" };
const _hoisted_18$3 = ["data-group-type", "data-power-type"];
const _hoisted_19$3 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-plus" }, null, -1);
const _hoisted_20$3 = { class: "power-header-labels grid power-grid" };
const _hoisted_21$3 = { class: "power-name" };
const _hoisted_22$3 = { class: "power-feat-pips" };
const _hoisted_23$3 = { class: "power-action" };
const _hoisted_24$3 = { class: "power-recharge" };
const _hoisted_25$3 = { class: "power-uses" };
const _hoisted_26$3 = { class: "item-controls" };
const _hoisted_27$3 = { class: "power-group-content flexcol" };
const _hoisted_28$2 = ["data-item-id", "data-draggable", "draggable"];
const _hoisted_29$2 = ["src"];
const _hoisted_30$2 = ["data-item-id"];
const _hoisted_31$2 = { class: "power-title unit-subtitle" };
const _hoisted_32$2 = { key: 0 };
const _hoisted_33$2 = {
  key: 0,
  class: "power-feat-pips"
};
const _hoisted_34$2 = { class: "feat-pips" };
const _hoisted_35$2 = ["data-item-id", "data-tier"];
const _hoisted_36$2 = { class: "hide" };
const _hoisted_37$2 = {
  key: 1,
  class: "power-action"
};
const _hoisted_38$2 = {
  key: 2,
  class: "power-recharge"
};
const _hoisted_39$2 = ["data-item-id", "data-quantity"];
const _hoisted_40$2 = { key: 0 };
const _hoisted_41$2 = { class: "item-controls" };
const _hoisted_42$2 = ["data-item-id"];
const _hoisted_43$2 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1);
const _hoisted_44$2 = [
  _hoisted_43$2
];
const _hoisted_45$2 = ["data-item-id"];
const _hoisted_46$2 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-trash" }, null, -1);
const _hoisted_47$2 = [
  _hoisted_46$2
];
const _hoisted_48$2 = {
  key: 3,
  class: "power-trigger"
};
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Rollable = resolveComponent("Rollable");
  const _component_Power = resolveComponent("Power");
  return openBlock(), createElementBlock("section", {
    class: normalizeClass($options.classes)
  }, [
    createElementVNode("header", _hoisted_1$6, [
      createElementVNode("div", _hoisted_2$6, [
        withDirectives(createElementVNode("input", {
          type: "hidden",
          name: "flags.archmage.sheetDisplay.powers.groupBy.value",
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.groupBy = $event)
        }, null, 512), [
          [vModelText, $data.groupBy]
        ]),
        createElementVNode("label", _hoisted_3$6, toDisplayString($setup.localize("ARCHMAGE.groupBy")), 1),
        withDirectives(createElementVNode("select", {
          name: "power-group",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.groupBy = $event)
        }, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($data.groupOptions, (option, index) => {
            return openBlock(), createElementBlock("option", {
              key: index,
              value: option.value
            }, toDisplayString($setup.localize($setup.concat("ARCHMAGE.GROUPS.", option.value))), 9, _hoisted_4$6);
          }), 128))
        ], 512), [
          [vModelSelect, $data.groupBy]
        ])
      ]),
      createElementVNode("div", _hoisted_5$5, [
        withDirectives(createElementVNode("input", {
          type: "hidden",
          name: "flags.archmage.sheetDisplay.powers.sortBy.value",
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.sortBy = $event)
        }, null, 512), [
          [vModelText, $data.sortBy]
        ]),
        createElementVNode("label", _hoisted_6$4, toDisplayString($setup.localize("ARCHMAGE.sort")), 1),
        withDirectives(createElementVNode("select", {
          name: "power-sort",
          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.sortBy = $event)
        }, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($data.sortOptions, (option, index) => {
            return openBlock(), createElementBlock("option", {
              key: index,
              value: option.value
            }, toDisplayString($setup.localize($setup.concat("ARCHMAGE.SORTS.", option.value))), 9, _hoisted_7$4);
          }), 128))
        ], 512), [
          [vModelSelect, $data.sortBy]
        ])
      ]),
      createElementVNode("div", _hoisted_8$4, [
        createElementVNode("label", _hoisted_9$4, toDisplayString($setup.localize("ARCHMAGE.filter")), 1),
        withDirectives(createElementVNode("input", {
          type: "text",
          name: "power-filter-search",
          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.searchValue = $event),
          placeholder: $setup.localize("ARCHMAGE.filterName")
        }, null, 8, _hoisted_10$4), [
          [vModelText, $data.searchValue]
        ])
      ]),
      createElementVNode("div", _hoisted_11$4, [
        createElementVNode("button", _hoisted_12$3, [
          _hoisted_13$3,
          createTextVNode(" " + toDisplayString($setup.localize("ARCHMAGE.import")), 1)
        ])
      ])
    ]),
    (openBlock(true), createElementBlock(Fragment, null, renderList($options.groups, (group, groupKey) => {
      return openBlock(), createElementBlock("section", {
        key: groupKey,
        class: "power-group"
      }, [
        createElementVNode("div", _hoisted_14$3, [
          createElementVNode("div", _hoisted_15$3, [
            createElementVNode("h2", _hoisted_16$3, toDisplayString($setup.localize(group)), 1),
            createElementVNode("div", _hoisted_17$3, [
              createElementVNode("a", {
                class: "item-control item-create",
                "data-item-type": "power",
                "data-group-type": $data.groupBy,
                "data-power-type": groupKey
              }, [
                _hoisted_19$3,
                createTextVNode(" " + toDisplayString($setup.localize("ARCHMAGE.add")), 1)
              ], 8, _hoisted_18$3)
            ])
          ]),
          createElementVNode("div", _hoisted_20$3, [
            createElementVNode("div", _hoisted_21$3, toDisplayString($setup.localize("ARCHMAGE.powerName")), 1),
            createElementVNode("div", _hoisted_22$3, toDisplayString($setup.localize("ARCHMAGE.feat")), 1),
            createElementVNode("div", _hoisted_23$3, toDisplayString($setup.localize("ARCHMAGE.act")), 1),
            createElementVNode("div", _hoisted_24$3, toDisplayString($setup.localize("ARCHMAGE.rchg")), 1),
            createElementVNode("div", _hoisted_25$3, toDisplayString($setup.localize("ARCHMAGE.uses")), 1),
            createElementVNode("div", _hoisted_26$3, toDisplayString($setup.localize("ARCHMAGE.edit")), 1)
          ])
        ]),
        createElementVNode("ul", _hoisted_27$3, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($options.powerGroups[groupKey], (power, powerKey) => {
            return openBlock(), createElementBlock("li", {
              key: powerKey,
              class: normalizeClass($setup.concat("item power-item power-item--", power._id)),
              "data-item-id": power._id,
              "data-draggable": $options.draggable,
              draggable: $options.draggable
            }, [
              createElementVNode("div", {
                class: normalizeClass($setup.concat("power-summary grid power-grid ", power.data.powerUsage.value ? power.data.powerUsage.value : "other", power.data.trigger.value ? " power-summary--trigger" : "", $data.activePowers[power._id] ? " active" : ""))
              }, [
                createVNode(_component_Rollable, {
                  name: "item",
                  "hide-icon": true,
                  type: "item",
                  opt: power._id
                }, {
                  default: withCtx(() => [
                    createElementVNode("img", {
                      src: power.img,
                      class: "power-image"
                    }, null, 8, _hoisted_29$2)
                  ]),
                  _: 2
                }, 1032, ["opt"]),
                createElementVNode("a", {
                  class: "power-name",
                  onClick: _cache[5] || (_cache[5] = (...args) => $options.togglePower && $options.togglePower(...args)),
                  "data-item-id": power._id
                }, [
                  createElementVNode("h3", _hoisted_31$2, [
                    power.data.powerLevel.value ? (openBlock(), createElementBlock("span", _hoisted_32$2, "[" + toDisplayString(power.data.powerLevel.value) + "] ", 1)) : createCommentVNode("", true),
                    createTextVNode(" " + toDisplayString(power.name), 1)
                  ])
                ], 8, _hoisted_30$2),
                $options.hasFeats(power) ? (openBlock(), createElementBlock("div", _hoisted_33$2, [
                  createElementVNode("ul", _hoisted_34$2, [
                    (openBlock(true), createElementBlock(Fragment, null, renderList($options.filterFeats(power.data.feats), (feat, tier) => {
                      return openBlock(), createElementBlock("li", {
                        key: tier,
                        class: normalizeClass($setup.concat("feat-pip", feat.isActive.value ? " active" : "")),
                        "data-item-id": power._id,
                        "data-tier": tier
                      }, [
                        createElementVNode("div", _hoisted_36$2, toDisplayString(tier), 1)
                      ], 10, _hoisted_35$2);
                    }), 128))
                  ])
                ])) : createCommentVNode("", true),
                power.data.actionType.value ? (openBlock(), createElementBlock("div", _hoisted_37$2, toDisplayString($options.getActionShort(power.data.actionType.value)), 1)) : createCommentVNode("", true),
                power.data.recharge.value && power.data.powerUsage.value == "recharge" ? (openBlock(), createElementBlock("div", _hoisted_38$2, [
                  createVNode(_component_Rollable, {
                    name: "recharge",
                    type: "recharge",
                    opt: power._id
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(Number(power.data.recharge.value) || 16) + "+", 1)
                    ]),
                    _: 2
                  }, 1032, ["opt"])
                ])) : createCommentVNode("", true),
                createElementVNode("div", {
                  class: "power-uses",
                  "data-item-id": power._id,
                  "data-quantity": power.data.quantity.value
                }, [
                  power.data.quantity.value !== null ? (openBlock(), createElementBlock("span", _hoisted_40$2, toDisplayString(power.data.quantity.value), 1)) : createCommentVNode("", true)
                ], 8, _hoisted_39$2),
                createElementVNode("div", _hoisted_41$2, [
                  createElementVNode("a", {
                    class: "item-control item-edit",
                    "data-item-id": power._id
                  }, _hoisted_44$2, 8, _hoisted_42$2),
                  createElementVNode("a", {
                    class: "item-control item-delete",
                    "data-item-id": power._id
                  }, _hoisted_47$2, 8, _hoisted_45$2)
                ]),
                power.data.trigger.value ? (openBlock(), createElementBlock("div", _hoisted_48$2, [
                  createElementVNode("strong", null, toDisplayString($setup.localize("ARCHMAGE.CHAT.trigger")) + ":", 1),
                  createTextVNode(" " + toDisplayString(power.data.trigger.value), 1)
                ])) : createCommentVNode("", true)
              ], 2),
              createElementVNode("div", {
                class: normalizeClass($setup.concat("power-content", $data.activePowers[power._id] ? " active" : "")),
                style: normalizeStyle($options.getPowerStyle(power._id))
              }, [
                createVNode(_component_Power, {
                  power,
                  ref_for: true,
                  ref: $setup.concat("power--", power._id)
                }, null, 8, ["power"])
              ], 6)
            ], 10, _hoisted_28$2);
          }), 128))
        ])
      ]);
    }), 128))
  ], 2);
}
var CharPowers = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6]]);
const _sfc_main$5 = {
  name: "Equipment",
  props: ["equipment", "bonuses"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data() {
    return {};
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    }
  },
  methods: {},
  async mounted() {
  }
};
const _hoisted_1$5 = { class: "equipment" };
const _hoisted_2$5 = { class: "equipment-bonuses flexcol" };
const _hoisted_3$5 = { class: "equipment-detail-label" };
const _hoisted_4$5 = { class: "equipment-detail-value" };
const _hoisted_5$4 = {
  key: 0,
  class: "equipment-chakra-slot flexcol"
};
const _hoisted_6$3 = { class: "equipment-detail" };
const _hoisted_7$3 = { class: "equipment-detail-label" };
const _hoisted_8$3 = { class: "equipment-detail-value" };
const _hoisted_9$3 = { class: "equipment-details flexcol" };
const _hoisted_10$3 = { class: "equipment-detail" };
const _hoisted_11$3 = ["innerHTML"];
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$5, [
    createElementVNode("section", _hoisted_2$5, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($props.bonuses, (bonus, index) => {
        return openBlock(), createElementBlock("div", {
          class: "equipment-detail",
          key: index
        }, [
          createElementVNode("strong", _hoisted_3$5, toDisplayString($setup.localize($setup.concat("ARCHMAGE.ITEM.", index, "Bonus"))) + ": ", 1),
          createElementVNode("span", _hoisted_4$5, toDisplayString(bonus), 1)
        ]);
      }), 128))
    ]),
    $props.equipment.data.chackra ? (openBlock(), createElementBlock("section", _hoisted_5$4, [
      createElementVNode("div", _hoisted_6$3, [
        createElementVNode("strong", _hoisted_7$3, toDisplayString($setup.localize("ARCHMAGE.ITEM.chakraSlot")) + ": ", 1),
        createElementVNode("span", _hoisted_8$3, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHAKRA.", $props.equipment.data.chackra))), 1)
      ])
    ])) : createCommentVNode("", true),
    createElementVNode("section", _hoisted_9$3, [
      createElementVNode("div", _hoisted_10$3, [
        createElementVNode("span", {
          class: "equipment-detail-value",
          innerHTML: $props.equipment.data.description.value
        }, null, 8, _hoisted_11$3)
      ])
    ])
  ]);
}
var Equipment = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5]]);
const _sfc_main$4 = {
  name: "Loot",
  props: ["equipment"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data() {
    return {};
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    }
  },
  methods: {},
  async mounted() {
  }
};
const _hoisted_1$4 = { class: "equipment" };
const _hoisted_2$4 = { class: "equipment-details flexcol" };
const _hoisted_3$4 = { class: "equipment-detail" };
const _hoisted_4$4 = ["innerHTML"];
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", _hoisted_1$4, [
    createElementVNode("section", _hoisted_2$4, [
      createElementVNode("div", _hoisted_3$4, [
        createElementVNode("span", {
          class: "equipment-detail-value",
          innerHTML: $props.equipment.data.description.value
        }, null, 8, _hoisted_4$4)
      ])
    ])
  ]);
}
var Loot = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4]]);
const _sfc_main$3 = {
  props: ["actor", "tab", "flags"],
  data() {
    return {
      equipment: [],
      sortOptions: [
        { value: "custom", label: "Custom" },
        { value: "name", label: "Name" }
      ],
      groupBy: "equipment",
      sortBy: "custom",
      searchValue: null,
      activeEquipment: {},
      currency: [
        "platinum",
        "gold",
        "silver",
        "copper"
      ]
    };
  },
  setup() {
    return {
      concat,
      localize,
      numberFormat
    };
  },
  components: {
    Equipment,
    Loot,
    Rollable
  },
  computed: {
    draggable() {
      return this.sortBy == "custom" ? true : false;
    },
    classes() {
      return `section section--inventory flexcol`;
    },
    groups() {
      let groups = {};
      let sortTypes = [
        "equipment",
        "loot"
      ];
      `${this.groupBy}`;
      for (let key of sortTypes) {
        groups[key] = `ARCHMAGE.INVENTORY.${key}`;
      }
      return groups;
    },
    equipmentGroups() {
      let equipmentByGroup = this.equipment.reduce((equipmentGroup, equipment) => {
        let group = equipment.type ? equipment.type : "equipment";
        group = group == "tool" ? "loot" : group;
        if (!equipmentGroup[group]) {
          equipmentGroup[group] = [];
        }
        equipmentGroup[group].push(equipment);
        return equipmentGroup;
      }, {});
      return equipmentByGroup;
    }
  },
  methods: {
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, "") : "";
    },
    getEquipment() {
      let equipment = this.actor.items.filter((i) => i.type == "equipment" || i.type == "loot" || i.type == "tool");
      if (this.searchValue) {
        equipment = equipment.filter((i) => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = `${i.name}${i.data.chackra ? i.data.chackra : ""}`;
          if (i.type == "equipment") {
            let bonuses = this.getBonuses(i);
            for (let [k, v] of Object.entries(bonuses)) {
              haystack = `${haystack}${k}${v}`;
            }
          }
          haystack = this.cleanClassName(haystack);
          return haystack.includes(needle);
        });
      }
      if (this.sortBy == "name") {
        equipment = equipment.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      }
      equipment.forEach((i) => {
        if (this.activeEquipment[i._id] == void 0) {
          this.activeEquipment[i._id] = false;
        }
      });
      this.equipment = equipment;
    },
    getBonuses(equipment) {
      let bonuses = {};
      for (let [prop, value] of Object.entries(equipment.data.attributes)) {
        if (value.bonus) {
          bonuses[prop] = value.bonus;
        } else if (prop == "attack") {
          for (let [atkProp, atkValue] of Object.entries(value)) {
            if (atkValue.bonus) {
              bonuses[atkProp] = atkValue.bonus;
            }
          }
        }
      }
      return bonuses;
    },
    toggleEquipment(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.itemId;
      if (id) {
        if (this.activeEquipment[id] !== void 0) {
          this.activeEquipment[id] = !this.activeEquipment[id];
        } else {
          this.activeEquipment[id] = true;
        }
      }
    },
    getEquipmentStyle(equipmentId) {
      let equipment = this.$refs[`equipment--${equipmentId}`];
      let height = 0;
      if (equipment) {
        const element = this.$el.querySelector(`.equipment-item--${equipmentId} .equipment-content .equipment`);
        height = this.activeEquipment[equipmentId] ? `${element.offsetHeight}px` : `0px`;
      }
      return {
        maxHeight: height
      };
    }
  },
  watch: {
    "actor.items": {
      deep: true,
      handler() {
        this.getEquipment();
      }
    },
    "searchValue": {
      deep: false,
      handler() {
        this.getEquipment();
      }
    }
  },
  async mounted() {
    this.getEquipment();
    this.sortBy = this.flags.sheetDisplay.inventory.sortBy.value ? this.flags.sheetDisplay.inventory.sortBy.value : "custom";
  }
};
const _hoisted_1$3 = { class: "equipment-currency flexrow" };
const _hoisted_2$3 = { class: "unit-title" };
const _hoisted_3$3 = ["name", "onUpdate:modelValue"];
const _hoisted_4$3 = { class: "equipment-filters flexrow" };
const _hoisted_5$3 = { class: "sort-equipment" };
const _hoisted_6$2 = { for: "equipment-sort" };
const _hoisted_7$2 = ["value"];
const _hoisted_8$2 = { class: "filter-search-equipment" };
const _hoisted_9$2 = { for: "equipment-filter-search" };
const _hoisted_10$2 = ["placeholder"];
const _hoisted_11$2 = { class: "equipment-group-header" };
const _hoisted_12$2 = { class: "equipment-header-title grid equipment-grid" };
const _hoisted_13$2 = { class: "equipment-group-title unit-title" };
const _hoisted_14$2 = { class: "item-controls" };
const _hoisted_15$2 = ["data-item-type"];
const _hoisted_16$2 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-plus" }, null, -1);
const _hoisted_17$2 = { class: "equipment-header-labels grid equipment-grid" };
const _hoisted_18$2 = { class: "equipment-name" };
const _hoisted_19$2 = {
  key: 0,
  class: "equipment-feat-pips"
};
const _hoisted_20$2 = {
  key: 1,
  class: "equipment-bonus"
};
const _hoisted_21$2 = {
  key: 2,
  class: "equipment-chakra"
};
const _hoisted_22$2 = {
  key: 3,
  class: "equipment-recharge"
};
const _hoisted_23$2 = {
  key: 4,
  class: "equipment-quantity"
};
const _hoisted_24$2 = {
  key: 5,
  class: "equipment-quantity"
};
const _hoisted_25$2 = { class: "item-controls" };
const _hoisted_26$2 = { class: "equipment-group-content flexcol" };
const _hoisted_27$2 = ["data-item-id", "data-draggable", "draggable"];
const _hoisted_28$1 = { class: "equipment-summary grid equipment-grid equipment" };
const _hoisted_29$1 = ["src"];
const _hoisted_30$1 = ["data-item-id"];
const _hoisted_31$1 = { class: "equipment-title unit-subtitle" };
const _hoisted_32$1 = {
  key: 0,
  class: "equipment-feat-pips"
};
const _hoisted_33$1 = { class: "feat-pips" };
const _hoisted_34$1 = ["data-item-id"];
const _hoisted_35$1 = { class: "hide" };
const _hoisted_36$1 = {
  key: 1,
  class: "equipment-bonus flexrow"
};
const _hoisted_37$1 = { class: "bonus-label" };
const _hoisted_38$1 = { class: "bonus-value" };
const _hoisted_39$1 = {
  key: 2,
  class: "equipment-chakra"
};
const _hoisted_40$1 = {
  key: 3,
  class: "equipment-recharge"
};
const _hoisted_41$1 = ["data-item-id", "data-quantity"];
const _hoisted_42$1 = { class: "item-controls" };
const _hoisted_43$1 = ["data-item-id"];
const _hoisted_44$1 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1);
const _hoisted_45$1 = [
  _hoisted_44$1
];
const _hoisted_46$1 = ["data-item-id"];
const _hoisted_47$1 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-trash" }, null, -1);
const _hoisted_48$1 = [
  _hoisted_47$1
];
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Rollable = resolveComponent("Rollable");
  const _component_Equipment = resolveComponent("Equipment");
  const _component_Loot = resolveComponent("Loot");
  return openBlock(), createElementBlock("section", {
    class: normalizeClass($options.classes)
  }, [
    createElementVNode("section", _hoisted_1$3, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($data.currency, (type) => {
        return openBlock(), createElementBlock("div", {
          key: type,
          class: normalizeClass($setup.concat("unit unit--currency unit--currency-", type))
        }, [
          createElementVNode("h2", _hoisted_2$3, toDisplayString($setup.localize($setup.concat("ARCHMAGE.COINS.", type))), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: $setup.concat("data.coins.", type, ".value"),
            class: "currency-input",
            "onUpdate:modelValue": ($event) => $props.actor.data.coins[type].value = $event,
            placeholder: "0"
          }, null, 8, _hoisted_3$3), [
            [vModelText, $props.actor.data.coins[type].value]
          ])
        ], 2);
      }), 128))
    ]),
    createElementVNode("header", _hoisted_4$3, [
      createElementVNode("div", _hoisted_5$3, [
        withDirectives(createElementVNode("input", {
          type: "hidden",
          name: "flags.archmage.sheetDisplay.inventory.sortBy.value",
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.sortBy = $event)
        }, null, 512), [
          [vModelText, $data.sortBy]
        ]),
        createElementVNode("label", _hoisted_6$2, toDisplayString($setup.localize("ARCHMAGE.sort")), 1),
        withDirectives(createElementVNode("select", {
          name: "equipment-sort",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.sortBy = $event)
        }, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($data.sortOptions, (option, index) => {
            return openBlock(), createElementBlock("option", {
              key: index,
              value: option.value
            }, toDisplayString($setup.localize($setup.concat("ARCHMAGE.SORTS.", option.value))), 9, _hoisted_7$2);
          }), 128))
        ], 512), [
          [vModelSelect, $data.sortBy]
        ])
      ]),
      createElementVNode("div", _hoisted_8$2, [
        createElementVNode("label", _hoisted_9$2, toDisplayString($setup.localize("ARCHMAGE.filter")), 1),
        withDirectives(createElementVNode("input", {
          type: "text",
          name: "equipment-filter-search",
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.searchValue = $event),
          placeholder: $setup.localize("ARCHMAGE.filterName")
        }, null, 8, _hoisted_10$2), [
          [vModelText, $data.searchValue]
        ])
      ])
    ]),
    (openBlock(true), createElementBlock(Fragment, null, renderList($options.groups, (group, groupKey) => {
      return openBlock(), createElementBlock("section", {
        key: groupKey,
        class: "equipment-group"
      }, [
        createElementVNode("div", _hoisted_11$2, [
          createElementVNode("div", _hoisted_12$2, [
            createElementVNode("h2", _hoisted_13$2, toDisplayString($setup.localize(group)), 1),
            createElementVNode("div", _hoisted_14$2, [
              createElementVNode("a", {
                class: "item-control item-create",
                "data-item-type": groupKey
              }, [
                _hoisted_16$2,
                createTextVNode(" " + toDisplayString($setup.localize("ARCHMAGE.add")), 1)
              ], 8, _hoisted_15$2)
            ])
          ]),
          createElementVNode("div", _hoisted_17$2, [
            createElementVNode("div", _hoisted_18$2, toDisplayString($setup.localize("ARCHMAGE.equipmentName")), 1),
            groupKey == "equipment" ? (openBlock(), createElementBlock("div", _hoisted_19$2, toDisplayString($setup.localize("ARCHMAGE.ITEM.active")), 1)) : createCommentVNode("", true),
            groupKey == "equipment" ? (openBlock(), createElementBlock("div", _hoisted_20$2, toDisplayString($setup.localize("ARCHMAGE.bonuses")), 1)) : createCommentVNode("", true),
            groupKey == "equipment" ? (openBlock(), createElementBlock("div", _hoisted_21$2, toDisplayString($setup.localize("ARCHMAGE.chakra")), 1)) : createCommentVNode("", true),
            groupKey == "equipment" ? (openBlock(), createElementBlock("div", _hoisted_22$2, toDisplayString($setup.localize("ARCHMAGE.rchg")), 1)) : createCommentVNode("", true),
            groupKey == "equipment" ? (openBlock(), createElementBlock("div", _hoisted_23$2, toDisplayString($setup.localize("ARCHMAGE.uses")), 1)) : createCommentVNode("", true),
            groupKey != "equipment" ? (openBlock(), createElementBlock("div", _hoisted_24$2, toDisplayString($setup.localize("ARCHMAGE.quantity")), 1)) : createCommentVNode("", true),
            createElementVNode("div", _hoisted_25$2, toDisplayString($setup.localize("ARCHMAGE.edit")), 1)
          ])
        ]),
        createElementVNode("ul", _hoisted_26$2, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($options.equipmentGroups[groupKey], (equipment, equipmentKey) => {
            return openBlock(), createElementBlock("li", {
              key: equipmentKey,
              class: normalizeClass($setup.concat("item equipment-item equipment-item--", equipment._id)),
              "data-item-id": equipment._id,
              "data-draggable": $options.draggable,
              draggable: $options.draggable
            }, [
              createElementVNode("div", _hoisted_28$1, [
                createVNode(_component_Rollable, {
                  name: "item",
                  "hide-icon": true,
                  type: "item",
                  opt: equipment._id
                }, {
                  default: withCtx(() => [
                    createElementVNode("img", {
                      src: equipment.img,
                      class: "equipment-image"
                    }, null, 8, _hoisted_29$1)
                  ]),
                  _: 2
                }, 1032, ["opt"]),
                createElementVNode("a", {
                  class: "equipment-name",
                  onClick: _cache[3] || (_cache[3] = (...args) => $options.toggleEquipment && $options.toggleEquipment(...args)),
                  "data-item-id": equipment._id
                }, [
                  createElementVNode("h3", _hoisted_31$1, toDisplayString(equipment.name), 1)
                ], 8, _hoisted_30$1),
                groupKey === "equipment" ? (openBlock(), createElementBlock("div", _hoisted_32$1, [
                  createElementVNode("ul", _hoisted_33$1, [
                    createElementVNode("li", {
                      class: normalizeClass($setup.concat("feat-pip", equipment.data.isActive ? " active" : "")),
                      "data-item-id": equipment._id
                    }, [
                      createElementVNode("div", _hoisted_35$1, toDisplayString(equipment.data.isActive), 1)
                    ], 10, _hoisted_34$1)
                  ])
                ])) : createCommentVNode("", true),
                equipment.data.attributes ? (openBlock(), createElementBlock("div", _hoisted_36$1, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($options.getBonuses(equipment), (bonus, bonusProp) => {
                    return openBlock(), createElementBlock("span", {
                      class: "bonus",
                      key: bonusProp
                    }, [
                      createElementVNode("span", _hoisted_37$1, toDisplayString(bonusProp), 1),
                      createElementVNode("span", _hoisted_38$1, toDisplayString($setup.numberFormat(bonus, 0, true)), 1)
                    ]);
                  }), 128))
                ])) : createCommentVNode("", true),
                equipment.data.chackra ? (openBlock(), createElementBlock("div", _hoisted_39$1, toDisplayString(equipment.data.chackra), 1)) : createCommentVNode("", true),
                equipment.data.recharge && equipment.data.recharge.value && equipment.data.powerUsage.value == "recharge" ? (openBlock(), createElementBlock("div", _hoisted_40$1, [
                  createVNode(_component_Rollable, {
                    name: "recharge",
                    type: "recharge",
                    opt: equipment._id
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(Number(equipment.data.recharge.value) || 16) + "+", 1)
                    ]),
                    _: 2
                  }, 1032, ["opt"])
                ])) : createCommentVNode("", true),
                createElementVNode("div", {
                  class: "equipment-quantity",
                  "data-item-id": equipment._id,
                  "data-quantity": equipment.data.quantity.value
                }, [
                  createElementVNode("span", null, toDisplayString(equipment.data.quantity.value), 1)
                ], 8, _hoisted_41$1),
                createElementVNode("div", _hoisted_42$1, [
                  createElementVNode("a", {
                    class: "item-control item-edit",
                    "data-item-id": equipment._id
                  }, _hoisted_45$1, 8, _hoisted_43$1),
                  createElementVNode("a", {
                    class: "item-control item-delete",
                    "data-item-id": equipment._id
                  }, _hoisted_48$1, 8, _hoisted_46$1)
                ])
              ]),
              createElementVNode("div", {
                class: normalizeClass($setup.concat("equipment-content", $data.activeEquipment[equipment._id] ? " active" : "")),
                style: normalizeStyle($options.getEquipmentStyle(equipment._id))
              }, [
                equipment.type == "equipment" ? (openBlock(), createBlock(_component_Equipment, {
                  key: 0,
                  equipment,
                  bonuses: $options.getBonuses(equipment),
                  ref_for: true,
                  ref: $setup.concat("equipment--", equipment._id)
                }, null, 8, ["equipment", "bonuses"])) : createCommentVNode("", true),
                equipment.type != "equipment" ? (openBlock(), createBlock(_component_Loot, {
                  key: 1,
                  equipment,
                  ref_for: true,
                  ref: $setup.concat("equipment--", equipment._id)
                }, null, 8, ["equipment"])) : createCommentVNode("", true)
              ], 6)
            ], 10, _hoisted_27$2);
          }), 128))
        ])
      ]);
    }), 128))
  ], 2);
}
var CharInventory = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3]]);
const _sfc_main$2 = {
  name: "CharEffects",
  props: ["actor", "tab", "flags"],
  setup() {
    return {
      concat,
      localize,
      numberFormat
    };
  },
  data() {
    return {
      effects: []
    };
  },
  computed: {
    classes() {
      return `section section--effects flexcol`;
    }
  },
  methods: {
    getEffects() {
      let effects = this.actor.effects;
      this.effects = effects;
    },
    getChanges(effect) {
      let changes = [];
      let modes = [
        "question",
        "times",
        "plus",
        "angle-double-down",
        "angle-double-up",
        "undo"
      ];
      effect.changes.forEach((c) => {
        if (c.key && c.value) {
          changes.push({
            label: c.key,
            mode: modes[c.mode],
            value: c.value
          });
        }
      });
      return changes;
    }
  },
  watch: {
    "actor.effects": {
      deep: true,
      handler() {
        this.getEffects();
      }
    }
  },
  async mounted() {
    this.getEffects();
  }
};
const _hoisted_1$2 = { class: "effects-group" };
const _hoisted_2$2 = { class: "effects-group-header" };
const _hoisted_3$2 = { class: "effects-header-title grid effects-grid" };
const _hoisted_4$2 = { class: "effects-group-title unit-title" };
const _hoisted_5$2 = { class: "item-controls effect-controls" };
const _hoisted_6$1 = ["title"];
const _hoisted_7$1 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-plus" }, null, -1);
const _hoisted_8$1 = [
  _hoisted_7$1
];
const _hoisted_9$1 = { class: "effects-group-content flexcol" };
const _hoisted_10$1 = ["data-effect-id"];
const _hoisted_11$1 = { class: "effects-summary grid effects-grid effects" };
const _hoisted_12$1 = { class: "effects-icon" };
const _hoisted_13$1 = ["src"];
const _hoisted_14$1 = ["data-effects-id"];
const _hoisted_15$1 = { class: "effects-title unit-subtitle" };
const _hoisted_16$1 = { class: "effects-bonus flexrow" };
const _hoisted_17$1 = { class: "bonus-label" };
const _hoisted_18$1 = { class: "bonus-mode" };
const _hoisted_19$1 = { class: "bonus-value" };
const _hoisted_20$1 = { class: "item-controls effect-controls" };
const _hoisted_21$1 = ["data-item-id", "title"];
const _hoisted_22$1 = ["data-item-id", "title"];
const _hoisted_23$1 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-edit" }, null, -1);
const _hoisted_24$1 = [
  _hoisted_23$1
];
const _hoisted_25$1 = ["data-item-id", "title"];
const _hoisted_26$1 = /* @__PURE__ */ createElementVNode("i", { class: "fas fa-trash" }, null, -1);
const _hoisted_27$1 = [
  _hoisted_26$1
];
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", {
    class: normalizeClass($options.classes)
  }, [
    createElementVNode("section", _hoisted_1$2, [
      createElementVNode("div", _hoisted_2$2, [
        createElementVNode("div", _hoisted_3$2, [
          createElementVNode("h2", _hoisted_4$2, toDisplayString($setup.localize("Effects")), 1),
          createElementVNode("div", _hoisted_5$2, [
            createElementVNode("a", {
              class: "effect-control",
              "data-action": "create",
              title: $setup.localize("Create Effect")
            }, _hoisted_8$1, 8, _hoisted_6$1)
          ])
        ])
      ]),
      createElementVNode("ul", _hoisted_9$1, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($data.effects, (effect, effectKey) => {
          return openBlock(), createElementBlock("li", {
            key: effectKey,
            class: normalizeClass($setup.concat("item effects-item", effect.disabled ? " effects-disabled" : "")),
            "data-effect-id": effect._id,
            "data-draggable": "true",
            draggable: "true"
          }, [
            createElementVNode("div", _hoisted_11$1, [
              createElementVNode("div", _hoisted_12$1, [
                createElementVNode("img", {
                  src: effect.icon,
                  class: "effects-image"
                }, null, 8, _hoisted_13$1)
              ]),
              createElementVNode("a", {
                class: "effects-name",
                "data-effects-id": effect._id
              }, [
                createElementVNode("h3", _hoisted_15$1, toDisplayString(effect.label), 1)
              ], 8, _hoisted_14$1),
              createElementVNode("div", _hoisted_16$1, [
                (openBlock(true), createElementBlock(Fragment, null, renderList($options.getChanges(effect), (bonus, bonusKey) => {
                  return openBlock(), createElementBlock("span", {
                    class: "bonus",
                    key: bonusKey
                  }, [
                    createElementVNode("span", _hoisted_17$1, toDisplayString(bonus.label), 1),
                    createElementVNode("span", _hoisted_18$1, [
                      createElementVNode("i", {
                        class: normalizeClass($setup.concat("fas fa-", bonus.mode))
                      }, null, 2)
                    ]),
                    createElementVNode("span", _hoisted_19$1, toDisplayString($setup.numberFormat(bonus.value, 0, false)), 1)
                  ]);
                }), 128))
              ]),
              createElementVNode("div", _hoisted_20$1, [
                createElementVNode("a", {
                  class: "effect-control",
                  "data-item-id": effect._id,
                  "data-action": "toggle",
                  title: $setup.localize("Toggle Effect")
                }, [
                  createElementVNode("i", {
                    class: normalizeClass($setup.concat("fas fa-", effect.disabled ? "check" : "times"))
                  }, null, 2)
                ], 8, _hoisted_21$1),
                createElementVNode("a", {
                  class: "effect-control",
                  "data-item-id": effect._id,
                  "data-action": "edit",
                  title: $setup.localize("Edit Effect")
                }, _hoisted_24$1, 8, _hoisted_22$1),
                createElementVNode("a", {
                  class: "effect-control",
                  "data-item-id": effect._id,
                  "data-action": "delete",
                  title: $setup.localize("Edit Effect")
                }, _hoisted_27$1, 8, _hoisted_25$1)
              ])
            ])
          ], 10, _hoisted_10$1);
        }), 128))
      ])
    ])
  ], 2);
}
var CharEffects = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2]]);
const _sfc_main$1 = {
  name: "CharSettings",
  props: ["actor", "owner", "tab"],
  setup() {
    return {
      concat,
      localize
    };
  },
  data() {
    return {
      resourceRestTypes: [
        { value: "none", label: "Do nothing" },
        { value: "quickreset", label: "Clear on Quick Rest" },
        { value: "fullreset", label: "Clear on Full Heal-Up" },
        { value: "quick", label: "Refill on Quick Rest" },
        { value: "full", label: "Refill on Full Heal-Up" }
      ],
      abilities: [
        { value: "str", label: "Str" },
        { value: "con", label: "Con" },
        { value: "dex", label: "Dex" },
        { value: "int", label: "Int" },
        { value: "wis", label: "Wis" },
        { value: "cha", label: "Cha" }
      ]
    };
  },
  computed: {
    flags() {
      let flags = CONFIG.Actor.characterFlags;
      let charFlags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
      for (let [k, v] of Object.entries(flags)) {
        v.value = charFlags && charFlags[k] ? charFlags[k] : null;
        flags[k] = v;
      }
      return flags;
    },
    classes() {
      return `section section--settings flexcol`;
    },
    resourcesCustom() {
      let resources = {};
      for (let [k, v] of Object.entries(this.actor.data.resources.spendable)) {
        if (k.includes("custom"))
          resources[k] = v;
      }
      return resources;
    },
    resourcesPerCombat() {
      let resources = {};
      for (let [k, v] of Object.entries(this.actor.data.resources.perCombat)) {
        resources[k] = v;
      }
      return resources;
    },
    resourcesSpendable() {
      let resources = {};
      for (let [k, v] of Object.entries(this.actor.data.resources.spendable)) {
        if (!k.includes("custom"))
          resources[k] = v;
      }
      return resources;
    },
    overrides() {
      return Object.keys(this.actor.overrides);
    }
  },
  methods: {},
  async mounted() {
  }
};
const _hoisted_1$1 = { class: "unit-title" };
const _hoisted_2$1 = { class: "sheet-settings grid grid-6col" };
const _hoisted_3$1 = { class: "unit unit--base-settings" };
const _hoisted_4$1 = { class: "sub-unit sub-unit--base-ac flexrow" };
const _hoisted_5$1 = { class: "unit-subtitle" };
const _hoisted_6 = ["disabled"];
const _hoisted_7 = { class: "sub-unit sub-unit--base-pd flexrow" };
const _hoisted_8 = { class: "unit-subtitle" };
const _hoisted_9 = ["disabled"];
const _hoisted_10 = { class: "sub-unit sub-unit--base-md flexrow" };
const _hoisted_11 = { class: "unit-subtitle" };
const _hoisted_12 = ["disabled"];
const _hoisted_13 = { class: "sub-unit sub-unit--base-hp flexrow" };
const _hoisted_14 = { class: "unit-subtitle" };
const _hoisted_15 = ["disabled"];
const _hoisted_16 = { class: "sub-unit sub-unit--base-recoveries flexrow" };
const _hoisted_17 = { class: "unit-subtitle" };
const _hoisted_18 = ["disabled"];
const _hoisted_19 = { class: "sub-unit sub-unit--recovery-dice flexrow" };
const _hoisted_20 = { class: "unit-subtitle" };
const _hoisted_21 = ["disabled"];
const _hoisted_22 = { class: "sub-unit sub-unit--calculate-max-hp flexrow" };
const _hoisted_23 = { class: "unit-subtitle" };
const _hoisted_24 = { class: "sub-unit sub-unit--calculate-max-recoveries flexrow" };
const _hoisted_25 = { class: "unit-subtitle" };
const _hoisted_26 = { class: "sub-unit sub-unit--initiative-adjustment flexrow" };
const _hoisted_27 = { class: "unit-subtitle" };
const _hoisted_28 = ["disabled"];
const _hoisted_29 = { class: "sub-unit sub-unit--attackMod flexrow" };
const _hoisted_30 = { class: "unit-subtitle" };
const _hoisted_31 = ["disabled"];
const _hoisted_32 = { class: "sub-unit sub-unit--critModAtk flexrow" };
const _hoisted_33 = { class: "unit-subtitle" };
const _hoisted_34 = ["disabled"];
const _hoisted_35 = { class: "sub-unit sub-unit--critModDef flexrow" };
const _hoisted_36 = { class: "unit-subtitle" };
const _hoisted_37 = ["disabled"];
const _hoisted_38 = { class: "sub-unit sub-unit--keyMod flexrow" };
const _hoisted_39 = { class: "unit-subtitle" };
const _hoisted_40 = ["value"];
const _hoisted_41 = /* @__PURE__ */ createTextVNode(" / ");
const _hoisted_42 = ["value"];
const _hoisted_43 = { class: "sub-unit sub-unit--melee" };
const _hoisted_44 = { class: "sub-unit sub-unit--melee-dice flexrow" };
const _hoisted_45 = { class: "unit-subtitle" };
const _hoisted_46 = ["disabled"];
const _hoisted_47 = { class: "sub-unit sub-unit--shield flexrow" };
const _hoisted_48 = { class: "unit-subtitle" };
const _hoisted_49 = { class: "sub-unit sub-unit--dualwield flexrow" };
const _hoisted_50 = { class: "unit-subtitle" };
const _hoisted_51 = { class: "sub-unit sub-unit--twohanded flexrow" };
const _hoisted_52 = { class: "unit-subtitle" };
const _hoisted_53 = { class: "sub-unit sub-unit--ranged-dice flexrow" };
const _hoisted_54 = { class: "unit-subtitle" };
const _hoisted_55 = ["disabled"];
const _hoisted_56 = { class: "sub-unit sub-unit--jab-dice flexrow" };
const _hoisted_57 = { class: "unit-subtitle" };
const _hoisted_58 = ["disabled"];
const _hoisted_59 = { class: "sub-unit sub-unit--punch-dice flexrow" };
const _hoisted_60 = { class: "unit-subtitle" };
const _hoisted_61 = ["disabled"];
const _hoisted_62 = { class: "sub-unit sub-unit--kick-dice flexrow" };
const _hoisted_63 = { class: "unit-subtitle" };
const _hoisted_64 = ["disabled"];
const _hoisted_65 = { class: "unit unit--flags" };
const _hoisted_66 = ["data-key"];
const _hoisted_67 = ["for"];
const _hoisted_68 = ["name", "onUpdate:modelValue"];
const _hoisted_69 = { class: "notes" };
const _hoisted_70 = { class: "unit unit--backgrounds" };
const _hoisted_71 = ["data-key"];
const _hoisted_72 = ["name", "onUpdate:modelValue"];
const _hoisted_73 = { class: "unit-subtitle" };
const _hoisted_74 = { class: "unit unit--icons" };
const _hoisted_75 = ["data-key"];
const _hoisted_76 = ["name", "onUpdate:modelValue"];
const _hoisted_77 = { class: "unit-subtitle" };
const _hoisted_78 = { class: "unit unit--resources" };
const _hoisted_79 = ["data-key"];
const _hoisted_80 = ["name", "onUpdate:modelValue"];
const _hoisted_81 = { class: "unit-subtitle" };
const _hoisted_82 = /* @__PURE__ */ createElementVNode("br", null, null, -1);
const _hoisted_83 = ["name", "onUpdate:modelValue"];
const _hoisted_84 = ["value"];
const _hoisted_85 = ["data-key"];
const _hoisted_86 = ["name", "onUpdate:modelValue"];
const _hoisted_87 = { class: "unit-subtitle" };
const _hoisted_88 = ["data-key"];
const _hoisted_89 = ["name", "onUpdate:modelValue"];
const _hoisted_90 = { class: "unit-subtitle" };
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("section", {
    class: normalizeClass($options.classes)
  }, [
    createElementVNode("h2", _hoisted_1$1, toDisplayString($setup.localize("ARCHMAGE.CHARACTERSETTINGS.settings")), 1),
    createElementVNode("section", _hoisted_2$1, [
      createElementVNode("div", _hoisted_3$1, [
        createElementVNode("div", _hoisted_4$1, [
          createElementVNode("strong", _hoisted_5$1, toDisplayString($setup.localize("ARCHMAGE.baseAC")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.ac.base",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.data.attributes.ac.base = $event),
            disabled: $options.overrides.includes("data.attributes.ac.base")
          }, null, 8, _hoisted_6), [
            [vModelText, $props.actor.data.attributes.ac.base]
          ])
        ]),
        createElementVNode("div", _hoisted_7, [
          createElementVNode("strong", _hoisted_8, toDisplayString($setup.localize("ARCHMAGE.basePD")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.pd.base",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.attributes.pd.base = $event),
            disabled: $options.overrides.includes("data.data.attributes.pd.base")
          }, null, 8, _hoisted_9), [
            [vModelText, $props.actor.data.attributes.pd.base]
          ])
        ]),
        createElementVNode("div", _hoisted_10, [
          createElementVNode("strong", _hoisted_11, toDisplayString($setup.localize("ARCHMAGE.baseMD")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.md.base",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $props.actor.data.attributes.md.base = $event),
            disabled: $options.overrides.includes("data.data.attributes.md.base")
          }, null, 8, _hoisted_12), [
            [vModelText, $props.actor.data.attributes.md.base]
          ])
        ]),
        createElementVNode("div", _hoisted_13, [
          createElementVNode("strong", _hoisted_14, toDisplayString($setup.localize("ARCHMAGE.baseHP")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.hp.base",
            step: ".1",
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $props.actor.data.attributes.hp.base = $event),
            disabled: $options.overrides.includes("data.data.attributes.hp.base")
          }, null, 8, _hoisted_15), [
            [vModelText, $props.actor.data.attributes.hp.base]
          ])
        ]),
        createElementVNode("div", _hoisted_16, [
          createElementVNode("strong", _hoisted_17, toDisplayString($setup.localize("ARCHMAGE.baseRecoveries")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.recoveries.base",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $props.actor.data.attributes.recoveries.base = $event),
            disabled: $options.overrides.includes("data.attributes.recoveries.base")
          }, null, 8, _hoisted_18), [
            [vModelText, $props.actor.data.attributes.recoveries.base]
          ])
        ]),
        createElementVNode("div", _hoisted_19, [
          createElementVNode("strong", _hoisted_20, toDisplayString($setup.localize("ARCHMAGE.recoveryDice")), 1),
          withDirectives(createElementVNode("input", {
            type: "text",
            name: "data.attributes.recoveries.dice",
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $props.actor.data.attributes.recoveries.dice = $event),
            disabled: $options.overrides.includes("data.attributes.recoveries.dice"),
            placeholder: "d8"
          }, null, 8, _hoisted_21), [
            [vModelText, $props.actor.data.attributes.recoveries.dice]
          ])
        ]),
        createElementVNode("div", _hoisted_22, [
          createElementVNode("strong", _hoisted_23, toDisplayString($setup.localize("ARCHMAGE.calculateHP")), 1),
          withDirectives(createElementVNode("input", {
            type: "checkbox",
            name: "data.attributes.hp.automatic",
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $props.actor.data.attributes.hp.automatic = $event)
          }, null, 512), [
            [vModelCheckbox, $props.actor.data.attributes.hp.automatic]
          ])
        ]),
        createElementVNode("div", _hoisted_24, [
          createElementVNode("strong", _hoisted_25, toDisplayString($setup.localize("ARCHMAGE.calculateRecoveries")), 1),
          withDirectives(createElementVNode("input", {
            type: "checkbox",
            name: "data.attributes.recoveries.automatic",
            "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $props.actor.data.attributes.recoveries.automatic = $event)
          }, null, 512), [
            [vModelCheckbox, $props.actor.data.attributes.recoveries.automatic]
          ])
        ]),
        createElementVNode("div", _hoisted_26, [
          createElementVNode("strong", _hoisted_27, toDisplayString($setup.localize("ARCHMAGE.initAdjustment")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.init.value",
            "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $props.actor.data.attributes.init.value = $event),
            disabled: $options.overrides.includes("data.attributes.init.value"),
            placeholder: "0"
          }, null, 8, _hoisted_28), [
            [vModelText, $props.actor.data.attributes.init.value]
          ])
        ]),
        createElementVNode("div", _hoisted_29, [
          createElementVNode("strong", _hoisted_30, toDisplayString($setup.localize("ARCHMAGE.attackMod")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.attackMod.value",
            "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $props.actor.data.attributes.attackMod.value = $event),
            disabled: $options.overrides.includes("data.attributes.attackMod.value")
          }, null, 8, _hoisted_31), [
            [vModelText, $props.actor.data.attributes.attackMod.value]
          ])
        ]),
        createElementVNode("div", _hoisted_32, [
          createElementVNode("strong", _hoisted_33, toDisplayString($setup.localize("ARCHMAGE.critModAtk")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.critMod.atk.value",
            "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $props.actor.data.attributes.critMod.atk.value = $event),
            disabled: $options.overrides.includes("data.attributes.critMod.atk.value")
          }, null, 8, _hoisted_34), [
            [vModelText, $props.actor.data.attributes.critMod.atk.value]
          ])
        ]),
        createElementVNode("div", _hoisted_35, [
          createElementVNode("strong", _hoisted_36, toDisplayString($setup.localize("ARCHMAGE.critModDef")), 1),
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.critMod.def.value",
            "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $props.actor.data.attributes.critMod.def.value = $event),
            disabled: $options.overrides.includes("data.attributes.critMod.def.value")
          }, null, 8, _hoisted_37), [
            [vModelText, $props.actor.data.attributes.critMod.def.value]
          ])
        ]),
        createElementVNode("div", _hoisted_38, [
          createElementVNode("strong", _hoisted_39, toDisplayString($setup.localize("ARCHMAGE.keyMod")), 1),
          withDirectives(createElementVNode("select", {
            name: "data.attributes.keyModifier.mod1",
            "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $props.actor.data.attributes.keyModifier.mod1 = $event)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList($data.abilities, (option, index) => {
              return openBlock(), createElementBlock("option", {
                key: index,
                value: option.value
              }, toDisplayString(option.label), 9, _hoisted_40);
            }), 128))
          ], 512), [
            [vModelSelect, $props.actor.data.attributes.keyModifier.mod1]
          ]),
          _hoisted_41,
          withDirectives(createElementVNode("select", {
            name: "data.attributes.keyModifier.mod2",
            "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => $props.actor.data.attributes.keyModifier.mod2 = $event)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList($data.abilities, (option, index) => {
              return openBlock(), createElementBlock("option", {
                key: index,
                value: option.value
              }, toDisplayString(option.label), 9, _hoisted_42);
            }), 128))
          ], 512), [
            [vModelSelect, $props.actor.data.attributes.keyModifier.mod2]
          ])
        ]),
        createElementVNode("div", _hoisted_43, [
          createElementVNode("div", _hoisted_44, [
            createElementVNode("strong", _hoisted_45, toDisplayString($setup.localize("ARCHMAGE.meleeWeaponDice")), 1),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: "data.attributes.weapon.melee.dice",
              "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => $props.actor.data.attributes.weapon.melee.dice = $event),
              disabled: $options.overrides.includes("data.attributes.weapon.melee.dice"),
              placeholder: "d8"
            }, null, 8, _hoisted_46), [
              [vModelText, $props.actor.data.attributes.weapon.melee.dice]
            ])
          ]),
          createElementVNode("div", _hoisted_47, [
            createElementVNode("strong", _hoisted_48, toDisplayString($setup.localize("ARCHMAGE.CHARACTERSETTINGS.shield")), 1),
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: "data.attributes.weapon.melee.shield",
              "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => $props.actor.data.attributes.weapon.melee.shield = $event)
            }, null, 512), [
              [vModelCheckbox, $props.actor.data.attributes.weapon.melee.shield]
            ])
          ]),
          createElementVNode("div", _hoisted_49, [
            createElementVNode("strong", _hoisted_50, toDisplayString($setup.localize("ARCHMAGE.CHARACTERSETTINGS.dualwield")), 1),
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: "data.attributes.weapon.melee.dualwield",
              "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => $props.actor.data.attributes.weapon.melee.dualwield = $event)
            }, null, 512), [
              [vModelCheckbox, $props.actor.data.attributes.weapon.melee.dualwield]
            ])
          ]),
          createElementVNode("div", _hoisted_51, [
            createElementVNode("strong", _hoisted_52, toDisplayString($setup.localize("ARCHMAGE.CHARACTERSETTINGS.twohanded")), 1),
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: "data.attributes.weapon.melee.twohanded",
              "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => $props.actor.data.attributes.weapon.melee.twohanded = $event)
            }, null, 512), [
              [vModelCheckbox, $props.actor.data.attributes.weapon.melee.twohanded]
            ])
          ]),
          createElementVNode("div", _hoisted_53, [
            createElementVNode("strong", _hoisted_54, toDisplayString($setup.localize("ARCHMAGE.rangedWeaponDice")), 1),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: "data.attributes.weapon.ranged.dice",
              "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => $props.actor.data.attributes.weapon.ranged.dice = $event),
              disabled: $options.overrides.includes("data.attributes.weapon.ranged.dice"),
              placeholder: "d8"
            }, null, 8, _hoisted_55), [
              [vModelText, $props.actor.data.attributes.weapon.ranged.dice]
            ])
          ]),
          createElementVNode("div", _hoisted_56, [
            createElementVNode("strong", _hoisted_57, toDisplayString($setup.localize("ARCHMAGE.jabWeaponDice")), 1),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: "data.attributes.weapon.jab.dice",
              "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => $props.actor.data.attributes.weapon.jab.dice = $event),
              disabled: $options.overrides.includes("data.attributes.weapon.jab.dice"),
              placeholder: "d6"
            }, null, 8, _hoisted_58), [
              [vModelText, $props.actor.data.attributes.weapon.jab.dice]
            ])
          ]),
          createElementVNode("div", _hoisted_59, [
            createElementVNode("strong", _hoisted_60, toDisplayString($setup.localize("ARCHMAGE.punchWeaponDice")), 1),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: "data.attributes.weapon.punch.dice",
              "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => $props.actor.data.attributes.weapon.punch.dice = $event),
              disabled: $options.overrides.includes("data.attributes.weapon.punch.dice"),
              placeholder: "d8"
            }, null, 8, _hoisted_61), [
              [vModelText, $props.actor.data.attributes.weapon.punch.dice]
            ])
          ]),
          createElementVNode("div", _hoisted_62, [
            createElementVNode("strong", _hoisted_63, toDisplayString($setup.localize("ARCHMAGE.kickWeaponDice")), 1),
            withDirectives(createElementVNode("input", {
              type: "text",
              name: "data.attributes.weapon.kick.dice",
              "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => $props.actor.data.attributes.weapon.kick.dice = $event),
              disabled: $options.overrides.includes("data.attributes.weapon.kick.dice"),
              placeholder: "d10"
            }, null, 8, _hoisted_64), [
              [vModelText, $props.actor.data.attributes.weapon.kick.dice]
            ])
          ])
        ])
      ]),
      createElementVNode("div", _hoisted_65, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($options.flags, (flag, f) => {
          return openBlock(), createElementBlock("div", {
            key: f,
            "data-key": f,
            class: "settings-flags"
          }, [
            createElementVNode("label", {
              for: $setup.concat("flags.archmage.", f),
              class: "unit-subtitle flexrow"
            }, [
              withDirectives(createElementVNode("input", {
                type: "checkbox",
                name: $setup.concat("flags.archmage.", f),
                "onUpdate:modelValue": ($event) => flag.value = $event
              }, null, 8, _hoisted_68), [
                [vModelCheckbox, flag.value]
              ]),
              createTextVNode(" " + toDisplayString(flag.name), 1)
            ], 8, _hoisted_67),
            createElementVNode("p", _hoisted_69, toDisplayString(flag.hint), 1)
          ], 8, _hoisted_66);
        }), 128))
      ]),
      createElementVNode("div", _hoisted_70, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($props.actor.data.backgrounds, (background, b) => {
          return openBlock(), createElementBlock("div", {
            key: b,
            class: "settings-background",
            "data-key": b
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.backgrounds.", b, ".isActive.value"),
              "onUpdate:modelValue": ($event) => background.isActive.value = $event
            }, null, 8, _hoisted_72), [
              [vModelCheckbox, background.isActive.value]
            ]),
            createElementVNode("strong", _hoisted_73, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHARACTERSETTINGS.", b))), 1)
          ], 8, _hoisted_71);
        }), 128))
      ]),
      createElementVNode("div", _hoisted_74, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($props.actor.data.icons, (icon, i) => {
          return openBlock(), createElementBlock("div", {
            key: i,
            class: "settings-icon",
            "data-key": i
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.icons.", i, ".isActive.value"),
              "onUpdate:modelValue": ($event) => icon.isActive.value = $event
            }, null, 8, _hoisted_76), [
              [vModelCheckbox, icon.isActive.value]
            ]),
            createElementVNode("strong", _hoisted_77, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHARACTERSETTINGS.", i))), 1)
          ], 8, _hoisted_75);
        }), 128))
      ]),
      createElementVNode("div", _hoisted_78, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($options.resourcesCustom, (resource, r) => {
          return openBlock(), createElementBlock("div", {
            key: r,
            class: "settings-resource",
            "data-key": r
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.resources.spendable.", r, ".enabled"),
              "onUpdate:modelValue": ($event) => resource.enabled = $event
            }, null, 8, _hoisted_80), [
              [vModelCheckbox, resource.enabled]
            ]),
            createElementVNode("strong", _hoisted_81, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHARACTER.RESOURCES.", r))), 1),
            _hoisted_82,
            createTextVNode(" " + toDisplayString($setup.localize($setup.concat("ARCHMAGE.RESTS.header"))) + ":\xA0 ", 1),
            withDirectives(createElementVNode("select", {
              name: $setup.concat("data.resources.spendable.", r, ".rest"),
              "onUpdate:modelValue": ($event) => resource.rest = $event
            }, [
              (openBlock(true), createElementBlock(Fragment, null, renderList($data.resourceRestTypes, (option, index) => {
                return openBlock(), createElementBlock("option", {
                  key: index,
                  value: option.value
                }, toDisplayString($setup.localize($setup.concat("ARCHMAGE.RESTS.", option.value))), 9, _hoisted_84);
              }), 128))
            ], 8, _hoisted_83), [
              [vModelSelect, resource.rest]
            ])
          ], 8, _hoisted_79);
        }), 128)),
        (openBlock(true), createElementBlock(Fragment, null, renderList($options.resourcesPerCombat, (resource, r) => {
          return openBlock(), createElementBlock("div", {
            key: r,
            class: "settings-resource",
            "data-key": r
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.resources.perCombat.", r, ".enabled"),
              "onUpdate:modelValue": ($event) => resource.enabled = $event
            }, null, 8, _hoisted_86), [
              [vModelCheckbox, resource.enabled]
            ]),
            createElementVNode("strong", _hoisted_87, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHARACTER.RESOURCES.", r))), 1)
          ], 8, _hoisted_85);
        }), 128)),
        (openBlock(true), createElementBlock(Fragment, null, renderList($options.resourcesSpendable, (resource, r) => {
          return openBlock(), createElementBlock("div", {
            key: r,
            class: "settings-resource",
            "data-key": r
          }, [
            withDirectives(createElementVNode("input", {
              type: "checkbox",
              name: $setup.concat("data.resources.spendable.", r, ".enabled"),
              "onUpdate:modelValue": ($event) => resource.enabled = $event
            }, null, 8, _hoisted_89), [
              [vModelCheckbox, resource.enabled]
            ]),
            createElementVNode("strong", _hoisted_90, toDisplayString($setup.localize($setup.concat("ARCHMAGE.CHARACTER.RESOURCES.", r))), 1)
          ], 8, _hoisted_88);
        }), 128))
      ])
    ])
  ], 2);
}
var CharSettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1]]);
const _sfc_main = {
  name: "ArchmageCharacterSheet",
  props: ["context", "actor", "owner"],
  components: {
    Tabs,
    Tab,
    CharHeader,
    CharAttributes,
    CharInitiative,
    CharAbilities,
    CharBackgrounds,
    CharIconRelationships,
    CharOut,
    CharIncrementals,
    CharResources,
    CharDetails,
    CharPowers,
    CharInventory,
    CharEffects,
    CharSettings
  },
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
          details: {
            key: "details",
            label: localize("ARCHMAGE.details"),
            active: false
          },
          powers: {
            key: "powers",
            label: localize("ARCHMAGE.powers"),
            active: true
          },
          inventory: {
            key: "inventory",
            label: localize("ARCHMAGE.inventory"),
            active: false
          },
          effects: {
            key: "effects",
            label: localize("ARCHMAGE.effects"),
            active: false
          },
          settings: {
            key: "settings",
            label: localize("ARCHMAGE.settings"),
            active: false,
            icon: "fa-cogs",
            hideLabel: true
          }
        }
      }
    };
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
const _hoisted_1 = { class: "container container--top flexcol" };
const _hoisted_2 = { class: "container container--bottom flexrow" };
const _hoisted_3 = { class: "section section--sidebar flexcol" };
const _hoisted_4 = { class: "section section--main flexcol" };
const _hoisted_5 = { class: "section section--tabs-content flexcol" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_CharHeader = resolveComponent("CharHeader");
  const _component_CharAttributes = resolveComponent("CharAttributes");
  const _component_CharInitiative = resolveComponent("CharInitiative");
  const _component_CharAbilities = resolveComponent("CharAbilities");
  const _component_CharBackgrounds = resolveComponent("CharBackgrounds");
  const _component_CharIconRelationships = resolveComponent("CharIconRelationships");
  const _component_CharOut = resolveComponent("CharOut");
  const _component_CharIncrementals = resolveComponent("CharIncrementals");
  const _component_CharResources = resolveComponent("CharResources");
  const _component_Tabs = resolveComponent("Tabs");
  const _component_CharDetails = resolveComponent("CharDetails");
  const _component_Tab = resolveComponent("Tab");
  const _component_CharPowers = resolveComponent("CharPowers");
  const _component_CharInventory = resolveComponent("CharInventory");
  const _component_CharEffects = resolveComponent("CharEffects");
  const _component_CharSettings = resolveComponent("CharSettings");
  return openBlock(), createElementBlock("div", {
    class: normalizeClass($setup.concat("archmage-v2-vue flexcol ", $options.nightmode))
  }, [
    createElementVNode("section", _hoisted_1, [
      createVNode(_component_CharHeader, { actor: $props.actor }, null, 8, ["actor"]),
      createVNode(_component_CharAttributes, { actor: $props.actor }, null, 8, ["actor"])
    ]),
    createElementVNode("section", _hoisted_2, [
      createElementVNode("section", _hoisted_3, [
        createVNode(_component_CharInitiative, { actor: $props.actor }, null, 8, ["actor"]),
        createVNode(_component_CharAbilities, { actor: $props.actor }, null, 8, ["actor"]),
        createVNode(_component_CharBackgrounds, { actor: $props.actor }, null, 8, ["actor"]),
        createVNode(_component_CharIconRelationships, { actor: $props.actor }, null, 8, ["actor"]),
        createVNode(_component_CharOut, {
          actor: $props.actor,
          owner: $props.owner
        }, null, 8, ["actor", "owner"]),
        createVNode(_component_CharIncrementals, { actor: $props.actor }, null, 8, ["actor"])
      ]),
      createElementVNode("section", _hoisted_4, [
        createVNode(_component_CharResources, { actor: $props.actor }, null, 8, ["actor"]),
        createVNode(_component_Tabs, {
          actor: $props.actor,
          group: "primary",
          tabs: $data.tabs.primary,
          flags: $options.flags
        }, null, 8, ["actor", "tabs", "flags"]),
        createElementVNode("section", _hoisted_5, [
          createVNode(_component_Tab, {
            group: "primary",
            tab: $data.tabs.primary.details
          }, {
            default: withCtx(() => [
              createVNode(_component_CharDetails, {
                actor: $props.actor,
                owner: $props.owner,
                tab: $data.tabs.primary.details,
                flags: $options.flags
              }, null, 8, ["actor", "owner", "tab", "flags"])
            ]),
            _: 1
          }, 8, ["tab"]),
          createVNode(_component_Tab, {
            group: "primary",
            tab: $data.tabs.primary.powers
          }, {
            default: withCtx(() => [
              createVNode(_component_CharPowers, {
                actor: $props.actor,
                tab: $data.tabs.primary.powers,
                flags: $options.flags
              }, null, 8, ["actor", "tab", "flags"])
            ]),
            _: 1
          }, 8, ["tab"]),
          createVNode(_component_Tab, {
            group: "primary",
            tab: $data.tabs.primary.inventory
          }, {
            default: withCtx(() => [
              createVNode(_component_CharInventory, {
                actor: $props.actor,
                tab: $data.tabs.primary.inventory,
                flags: $options.flags
              }, null, 8, ["actor", "tab", "flags"])
            ]),
            _: 1
          }, 8, ["tab"]),
          createVNode(_component_Tab, {
            group: "primary",
            tab: $data.tabs.primary.effects
          }, {
            default: withCtx(() => [
              createVNode(_component_CharEffects, {
                actor: $props.actor,
                tab: $data.tabs.primary.effects,
                flags: $options.flags
              }, null, 8, ["actor", "tab", "flags"])
            ]),
            _: 1
          }, 8, ["tab"]),
          createVNode(_component_Tab, {
            group: "primary",
            tab: $data.tabs.primary.settings
          }, {
            default: withCtx(() => [
              createVNode(_component_CharSettings, {
                actor: $props.actor,
                tab: $data.tabs.primary.settings
              }, null, 8, ["actor", "tab"])
            ]),
            _: 1
          }, 8, ["tab"])
        ])
      ])
    ])
  ], 2);
}
var ArchmageCharacterSheet = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export { ArchmageCharacterSheet, Editor, Tab, Tabs };
//# sourceMappingURL=components.vue.es.js.map