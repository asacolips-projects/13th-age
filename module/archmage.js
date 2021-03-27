import { ARCHMAGE } from './setup/config.js';
import { ActorArchmage, archmagePreUpdateCharacterData } from './actor/actor.js';
import { ActorArchmageSheet } from './actor/actor-sheet.js';
import { ActorArchmageNPCSheet } from './actor/actor-npc-sheet.js';
import { ActorArchmageSheetV2 } from './actor/actor-sheet-v2.js';
import { ItemArchmage } from './item/item.js';
import { ItemArchmageSheet } from './item/item-sheet.js';
import { ArchmageUtility } from './setup/utility-classes.js';
import { ArchmageReference } from './setup/utility-classes.js';
import { ContextMenu2 } from './setup/contextMenu2.js';
import { DamageApplicator } from './setup/damageApplicator.js';
import { DiceArchmage } from './actor/dice.js';
import { preloadHandlebarsTemplates } from "./setup/templates.js";
import { TourGuide } from './tours/tourguide.js';
import { ActorHelpersV2 } from './actor/helpers/actor-helpers-v2.js';
import preCreateChatMessageHandler from "./hooks/preCreateChatMessageHandler.mjs";

Hooks.once('init', async function() {

  let dependencies = typeof Dlopen !== 'undefined';

  // CONFIG.debug.hooks = true;

  String.prototype.safeCSSId = function() {
    return encodeURIComponent(
      this.toLowerCase()
    ).replace(/%[0-9A-F]{2}/gi, '-');
  }

  // Preload template partials.
  preloadHandlebarsTemplates();

  Handlebars.registerHelper('safeCSSId', (arg) => {
    return `${arg}`.safeCSSId();
  });

  Handlebars.registerHelper('getPowerClass', (inputString) => {
    // Get the appropriate usage.
    let usage = 'other';
    let usageString = inputString !== null ? inputString.toLowerCase() : '';
    if (usageString.includes('will')) {
      usage = 'at-will';
    }
    else if (usageString.includes('recharge')) {
      usage = 'recharge';
    }
    else if (usageString.includes('battle')) {
      usage = 'once-per-battle';
    }
    else if (usageString.includes('daily')) {
      usage = 'daily';
    }

    return usage;
  });

  Handlebars.registerHelper('concatenate', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('hideBasedOnSystemSetting', () => {
    if (game.settings.get("archmage", "hideInsteadOfOpaque")) {
      return "hide";
    }
    return "";
  });

  game.archmage = {
    ActorArchmage,
    ActorArchmageSheet,
    ActorArchmageNPCSheet,
    DiceArchmage,
    ItemArchmage,
    ItemArchmageSheet,
    ArchmageUtility,
    rollItemMacro,
    ActorHelpersV2
  };

  // Replace sheets.
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("archmage", ItemArchmageSheet, { makeDefault: true });

  CONFIG.ARCHMAGE = ARCHMAGE;

  // Assign the actor class to the CONFIG
  CONFIG.Actor.entityClass = ActorArchmage;

  // Assign ItemArchmage class to CONFIG
  CONFIG.Item.entityClass = ItemArchmage;

  // Override CONFIG
  CONFIG.Item.sheetClass = ItemArchmageSheet;

  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('archmage', ActorArchmageSheet, {
    label: "V1 Character Sheet",
    types: ["character"],
    makeDefault: true
  });

  Actors.registerSheet("archmage", ActorArchmageNPCSheet, {
    label: "NPC Sheet",
    types: ["npc"],
    makeDefault: true
  });

  if (dependencies) {
    // V2 actor sheet (See issue #118).
    Actors.registerSheet("archmage", ActorArchmageSheetV2, {
      label: "V2 Character Sheet",
      types: ["character"],
      makeDefault: false
    });
  }

  /* -------------------------------------------- */
  CONFIG.Actor.characterFlags = {
    "initiativeAdv": {
      name: "Quick to Fight",
      hint: "Human racial feat to roll 2d20 for initiative and keep the higher roll.",
      section: "Feats",
      type: Boolean
    },
    "improvedIniative": {
      name: "Improved Initiative",
      hint: "General feat to increase initiative by +4.",
      section: "Feats",
      type: Boolean
    },
    "strongRecovery": {
      name: "Strong Recovery",
      hint: "General feat to reroll some of your recovery die, keeping highest. Doesn't apply when taking average recoveries.",
      section: "Feats",
      type: Boolean
    },
    "toughness": {
      name: "Toughness",
      hint: "General feat to increase your max HP based on your base HP",
      section: "Feats",
      type: Boolean
    },
    "averageRecoveries": {
      name: "Average Recovery Rolls",
      hint: "Average results for recovery rolls instead of rolling them.",
      section: "Dice",
      type: Boolean
    },
    "portraitRound": {
      name: "Round Portrait",
      hint: "Whether or not the character portrait is rounded on the V2 sheet.",
      section: "Sheet",
      type: Boolean
    },
    "portraitFrame": {
      name: "Portrait Frame",
      hint: "Whether or not the character portrait has a white frame and shadow on the V2 sheet.",
      section: "Sheet",
      type: Boolean
    },
    "nightmode": {
      name: "Night Mode",
      hint: "Reverse the sheet color scheme into a darkened night mode.",
      section: "Sheet",
      type: Boolean
    }
  };

  /**
   * Register Initiative formula setting
   */
  function _setArchmageInitiative(tiebreaker) {
    CONFIG.Combat.initiative.tiebreaker = tiebreaker;
    CONFIG.Combat.initiative.decimals = tiebreaker ? 2 : 0;
    if (ui.combat && ui.combat._rendered) ui.combat.render();
  }
  game.settings.register('archmage', 'initiativeDexTiebreaker', {
    name: 'Initiative Dex Tiebreaker',
    hint: 'Whether or not to break iniative ties with dexterity scores.',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
    onChange: enable => _setArchmageInitiative(enable)
  });
  _setArchmageInitiative(game.settings.get('archmage', 'initiativeDexTiebreaker'));
  // Macro shorthand
  game.settings.register("archmage", "macroShorthand", {
    name: "Shortened Macro Syntax",
    hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("archmage", "hideInsteadOfOpaque", {
    name: "Hide inactive Features / Triggers instead of making them faded-out",
    hint: "Enable this if you prefer not seeing inactive details at all",
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('archmage', 'roundUpDamageApplication', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.RoundUpDamageApplicationName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.RoundUpDamageApplicationHint"),
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register('archmage', 'rechargeOncePerDay', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.rechargeOncePerDayName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.rechargeOncePerDayHint"),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register('archmage', 'automatePowerCost', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.automatePowerCostName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.automatePowerCostHint"),
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register('archmage', 'originalCritDamage', {
    name: 'Double damage result on critical hit',
    hint: 'Whether or not to double the damage roll result on critical hit instead of rolling double the number of damage dice.',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register('archmage', 'unboundEscDie', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.UnboundEscDieName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.UnboundEscDieHint"),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register('archmage', 'automateBaseStatsFromClass', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.automateBaseStatsFromClassName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.automateBaseStatsFromClassHint"),
    scope: 'client',
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register('archmage', 'lastTourVersion', {
    scope: 'client',
    config: false,
    default: "1.6.0",
    type: String,
  });

  game.settings.register('archmage', 'tourVisibility', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.tourVisibilityName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.tourVisibilityHint"),
    scope: 'world',
    config: true,
    default: 'all',
    type: String,
    choices: {
      all: game.i18n.localize('ARCHMAGE.SETTINGS.tourVisibilityAll'),
      gm: game.i18n.localize('ARCHMAGE.SETTINGS.tourVisibilityGM'),
      off: game.i18n.localize('ARCHMAGE.SETTINGS.tourVisibilityOff'),
    }
  });

  game.settings.register('archmage', 'colorBlindMode', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.ColorblindName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.ColorblindHint"),
    scope: 'client',
    config: true,
    default: 'default',
    type: String,
    choices: {
      default: game.i18n.localize("ARCHMAGE.SETTINGS.ColorblindOptionDefault"),
      colorBlindRG: game.i18n.localize("ARCHMAGE.SETTINGS.ColorblindOptioncolorBlindRG"),
      colorBlindBY: game.i18n.localize("ARCHMAGE.SETTINGS.ColorblindOptioncolorBlindBY"),
      // custom: game.i18n.localize("ARCHMAGE.SETTINGS.Custom"),
    },
    onChange: () => {
      $('body').removeClass(['default', 'colorBlindRG', 'colorBlindBY', 'custom']).addClass(game.settings.get('archmage', 'colorBlindMode'));
    }
  });
  //Adding the colorblind mode class at startup
  $('body').addClass(game.settings.get('archmage', 'colorBlindMode'));

  /**
   * Override the default Initiative formula to customize special behaviors of the D&D5e system.
   * Apply advantage, proficiency, or bonuses where appropriate
   * Apply the dexterity score as a decimal tiebreaker if requested
   * See Combat._getInitiativeFormula for more detail.
   * @private
   */
  Combat.prototype._getInitiativeFormula = function(combatant) {
    const actor = combatant.actor;
    if (!actor) return "1d20";
    const init = actor.data.data.attributes.init;
    // Init mod includes dex + level + misc bonuses.
    const parts = ["1d20", init.mod];
    if (actor.getFlag("archmage", "initiativeAdv")) parts[0] = "2d20kh";
    if (CONFIG.Combat.initiative.tiebreaker) parts.push(actor.data.data.abilities.dex.value / 100);
    return parts.filter(p => p !== null).join(" + ");
  }

  ArchmageUtility.replaceRollData();

  /* --------------------------------------------- */
  if (CONST.AIP && CONFIG.AIP) {
    // Autocomplete Inline Rolls
    const aipKeys = [
      'str',
      'dex',
      'con',
      'int',
      'wis',
      'cha',
      'ac',
      'pd',
      'md',
      'hp',
      'recoveries',
      'wpn.m',
      'wpn.r',
      'wpn.p',
      'wpn.k',
      'wpn.j'
    ];
    let filteredKeys = [
      'standardBonuses',
      'out',
      'incrementals',
      'icons',
      'details',
      'coins',
      'backgrounds',
      'attr',
      'attributes',
      'abilities',
      'abil',
      'tier',
      'sheetGrouping',
      'disengage',
    ];
    aipKeys.forEach(k => {
      filteredKeys.push(`${k}.type`);
      filteredKeys.push(`${k}.label`);
    });
    const AIP = {
      packageName: 'archmage',
      sheetClasses: [
        {
          name: "ItemArchmageSheet",
          fieldConfigs: [
            {
              selector: '.archmage-aip input[type="text"]',
              showButton: true,
              allowHotkey: true,
              dataMode: CONST.AIP.DATA_MODE.OWNING_ACTOR_ROLL_DATA,
              filteredKeys: filteredKeys
            }
          ]
        }
      ]
    };
    CONFIG.AIP.PACKAGE_CONFIG.push(AIP);
  }

  // Dlopen.register('vue-select', {
  //   scripts: [
  //       // "https://unpkg.com/classnames@2.2.6/index.js", // can't load it this way because of the classnames/classNames issue in the file definition
  //       "https://unpkg.com/vue-select@3.0.0"
  //   ],
  //   styles: [
  //       "https://unpkg.com/vue-select@3.0.0/dist/vue-select.css"
  //   ],
  //   dependencies: [],
  //   init: () => Vue.component("v-select", VueSelect.default)
  // });

  // Dlopen.register('vue-numeric-input', {
  //   scripts: [
  //       // "https://unpkg.com/classnames@2.2.6/index.js", // can't load it this way because of the classnames/classNames issue in the file definition
  //       "https://unpkg.com/vue-numeric-input"
  //   ],
  //   styles: [],
  //   dependencies: [],
  //   init: () => Vue.component(VueNumericInput.default.name, VueNumericInput.default)
  // });

  // Dlopen.register('vue-wysiwyg', {
  //   scripts: [
  //       // "https://unpkg.com/classnames@2.2.6/index.js", // can't load it this way because of the classnames/classNames issue in the file definition
  //       "https://unpkg.com/vue-wysiwyg"
  //   ],
  //   styles: [],
  //   dependencies: [],
  //   // init: () => Vue.component('v-wysiwyg', vueWysiwyg.default)
  //   init: () => Vue.use(vueWysiwyg, {})
  // });

  if (dependencies) {
    // Define dependency on our own custom vue components for when we need it
    Dlopen.register('actor-sheet', {
      scripts: "/systems/archmage/dist/vue-components.min.js",
      // dependencies: [ "vue-select", "vue-numeric-input" ]
    });
  }
});

Hooks.on('createItem', (data, options, id) => {
  // TODO: create default images.
  // let item = data;
  // let type = item.data.type;
  // let img = CONFIG.ARCHMAGE.defaultTokens[type] ? CONFIG.ARCHMAGE.defaultTokens[type] : CONFIG.DEFAULT_TOKEN;
  // item.data.img = img;
});

/* ---------------------------------------------- */

Hooks.once('ready', () => {
  let escalation = ArchmageUtility.getEscalation();
  let hide = game.combats.entities.length < 1 || escalation === 0 ? ' hide' : '';
  $('body').append(`<div class="archmage-escalation${hide}"><div class="ed-number">${escalation}</div><div class="ed-controls"><button class="ed-control ed-plus">+</button><button class="ed-control ed-minus">-</button></div></div>`);
  $('body').append('<div class="archmage-preload"></div>');

  // Add click events for ed.
  $('body').on('click', '.ed-control', (event) => {
    let $self = $(event.currentTarget);
    let isIncrease = $self.hasClass('ed-plus');
    ArchmageUtility.setEscalationOffset(game.combat, isIncrease);
  });

  // Wait to register the hotbar macros until ready.
  Hooks.on("hotbarDrop", (bar, data, slot) => createArchmageMacro(data, slot));

  $('.message').off("contextmenu");

  let modules = {};
  modules.dlopen = game.modules.get('dlopen');
  modules.vueport = game.modules.get('vueport');

  let dependencies = true;

  if (!modules.dlopen || !modules.vueport) {
    ui.notifications.error('The <strong>vueport</strong> and <strong>dlopen</strong> modules are required for the V2 character sheet to be available.');
    dependencies = false;
  }

  if ((modules.dlopen && !modules.dlopen.active)
   || (modules.vueport && !modules.vueport.active)) {
    let moduleSettings = game.settings.get('core', 'moduleConfiguration');
    moduleSettings['dlopen'] = true;
    moduleSettings['vueport'] = true;
    game.settings.set('core', 'moduleConfiguration', moduleSettings);
    dependencies = false;
  }

  if (dependencies && typeof Dlopen !== 'undefined') {
    // Preload Vue dependencies.
    Dlopen.loadDependencies([
      'vue',
      // 'vue-select',
      // 'vue-numeric-input',
      // 'vue-wysiwyg',
      'actor-sheet'
    ]);
  }

});

/* ---------------------------------------------- */

Hooks.on("renderSettings", (app, html) => {
  let button = $(`<button id="archmage-reference-btn" data-action="archmage-help"><i class="fas fa-dice-d20"></i> Attributes and Inline Rolls Reference</button>`);
  html.find('button[data-action="controls"]').after(button);

  button.on('click', ev => {
    ev.preventDefault();
    new ArchmageReference().render(true);
  });

  // Reset Tours
  let players = html.find("button[data-action='players']");
  $(`<button data-action="resettours"><i class="fas fa-hiking" aria-hidden="true"></i>Reset Feature Tours</button>`).insertAfter(players);
  html.find('button[data-action="resettours"]').click(ev => {
    game.settings.set("archmage", "lastTourVersion", "0.0.0");
    location.reload();
  });

  let helpButton = $(`<button id="archmage-help-btn" data-action="archmage-help"><i class="fas fa-question-circle"></i> System Documentation</button>`);
  html.find('button[data-action="controls"]').after(helpButton);

  helpButton.on('click', ev => {
    ev.preventDefault();
    window.open('https://asacolips.gitbook.io/toolkit13-system/', 'archmageHelp', 'width=1032,height=720');
  });


  // This is intentionally in renderSettings, as it is one of the last bits of HTML to get rendered, which is required for the Tour to hook in
  let tourVisibility = game.settings.get('archmage', 'tourVisibility');
  let showTours = tourVisibility !== 'off' ? true : false;

  if (tourVisibility == 'gm' && !game.user.isGM) {
    showTours = false;
  }

  if (showTours) {
    let tourGuide = new TourGuide();
    tourGuide.startNewFeatureTours();
  }
});

Hooks.on('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: "archmage", name: "Archmage" }, true);

  // dice3d.addDicePreset({
  //   type: "d20",
  //   labels: [
  //     "1",
  //     "2",
  //     "3",
  //     "4",
  //     "5",
  //     "6",
  //     "7",
  //     "8",
  //     "9",
  //     "10",
  //     "11",
  //     "12",
  //     "13",
  //     "14",
  //     "15",
  //     "16",
  //     "17",
  //     "18",
  //     "19",
  //     "20"
  //   ],
  //   system: "archmage"
  // });

  dice3d.addTexture("archmagered", {
    name: "Archmage Red",
    composite: "source-over",
    source: "systems/archmage/images/redTexture.png"
  })
    .then(() => {
      dice3d.addColorset({
        name: 'archmage',
        description: "Archmage Red/Gold",
        category: "Archmage",
        background: ["#9F8"],
        texture: 'archmagered',
        edge: '#9F8003',
        foreground: '#9F8003',
        default: true
      });
    });

});

// Hijack compendium search.
Hooks.on('renderCompendium', async (compendium, html, options) => {
  let compendiumContent = null;
  let newOptions = duplicate(options);
  newOptions.index = {};
  if (compendium.metadata.entity == 'Item') {
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    classList.push('races');
    let classRegex = new RegExp(classList.join('|'), 'g');
    if (compendium.metadata.name.match(classRegex)) {
      // Hide the original compendium.
      html.find('.compendium').addClass('overrides');
      compendiumContent = await compendium.getContent();
      compendiumContent.forEach(p => {
        let option = options.index.find(o => o._id == p._id);
        let data = p.data.data;
        option.search = {
          level: data.powerLevel ? data.powerLevel.value : null,
          usage: data.powerUsage?.value ? data.powerUsage.value : 'other',
          type: data.powerType ? data.powerType.value : 'other',
          action: data.actionType ? data.actionType.value : null,
        };
      }, {});
    }

    newOptions.index = duplicate(options).index.reduce((groups, option) => {
      if (option._id) {
        let group = option.search.type ? option.search.type : 'other';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
      }
      return groups;
    }, {});
  }
  if (compendium.metadata.entity == 'Actor') {
    // Hide the original compendium.
    html.find('.compendium').addClass('overrides');
    // Build a search index.
    compendiumContent = await compendium.getContent();
    compendiumContent.forEach(m => {
      let option = options.index.find(o => o._id == m._id);
      let data = m.data.data;
      option.search = {
        level: data.details.level ? data.details.level.value : null,
        class: data.details.class.value ? data.details.class.value : null,
        race: data.details.race.value ? data.details.race.value : null,
        size: data.details.size ? data.details.size.value : null,
        role: data.details.role ? data.details.role.value : null,
        type: data.details.type ? data.details.type.value : 'other',
      };
    });
    newOptions.index = duplicate(options).index.reduce((groups, option) => {
      if (option._id) {
        // console.log(option);
        let group = option.search.type ? option.search.type : 'other';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
      }
      return groups;
    }, {});
  }

  if (compendiumContent) {
    // Sort the options.
    for (let [groupKey, group] of Object.entries(newOptions.index)) {
      group.sort((a, b) => a.search.level - b.search.level);
    }
    // Replace the markup.
    html.find('.directory-list').remove();
    let template = 'systems/archmage/templates/sidebar/apps/compendium.html';
    let content = await renderTemplate(template, newOptions);
    html.find('.directory-header').after(content);

    // Handle search filtering.
    html.find('input[name="search"]').off('keyup');
    html.find('input[name="search"]').on('keyup', event => {
      // Close all directories.
      html.find('.entry-group + .directory-list--archmage').addClass('hidden');
      let searchString = event.target.value

      const query = new RegExp(RegExp.escape(searchString), "i");
      html.find('li.directory-item').each((i, li) => {
        // Show the matches, and open their directory.
        let name = li.getElementsByClassName('entry-name')[0].textContent;
        if (searchString != '' && query.test(name)) {
          li.style.display = 'flex';
          $(li).parents('.directory-list--archmage').removeClass('hidden');
        }
        // Hide non-matches.
        else {
          li.style.display = 'none';
        }
      });
      options.searchString = searchString;
    });

    // Handle sheet opening.
    html.find('.entry-name').click(ev => {
      let li = ev.currentTarget.parentElement;
      compendium.getEntity(li.dataset.entryId).then(entity => {
        entity.sheet.render(true);
      });
    });

    // Handle lazy loading images.
    let lazyCallback = (entries, observer) => {
      for (let e of entries) {
        if (!e.isIntersecting) continue;
        const li = e.target;

        // Background Image
        if (li.dataset.backgroundImage) {
          li.style["background-image"] = `url("${li.dataset.backgroundImage}")`;
          delete li.dataset.backgroundImage;
        }

        // Avatar image
        const img = li.querySelector("img");
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }

        // No longer observe the target
        observer.unobserve(e.target);
      }
    }

    const directory = html.find('.directory-list');
    const entries = directory.find('.directory-item');

    const observer = new IntersectionObserver(lazyCallback, { root: directory[0] });
    entries.each((i, li) => observer.observe(li));

    // Handle dragdrop.
    const dragDrop = new DragDrop(compendium.options.dragDrop[0]);
    dragDrop.bind(html[0]);

    // Handle folder toggles.
    html.find('.entry-group').on('click', event => {
      event.preventDefault();
      let key = $(event.currentTarget).data('key');
      $(event.currentTarget).toggleClass('hidden');
      html.find(`.directory-item[data-key="${key}"]`).css('display', $(event.currentTarget).hasClass('hidden') ? 'none' : 'flex');
      return false;
    })
  }
});

/* ---------------------------------------------- */
Hooks.on('preCreateToken', async (scene, data, options, id) => {
  let actorId = data.actorId;
  // Attempt to get the actor.
  let actor = game.actors.get(actorId);

  // If there's an actor, set the token size.
  if (actor) {
    let size = actor.data.data.details.size?.value;
    if (size == 'large') {
      data.height = 2;
      data.width = 2;
    }
    if (size == 'huge') {
      data.height = 3;
      data.width = 3;
    }
  }
});

Hooks.on('preUpdateActor', archmagePreUpdateCharacterData);

/* ---------------------------------------------- */

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parse inline rolls.
 */
Hooks.on('preCreateChatMessage', (data, options, userId) => {
  preCreateChatMessageHandler.handle(data, options, userId);
});

// Override the inline roll click behavior.
Hooks.on('renderChatMessage', (chatMessage, html, options) => {
  html.find('a.inline-roll').addClass('inline-roll--archmage').removeClass('inline-roll');

  html.find('.inline-roll--archmage').each(function() {
    var uuid = uuidv4();
    // Add a way to uniquely identify this roll
    $(this).addClass(uuid);
    $(this).off("contextmenu");

    // console.log($(this).parent()[0].innerText);
    if ($(this).parent()[0].innerText.includes("Target: ") || $(this).parent()[0].innerText.includes("Attack: ")) {
      return;
    }

    new ContextMenu2($(this).parent(), "." + uuid, [
      {
        name: "Apply as Damage",
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 1);
        }
      },
      {
        name: "Apply as Half Damage",
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, .5);
        }
      },
      {
        name: "Apply as Double Damage",
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 2);
        }
      },
      {
        name: "Apply as Triple Damage",
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 3);
        }
      },
      {
        name: "Apply as Healing",
        icon: '<i class="fas fa-medkit"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asHealing(inlineRoll);
        }
      },
      {
        name: "Apply as Temp Health",
        icon: '<i class="fas fa-heart"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asTempHealth(inlineRoll);
        }
      }
    ]);
  });
  html.find('a.inline-roll--archmage').on('click', event => {
    event.preventDefault();
    const a = event.currentTarget;

    // For inline results expand or collapse the roll details
    if (a.classList.contains("inline-result")) {
      const roll = Roll.fromJSON(unescape(a.dataset.roll));
      //////////////////////////////////////////////////////////////////////////
      //////////////// DEPRECATED CODE - 0.6.X COMPATIBILITY ///////////////////
      //////////////////////////////////////////////////////////////////////////
      if (!isNewerVersion(game.data.version, "0.7")) {
        // Build a die string of the die parts, including whether they're discarded.
        const dieTotal = roll.parts.reduce((string, r) => {
          if (typeof string == 'object') {
            string = '';
          }

          if (r.rolls) {
            string = `${string}${r.rolls.map(d => `<span class="${d.discarded || d.rerolled ? 'die die--discarded' : 'die'}">${d.roll}</span>`).join('+')}`;
          }
          else {
            string = `${string}<span class="mod">${r}</span>`;
          }

          return string;
        }, {});

        // Replace the html.
        const tooltip = a.classList.contains("expanded") ? roll.total : `${dieTotal} = ${roll._total}`;
        a.innerHTML = `<i class="fas fa-dice-d20"></i> ${tooltip}`;
        a.classList.toggle("expanded");
      }
      //////////////////////////////////////////////////////////////////////////
      //////////////////////// END OF DEPRECATED CODE //////////////////////////
      //////////////////////////////////////////////////////////////////////////
      else {
        // Build a die string of the die parts, including whether they're discarded.
        const dieTotal = roll.terms.reduce((string, r) => {
          if (typeof string == 'object') {
            string = '';
          }

          if (r.results) {
            string = `${string}${r.results.map(d => `<span class="${d.discarded || d.rerolled ? 'die die--discarded' : 'die'}">${d.result}</span>`).join('+')}`;
          }
          else {
            string = `${string}<span class="mod">${r}</span>`;
          }

          return string;
        }, {});

        // Replace the html.
        const tooltip = a.classList.contains("expanded") ? roll.total : `${dieTotal} = ${roll._total}`;
        a.innerHTML = `<i class="fas fa-dice-d20"></i> ${tooltip}`;
        a.classList.toggle("expanded");
      }
    }

    // Otherwise execute the deferred roll
    else {
      const cls = CONFIG.ChatMessage.entityClass;

      // Get the "speaker" for the inline roll
      const actor = cls.getSpeakerActor(cls.getSpeaker());
      const rollData = actor ? actor.getRollData() : {};

      // Execute the roll
      const roll = new Roll(a.dataset.formula, rollData).roll();
      var message = roll.toMessage({ flavor: a.dataset.flavor }, { rollMode: a.dataset.mode });
      $('.message').off("contextmenu");
      return message;
    }

  });
});

/* ---------------------------------------------- */

// Update the escalation die tracker. Character values for the escalation die
// are updated in their prepareData() and getRollData() functions.
Hooks.on('updateCombat', (async (combat, update) => {
  // Handle non-gm users.
  if (combat.current === undefined) {
    combat = game.combat;
  }

  if (combat.current.round !== combat.previous.round) {
    let escalation = ArchmageUtility.getEscalation(combat);

    // Update the escalation die tracker.
    let $escalationDiv = $('.archmage-escalation');
    $escalationDiv.attr('data-value', escalation);
    $escalationDiv.removeClass('hide');
    $escalationDiv.find('.ed-number').text(escalation);
  }
}));

/* ---------------------------------------------- */

// Update escalation die values on scene change.
Hooks.on('renderCombatTracker', (async () => {
  // Handle non-gm users.
  let combat = game.combat;
  let escalation = 0;
  let $escalationDiv = $('.archmage-escalation');

  // Restore the escalation die.
  if (combat !== null) {
    escalation = ArchmageUtility.getEscalation(combat);
    $escalationDiv.removeClass('hide');
  }
  // Hide the escalation die.
  else {
    $escalationDiv.addClass('hide');
  }
  // Update the value of the tracker.
  $escalationDiv.attr('data-value', escalation);
  $escalationDiv.find('.ed-number').text(escalation);
}));

/* ---------------------------------------------- */

Hooks.on('deleteCombat', (combat) => {
  // Clear the escalation die.
  $('.archmage-escalation').addClass('hide');

  // Clear out death saves, per combat resources and temp HP.
  let combatants = combat.data.combatants;
  if (combatants) {
    // Retrieve the character actors.
    let actors = combatants.filter(c => c?.actor?.data?.type == 'character');
    let updatedActors = {};
    // Iterate over the actors for updates.
    actors.forEach(async (a) => {
      // Only proceed if this combatant has an actor and hasn't been updated.
      if (a.actor && !updatedActors[a.actor.data._id]) {
        // Retrieve the actor.
        let actor = a.actor;
        // Perform the update.
        if (actor) {
          let updates = {};
          updates['data.attributes.saves.deathFails.value'] = 0;
          updates['data.attributes.hp.temp'] = 0;
          for (let k of Object.keys(actor.data.data.resources.perCombat)) {
            updates[`data.resources.perCombat.${k}.current`] = 0;
          }
          await actor.update(updates);
          updatedActors[actor.data._id];
        }
      }
    });
  }
});

Hooks.on('createCombatant', (combat, combatant, options, id) => {
  // Retrieve the actor for this combatant.
  let tokens = combat.scene.data.tokens;
  let tokenId = combatant.tokenId;
  if (tokens && tokenId) {
    let token = tokens.find(t => t._id == tokenId);
    let actor = token ? game.actors.get(token.actorId) : null;
    // Add command points at start of combat.
    if (actor && actor.data.type == 'character') {
      let updates = {};
      let hasStrategist = actor.items.find(i => i.data.name.safeCSSId().includes('strategist'));
      let basePoints = hasStrategist ? 2 : 1;
      // TODO: Add support for Forceful Command.
      updates['data.resources.perCombat.commandPoints.current'] = basePoints;
      actor.update(updates);
    }
  }
});

/* ---------------------------------------------- */

Hooks.on('dcCalcWhitelist', (whitelist, actor) => {
  // Add whitelist support for the calculator.
  whitelist.archmage = {
    flags: {
      adv: true
    },
    abilities: [
      'str',
      'dex',
      'con',
      'int',
      'wis',
      'cha'
    ],
    attributes: [
      'init',
      'level',
      'standardBonuses'
    ],
    custom: {
      abilities: {},
      attributes: {
        levelHalf: {
          label: 'level_half',
          name: '1/2 Level',
          formula: actor.data.data.attributes.level !== undefined ? Math.floor(actor.data.data.attributes.level.value / 2) : 0
        },
        escalation: {
          label: 'escalation',
          name: 'Esc. Die',
          formula: '@attr.escalation.value'
        },
        melee: {
          label: 'melee',
          name: 'W [Melee]',
          formula: '@attr.weapon.melee.value'
        },
        ranged: {
          label: 'ranged',
          name: 'W [Ranged]',
          formula: '@attr.weapon.ranged.value'
        },
        standardBonus: {
          label: 'standard_bonuses',
          name: 'Standard Bonuses',
          formula: '@attr.standardBonuses.value'
        }
      },
      custom: {}
    }
  };

  // Replace the ability attributes in the calculator with custom formulas.
  let levelMultiplier = 1;
  if (actor.data.data.attributes.level.value >= 5) {
    levelMultiplier = 2;
  }
  if (actor.data.data.attributes.level.value >= 8) {
    levelMultiplier = 3;
  }

  if (levelMultiplier > 1) {
    for (let prop of whitelist.archmage.abilities) {
      whitelist.archmage.custom.custom[prop] = {
        label: prop,
        name: `${levelMultiplier}${prop}`,
        formula: `@abil.${prop}.dmg`
      };
    }
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createArchmageMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.archmage.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "archmage.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}