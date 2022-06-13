import { openBlock, createElementBlock, createElementVNode, toDisplayString, withDirectives, vModelText, normalizeClass, normalizeStyle, createCommentVNode, resolveComponent, createVNode, vModelCheckbox, pushScopeId, popScopeId, Fragment, renderList, renderSlot } from "../scripts/lib/vue.esm-browser.js";
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
const _sfc_main$6 = {
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
const _hoisted_1$6 = { class: "header character-header grid grid-4col" };
const _hoisted_2$4 = { class: "unit unit--abs-label unit--name" };
const _hoisted_3$2 = { for: "name" };
const _hoisted_4$2 = { class: "unit unit--abs-label unit--race" };
const _hoisted_5$2 = { for: "data.details.race.value" };
const _hoisted_6$2 = { class: "unit unit--abs-label unit--class" };
const _hoisted_7$1 = { for: "data.details.class.value" };
const _hoisted_8$1 = { class: "unit unit--abs-label unit--level" };
const _hoisted_9$1 = { for: "data.attributes.level.value" };
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("header", _hoisted_1$6, [
    createElementVNode("div", _hoisted_2$4, [
      createElementVNode("label", _hoisted_3$2, toDisplayString($setup.localize("ARCHMAGE.name")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "name",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.name = $event)
      }, null, 512), [
        [vModelText, $props.actor.name]
      ])
    ]),
    createElementVNode("div", _hoisted_4$2, [
      createElementVNode("label", _hoisted_5$2, toDisplayString($setup.localize("ARCHMAGE.race")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.race.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.details.race.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.race.value]
      ])
    ]),
    createElementVNode("div", _hoisted_6$2, [
      createElementVNode("label", _hoisted_7$1, toDisplayString($setup.localize("ARCHMAGE.class")), 1),
      withDirectives(createElementVNode("input", {
        type: "text",
        name: "data.details.class.value",
        class: "input-secondary",
        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $props.actor.data.details.class.value = $event)
      }, null, 512), [
        [vModelText, $props.actor.data.details.class.value]
      ])
    ]),
    createElementVNode("div", _hoisted_8$1, [
      createElementVNode("label", _hoisted_9$1, toDisplayString($setup.localize("ARCHMAGE.level")), 1),
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
var CharHeader = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6]]);
const _sfc_main$5 = {
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
const _hoisted_1$5 = /* @__PURE__ */ createElementVNode("div", { class: "progress-track" }, null, -1);
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", {
    class: normalizeClass($setup.concat("progress-bar progress-bar--", $props.name))
  }, [
    _hoisted_1$5,
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
var Progress = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5]]);
const _sfc_main$4 = {
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
const _hoisted_1$4 = { class: "section section--attributes flexrow" };
const _hoisted_2$3 = { class: "unit unit--img profile-img" };
const _hoisted_3$1 = ["src", "alt", "width", "height"];
const _hoisted_4$1 = { class: "unit unit--attributes grid grid-5col border-both" };
const _hoisted_5$1 = { class: "unit unit--has-max unit--hp" };
const _hoisted_6$1 = { class: "unit-title" };
const _hoisted_7 = { class: "resource flexrow" };
const _hoisted_8 = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_9 = {
  key: 0,
  class: "resource-max"
};
const _hoisted_10 = { class: "labeled-input flexrow" };
const _hoisted_11 = {
  for: "data.attributes.hp.temp",
  class: "unit-subtitle"
};
const _hoisted_12 = { class: "unit unit--defenses" };
const _hoisted_13 = { class: "unit-title" };
const _hoisted_14 = { class: "defenses grid grid-3col" };
const _hoisted_15 = { class: "defense defense--ac flexcol" };
const _hoisted_16 = { class: "defense-value" };
const _hoisted_17 = ["title"];
const _hoisted_18 = { class: "defense defense--pd flexcol" };
const _hoisted_19 = { class: "defense-value" };
const _hoisted_20 = ["title"];
const _hoisted_21 = { class: "defense defense--md flexcol" };
const _hoisted_22 = { class: "defense-value" };
const _hoisted_23 = ["title"];
const _hoisted_24 = { class: "unit unit--has-max unit--recoveries" };
const _hoisted_25 = { class: "unit-title" };
const _hoisted_26 = { class: "resource flexrow" };
const _hoisted_27 = /* @__PURE__ */ createElementVNode("span", { class: "resource-separator" }, "/", -1);
const _hoisted_28 = {
  key: 0,
  class: "resource-max"
};
const _hoisted_29 = { class: "roll" };
const _hoisted_30 = {
  class: "rollable rollable--recover",
  "data-roll-type": "recovery"
};
const _hoisted_31 = { class: "unit unit--saves flexcol" };
const _hoisted_32 = { class: "unit-title" };
const _hoisted_33 = { class: "saves flexcol" };
const _hoisted_34 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "easy"
};
const _hoisted_35 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "normal"
};
const _hoisted_36 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "hard"
};
const _hoisted_37 = { class: "unit unit--death" };
const _hoisted_38 = { class: "dividers flexcol" };
const _hoisted_39 = { class: "death-saves" };
const _hoisted_40 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "death"
};
const _hoisted_41 = { class: "death-save-attempts flexrow" };
const _hoisted_42 = { class: "last-gasp-saves" };
const _hoisted_43 = {
  class: "rollable rollable--save",
  "data-roll-type": "save",
  "data-roll-opt": "lastGasp"
};
const _hoisted_44 = { class: "lastgasp-save-attempts flexrow" };
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Progress = resolveComponent("Progress");
  return openBlock(), createElementBlock("section", _hoisted_1$4, [
    createElementVNode("div", _hoisted_2$3, [
      createElementVNode("img", {
        src: $props.actor.img,
        ref: "avatar",
        alt: $setup.localize("ARCHMAGE.avatarAlt"),
        width: $data.avatarWidth,
        height: $data.avatarHeight,
        class: normalizeClass($data.avatarClass),
        "data-edit": "img"
      }, null, 10, _hoisted_3$1)
    ]),
    createElementVNode("div", _hoisted_4$1, [
      createElementVNode("div", _hoisted_5$1, [
        createElementVNode("h2", _hoisted_6$1, toDisplayString($setup.localize("ARCHMAGE.hitPoints")), 1),
        createVNode(_component_Progress, {
          name: "hp",
          current: $props.actor.data.attributes.hp.value,
          temp: $props.actor.data.attributes.hp.temp,
          max: $props.actor.data.attributes.hp.max
        }, null, 8, ["current", "temp", "max"]),
        createElementVNode("div", _hoisted_7, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.hp.value",
            class: "resource-current",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $props.actor.data.attributes.hp.value = $event)
          }, null, 512), [
            [vModelText, $props.actor.data.attributes.hp.value]
          ]),
          _hoisted_8,
          $props.actor.data.attributes.hp.automatic ? (openBlock(), createElementBlock("div", _hoisted_9, toDisplayString($props.actor.data.attributes.hp.max), 1)) : withDirectives((openBlock(), createElementBlock("input", {
            key: 1,
            type: "number",
            name: "data.attributes.hp.max",
            class: "resource-max",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $props.actor.data.attributes.hp.max = $event)
          }, null, 512)), [
            [vModelText, $props.actor.data.attributes.hp.max]
          ])
        ]),
        createElementVNode("div", _hoisted_10, [
          createElementVNode("label", _hoisted_11, toDisplayString($setup.localize("ARCHMAGE.tempHp")), 1),
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
      createElementVNode("div", _hoisted_12, [
        createElementVNode("h2", _hoisted_13, toDisplayString($setup.localize("ARCHMAGE.defenses")), 1),
        createElementVNode("div", _hoisted_14, [
          createElementVNode("div", _hoisted_15, [
            createElementVNode("span", _hoisted_16, toDisplayString($props.actor.data.attributes.ac.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.ac.label"), " (", $setup.localize("ARCHMAGE.ac.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.ac.key")), 9, _hoisted_17)
          ]),
          createElementVNode("div", _hoisted_18, [
            createElementVNode("span", _hoisted_19, toDisplayString($props.actor.data.attributes.pd.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.pd.label"), " (", $setup.localize("ARCHMAGE.pd.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.pd.key")), 9, _hoisted_20)
          ]),
          createElementVNode("div", _hoisted_21, [
            createElementVNode("span", _hoisted_22, toDisplayString($props.actor.data.attributes.md.value), 1),
            createElementVNode("h3", {
              class: "unit-subtitle",
              title: $setup.concat($setup.localize("ARCHMAGE.md.label"), " (", $setup.localize("ARCHMAGE.md.stats"), ")")
            }, toDisplayString($setup.localize("ARCHMAGE.md.key")), 9, _hoisted_23)
          ])
        ])
      ]),
      createElementVNode("div", _hoisted_24, [
        createElementVNode("h2", _hoisted_25, toDisplayString($setup.localize("ARCHMAGE.recoveries")), 1),
        createVNode(_component_Progress, {
          name: "recoveries",
          current: $props.actor.data.attributes.recoveries.value,
          max: $props.actor.data.attributes.recoveries.max
        }, null, 8, ["current", "max"]),
        createElementVNode("div", _hoisted_26, [
          withDirectives(createElementVNode("input", {
            type: "number",
            name: "data.attributes.recoveries.value",
            class: "resource-current",
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $props.actor.data.attributes.recoveries.value = $event)
          }, null, 512), [
            [vModelText, $props.actor.data.attributes.recoveries.value]
          ]),
          _hoisted_27,
          $props.actor.data.attributes.recoveries.automatic ? (openBlock(), createElementBlock("div", _hoisted_28, toDisplayString($props.actor.data.attributes.recoveries.max), 1)) : withDirectives((openBlock(), createElementBlock("input", {
            key: 1,
            type: "number",
            name: "data.attributes.recoveries.max",
            class: "resource-max",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $props.actor.data.attributes.recoveries.max = $event)
          }, null, 512)), [
            [vModelText, $props.actor.data.attributes.recoveries.max]
          ])
        ]),
        createElementVNode("div", _hoisted_29, [
          createElementVNode("a", _hoisted_30, toDisplayString($props.actor.data.attributes.level.value) + toDisplayString($props.actor.data.attributes.recoveries.dice) + "+" + toDisplayString($props.actor.data.abilities.con.dmg) + " (" + toDisplayString($props.actor.data.attributes.recoveries.avg) + ")", 1)
        ])
      ]),
      createElementVNode("div", _hoisted_31, [
        createElementVNode("h2", _hoisted_32, toDisplayString($setup.localize("ARCHMAGE.saves")), 1),
        createElementVNode("div", _hoisted_33, [
          createElementVNode("a", _hoisted_34, "6+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.easyShort")) + ")", 1),
          createElementVNode("a", _hoisted_35, "11+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.normalShort")) + ")", 1),
          createElementVNode("a", _hoisted_36, "16+ (" + toDisplayString($setup.localize("ARCHMAGE.SAVE.hardShort")) + ")", 1)
        ])
      ]),
      createElementVNode("div", _hoisted_37, [
        createElementVNode("div", _hoisted_38, [
          createElementVNode("div", _hoisted_39, [
            createElementVNode("a", _hoisted_40, toDisplayString($setup.localize("ARCHMAGE.SAVE.death")), 1),
            createElementVNode("div", _hoisted_41, [
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
          createElementVNode("div", _hoisted_42, [
            createElementVNode("a", _hoisted_43, toDisplayString($setup.localize("ARCHMAGE.SAVE.lastGasp")), 1),
            createElementVNode("div", _hoisted_44, [
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
var CharAttributes = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4]]);
const _sfc_main$3 = {
  name: "ArchmageCharacterSheet",
  props: ["context", "actor", "owner"],
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
    CharHeader,
    CharAttributes
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
  const _component_CharHeader = resolveComponent("CharHeader");
  const _component_CharAttributes = resolveComponent("CharAttributes");
  return openBlock(), createElementBlock("div", {
    class: normalizeClass($setup.concat("archmage-v2-vue flexcol ", $options.nightmode))
  }, [
    createElementVNode("section", _hoisted_1$3, [
      createVNode(_component_CharHeader, { actor: $props.actor }, null, 8, ["actor"]),
      createVNode(_component_CharAttributes, { actor: $props.actor }, null, 8, ["actor"])
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
