import { ARCHMAGE, FLAGS } from './setup/config.js';
import { ActorArchmage } from './actor/actor.js';
import { ActorArchmageNpcSheetV2 } from './actor/actor-npc-sheet-v2.js';
import { ActorArchmageSheetV2 } from './actor/actor-sheet-v2.js';
import { ItemArchmage } from './item/item.js';
import { ItemArchmageSheet } from './item/item-sheet.js';
import { ArchmageMacros } from './setup/macros.js';
import { ArchmageUtility } from './setup/utility-classes.js';
import { MacroUtils } from './setup/utility-classes.js';
import { ArchmageReference } from './setup/utility-classes.js';
import { ContextMenu2 } from './setup/contextMenu2.js';
import { DamageApplicator } from './setup/damageApplicator.js';
import { DiceArchmage } from './actor/dice.js';
import { preloadHandlebarsTemplates } from "./setup/templates.js";
import { TourGuide } from './tours/tourguide.js';
import { ActorHelpersV2 } from './actor/helpers/actor-helpers-v2.js';
import { renderCompendium } from './hooks/renderCompendium.js';
import { EffectArchmageSheet } from "./active-effects/effect-sheet.js";
import { registerModuleArt } from './setup/register-module-art.js';
import { TokenArchmage } from './actor/token.js';
import {combatRound, combatTurn, preDeleteCombat} from "./hooks/combat.mjs";
import { ArchmageCompendiumBrowserApplication } from './applications/compendium-browser.js';


Hooks.once('init', async function() {

  if (game.modules.get('_CodeMirror')?.active && typeof CodeMirror != undefined) {
    var cssId = 'archmage-codemirror';
    if (!document.getElementById(cssId))
    {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.id   = cssId;
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = '/modules/_CodeMirror/theme/monokai.css';
        link.media = 'all';
        head.appendChild(link);
    }
  }

  String.prototype.safeCSSId = function() {
    return encodeURIComponent(
      this.toLowerCase()
    ).replace(/%[0-9A-F]{2}/gi, '-');
  }

  Handlebars.registerHelper('safeCSSId', (arg) => {
    return `${arg}`.safeCSSId();
  });

  Handlebars.registerHelper('getPowerClass', (inputString) => {
    // Get the appropriate usage. TODO: likely needs to be localized?
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

  Handlebars.registerHelper('iconSymbol', (iconKey) => {
      let symbols = {
        'Positive': '+',
        'Negative': '-',
        'Conflicted': '~'
      };
      return symbols[iconKey];
  });

  // Preload template partials.
  preloadHandlebarsTemplates();

  game.settings.register("archmage", "secondEdition", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.secondEditionName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.secondEditionHint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true,
    onChange: () => window.location.reload()
  });

  game.archmage = {
    ActorArchmage,
    ActorArchmageSheetV2,
    ActorArchmageNpcSheetV2,
    DiceArchmage,
    ItemArchmage,
    ItemArchmageSheet,
    EffectArchmageSheet,
    ArchmageMacros,
    ArchmageUtility,
    MacroUtils,
    rollItemMacro,
    ActorHelpersV2,
    ArchmageCompendiumBrowserApplication,
    system: {
      moduleArt: {
        map: new Map(),
        refresh: registerModuleArt
      }
    },
    terrains: [
      {
        id: "none",
        name: "ARCHMAGE.TERRAINS.none",
        icon: "fa-solid fa-circle-xmark"
      },
      {
        id: "caveDungeonUnderworld",
        name: "ARCHMAGE.TERRAINS.caveDungeonUnderworld",
        icon: "fa-solid fa-dungeon"
      },
      {
        id: "forestWoods",
        name: "ARCHMAGE.TERRAINS.forestWoods",
        icon: "fa-solid fa-trees"
      },
      {
        id: "iceTundraDeepSnow",
        name: "ARCHMAGE.TERRAINS.iceTundraDeepSnow",
        icon: "fa-solid fa-icicles"
      },
      {
        id: "migration",
        name: "ARCHMAGE.TERRAINS.migration",
        icon: "fa-solid fa-paw-claws"
      },
      {
        id: "mountains",
        name: "ARCHMAGE.TERRAINS.mountains",
        icon: "fa-solid fa-mountains"
      },
      {
        id: "plainsOverworld",
        name: "ARCHMAGE.TERRAINS.plainsOverworld",
        icon: "fa-solid fa-staff"
      },
      {
        id: "ruins",
        name: "ARCHMAGE.TERRAINS.ruins",
        icon: "fa-solid fa-scroll-old"
      },
      {
        id: "swampLakeRiver",
        name: "ARCHMAGE.TERRAINS.swampLakeRiver",
        icon: "fa-solid fa-water"
      }
    ]
  };

  // Replace sheets.
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("archmage", ItemArchmageSheet, {
    label: game.i18n.localize('ARCHMAGE.sheetItem'),
    makeDefault: true
  });

  DocumentSheetConfig.registerSheet(ActiveEffect, "archmage", EffectArchmageSheet, {
    label: game.i18n.localize('ARCHMAGE.sheetActiveEffect'),
    makeDefault: true
  });

  CONFIG.ARCHMAGE = ARCHMAGE;

  // Update status effects.
  function _setArchmageStatusEffects(extended) {
    if (extended) CONFIG.statusEffects = ARCHMAGE.statusEffects.concat(ARCHMAGE.extendedStatusEffects)
    else CONFIG.statusEffects = foundry.utils.duplicate(ARCHMAGE.statusEffects);
  }
  game.settings.register('archmage', 'extendedStatusEffects', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.extendedStatusEffectsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.extendedStatusEffectsHint"),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    onChange: enable => _setArchmageStatusEffects(enable)
  });
  _setArchmageStatusEffects(game.settings.get('archmage', 'extendedStatusEffects'));

  // Update 2e constants
  if (game.settings.get("archmage", "secondEdition")) {
    // Update dice number at higher level
    CONFIG.ARCHMAGE.numDicePerLevel = CONFIG.ARCHMAGE.numDicePerLevel2e;

    // Update tier multiplier Array
    CONFIG.ARCHMAGE.tierMultPerLevel = CONFIG.ARCHMAGE.tierMultPerLevel2e;

    // Remove AE from vulnerable
    let id = CONFIG.statusEffects.findIndex(e => e.id == "vulnerable");
    delete CONFIG.statusEffects[id].changes;
    CONFIG.statusEffects[id].journal = "uHqgXlfj0rkf0XRE";

    // Remove 1e hampered from context menu status effects
    id = CONFIG.statusEffects.findIndex(e => e.id == "hampered");
    CONFIG.statusEffects.splice(id, 1);

    // Update class base stats
    for (let cl of Object.keys(CONFIG.ARCHMAGE.classes2e)) {
      for (let k of Object.keys(CONFIG.ARCHMAGE.classes2e[cl])) {
        CONFIG.ARCHMAGE.classes[cl][k] = CONFIG.ARCHMAGE.classes2e[cl][k];
      }
    }
  } else {
    // Remove Mental Phenomenon flag
    delete FLAGS.characterFlags.dexToInt;

    // Remove 11th level feat tier
    delete CONFIG.ARCHMAGE.featTiers.iconic;

    // Remove 2e hindered from context menu status effects
    let id = CONFIG.statusEffects.findIndex(e => e.id == "hindered");
    CONFIG.statusEffects.splice(id, 1);
  }

  // Assign the actor class to the CONFIG
  CONFIG.Actor.documentClass = ActorArchmage;
  CONFIG.Token.objectClass = TokenArchmage;

  // Assign ItemArchmage class to CONFIG
  CONFIG.Item.documentClass = ItemArchmage;

  // Override CONFIG
  CONFIG.Item.sheetClass = ItemArchmageSheet;

  Actors.unregisterSheet('core', ActorSheet);

  Actors.registerSheet("archmage", ActorArchmageNpcSheetV2, {
    label: game.i18n.localize('ARCHMAGE.sheetNPC'),
    types: ["npc"],
    makeDefault: true
  });

  // V2 actor sheet (See issue #118).
  Actors.registerSheet("archmage", ActorArchmageSheetV2, {
    label: game.i18n.localize('ARCHMAGE.sheetCharacter'),
    types: ["character"],
    makeDefault: true
  });

  /* -------------------------------------------- */
  CONFIG.Actor.characterFlags = FLAGS.characterFlags;
  CONFIG.Actor.npcFlags = FLAGS.npcFlags;

  /**
   * Register Initiative formula setting
   */
  function _setArchmageInitiative(tiebreaker) {
    CONFIG.Combat.initiative.tiebreaker = tiebreaker;
    CONFIG.Combat.initiative.decimals = 0;
    if (ui.combat && ui.combat._rendered) ui.combat.render();
  }
  game.settings.register('archmage', 'initiativeDexTiebreaker', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.initiativeDexTiebreakerName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.initiativeDexTiebreakerHint"),
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
    onChange: enable => _setArchmageInitiative(enable)
  });
  _setArchmageInitiative(game.settings.get('archmage', 'initiativeDexTiebreaker'));

  game.settings.register("archmage", "initiativeStaticNpc", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.initiativeStaticNpcName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.initiativeStaticNpcHint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register("archmage", "automateHPConditions", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.automateHPConditionsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.automateHPConditionsHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("archmage", "staggeredOverlay", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.staggeredOverlayName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.staggeredOverlayHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("archmage", "multiTargetAttackRolls", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.multiTargetAttackRollsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.multiTargetAttackRollsHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("archmage", "hideExtraRolls", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.hideExtraRollsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.hideExtraRollsHint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  game.settings.register("archmage", "showDefensesInChat", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.showDefensesInChatName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.showDefensesInChatHint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register("archmage", "hideInsteadOfOpaque", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.hideInsteadOfOpaqueName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.hideInsteadOfOpaqueHint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register("archmage", "enableOngoingEffectsMessages", {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.enableOngoingEffectsMessagesName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.enableOngoingEffectsMessagesHint"),
    scope: "world",
    type: Boolean,
    default: true,
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

  game.settings.register('archmage', 'sheetTooltips', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.sheetTooltipsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.sheetTooltipsHint"),
    scope: 'client',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register('archmage', 'showPrivateGMAttackRolls', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.showPrivateGMAttackRollsName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.showPrivateGMAttackRollsHint"),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register('archmage', 'nightmode', {
    name: game.i18n.localize("ARCHMAGE.SETTINGS.nightmodeName"),
    hint: game.i18n.localize("ARCHMAGE.SETTINGS.nightmodeHint"),
    scope: 'client',
    config: true,
    default: false,
    type: Boolean
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

  // Track whether we overrode DsN's default inline roll parsing
  game.settings.register("archmage", "DsNInlineOverride", {
    name: "DsN Override",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  /**
   * Override the default Initiative formula to customize special behaviors of the system.
   * Apply advantage, proficiency, or bonuses where appropriate
   * Apply the dexterity score as a decimal tiebreaker if requested
   * See Combat._getInitiativeFormula for more detail.
   * @private
   */
  Combatant.prototype._getInitiativeFormula = function() {
    const actor = this.actor;
    if (!actor) return "1d20";
    const init = actor.system.attributes.init.mod;
    // Init mod includes dex + level + misc bonuses.
    const parts = ["1d20", init];
    if (actor.getFlag("archmage", "initiativeAdv")) parts[0] = "2d20kh";
    if (game.settings.get("archmage", "initiativeStaticNpc") &&  actor.type == 'npc') parts[0] = "10";
    if (CONFIG.Combat.initiative.tiebreaker) parts.push(init / 100);
    else parts.push((actor.type === 'npc' ? 0.01 : 0));
    return parts.filter(p => p !== null).join(" + ");
  }

  ArchmageUtility.fixVuePopoutBug();
});

Hooks.on('setup', (data, options, id) => {
  // Configure autocomplete inline properties module.
  const aip = game.modules.get("autocomplete-inline-properties")?.API;
  if (aip?.PACKAGE_CONFIG) {
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
              dataMode: aip.CONST.DATA_MODE.OWNING_ACTOR_ROLL_DATA,
              filteredKeys: filteredKeys
            }
          ]
        },
        {
          name: "ActiveEffectConfig",
          fieldConfigs: [
            {
              selector: '.tab[data-tab="effects"] .key input[type="text"]',
              showButton: true,
              allowHotkey: true,
              dataMode: 'owning-actor',
              defaultPath: 'data'
            }
          ]
        }
      ]
    };
    aip.PACKAGE_CONFIG.push(AIP);
  }
});

/* ---------------------------------------------- */

function addEscalationDie() {
  const escalation = ArchmageUtility.getEscalation();
  const hide = game.combats.contents.length < 1 || escalation === 0 ? ' hide' : '';
  const hideIfNotGM = !game.user.isGM ? ' hide' : '';
  const text = game.i18n.localize("ARCHMAGE.escalationDieLabel");
  $('.archmage-hotbar').prepend(
    `<div class="archmage-escalation${hide}">
       <div class="ed-number" data-esc-die-text="${text}">${escalation}</div>
       <div class="ed-controls${hideIfNotGM}"">
         <button class="ed-control ed-plus">+</button>
         <button class="ed-control ed-minus">-</button>
       </div>
     </div>`);

  // Add click events for ed.
  $('body').on('click', '.ed-control', (event) => {
    let $self = $(event.currentTarget);
    let isIncrease = $self.hasClass('ed-plus');
    ArchmageUtility.setEscalationOffset(game.combat, isIncrease);
  });

  // Add click events for effect links
  $('body').on("click", "a.effect-link", async (event) => {
    event.preventDefault();
    const a = event.currentTarget;
    let doc = null;
    let id = a.dataset.id;

    switch (a.dataset.type) {
      case "condition":
        const journalId = CONFIG.ARCHMAGE.statusEffects.find(x => x.id === id)?.journal;
        doc = journalId ? await game.packs.get("archmage.conditions").getDocument(journalId) : false;
        break;
      case "effect":
        console.warn("Effects not currently supported");
        break;
    }
    if (!doc) return;

    return doc.sheet.render(true);
  });
}

/* -------------------------------------------- */

Hooks.once('ready', () => {
  $('#ui-bottom').prepend(`<div class="archmage-hotbar"></div>`);
  addEscalationDie();
  $('body').append('<div class="archmage-preload"></div>');
  renderSceneTerrains();

  // Add effect link drag data
  document.addEventListener("dragstart", event => {
    if ( !event.target.classList.contains("effect-link") ) return;
    const dataset = event.target.dataset;
    let data = {
      type: dataset.type,
      id: dataset.id
    };
    if ( dataset.actorId ) data.actorId = dataset.actorId;
    if ( dataset.damageType ) data.damageType = dataset.damageType;
    if ( dataset.value ) data.value = dataset.value;
    if ( dataset.ends ) data.ends = dataset.ends;
    if ( dataset.source ) data.source = dataset.source;
    if ( dataset.tooltip ) data.tooltip = dataset.tooltip;
    if (dataset.name ) data.name = dataset.name;
    data.text = event.target.innerText;
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  });

  // Handle click events for the compendium browser.
  document.addEventListener("click", (event) => {
    if (event?.target?.classList && event.target.classList.contains("open-archmage-browser")) {
      // Retrieve the existing compendium browser, if any.
      let compendiumBrowser = Object.values(ui.windows).find(app => app.constructor.name == 'ArchmageCompendiumBrowserApplication');
      // Otherwise, build a new one.
      if (!compendiumBrowser) {
        compendiumBrowser = new ArchmageCompendiumBrowserApplication({defaultTab: event.target.dataset.tab ?? 'creatures'});
      }
      // Render the browser.
      compendiumBrowser.render(true);
    }
  });

  // Wait to register the hotbar macros until ready.
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (['Item'].includes(data.type)) {
      createArchmageMacro(data, slot);
      return false;
    }
  });

  $('.message').off("contextmenu");

  // Build the module art map. See module/setup/register-module-art.js for more details.
  registerModuleArt();
});

/* ---------------------------------------------- */

Hooks.on("renderDocumentDirectory", (app, html, options) => {
  if (["actors", "items"].includes(options.tabName) && !options.cssId.toLowerCase().includes('compendium')) {
    const htmlElement = html[0];
    let compendiumButton = '';

    if (options.tabName == "items") {
      compendiumButton = `
      <div class="flexrow">
        <button type="button" class="open-archmage-browser" data-tab="powers"><i class="fas fa-swords"></i>${game.i18n.localize('ARCHMAGE.COMPENDIUMBROWSER.buttons.browsePowers')}</button>
        <button type="button" class="open-archmage-browser" data-tab="items"><i class="fas fa-wand-magic-sparkles"></i>${game.i18n.localize('ARCHMAGE.COMPENDIUMBROWSER.buttons.browseItems')}</button>
      </div>`;
    }
    else {
      compendiumButton = `<button type="button" class="open-archmage-browser" data-tab="creatures"><i class="fas fa-face-smile-horns"></i>${game.i18n.localize('ARCHMAGE.COMPENDIUMBROWSER.buttons.browseCreatures')}</button>`;
    }
    // Append button. Click handler added in 'ready' hook.
    htmlElement.querySelector(".directory-footer").insertAdjacentHTML("beforeend", compendiumButton);
  }
});

/* -------------------------------------------- */

function renderSceneTerrains() {

  // Remove any existing element
  $('.archmage-terrains').remove();

  let scene = game.scenes.viewed;
  if ( !scene) return;
  let flag = scene.getFlag('archmage', 'terrains');
  if ( !flag) return;
  let terrains = flag.filter(x => x !== 'none');
  if ( !terrains || (terrains.length === 0) ) return;

  const label = game.i18n.localize('ARCHMAGE.terrains');
  const isGM = game.user.isGM ? ' gm' : '';
  const aside = $(`<aside class="archmage-terrains${isGM}" data-terrains-text="${label}"></aside>`);
  if ( terrains ) {
      terrains.forEach(t => {
        const terrain = game.archmage.terrains.find(x => x.id === t);
        aside.append(`<div><i class="${terrain.icon}"></i> ${game.i18n.localize(terrain.name)}</div>`);
      });
  }
  // Set height based on number of terrains
  aside.css('height', `${18 * (terrains.length + 1)}px`);
  $('.archmage-hotbar').append(aside);
}

/* -------------------------------------------- */

Hooks.on('canvasReady', (canvas) => {
  renderSceneTerrains();
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  // Define groups for organization.
  const groups = [
    {
      label: 'ARCHMAGE.SETTINGS.groups.secondEdition',
      settings: ['secondEdition'],
      highlights: [],
    },
    {
      label: 'ARCHMAGE.SETTINGS.groups.automation',
      settings: [
        'enableOngoingEffectsMessages',
        'automateHPConditions',
        'staggeredOverlay',
        'multiTargetAttackRolls',
        'hideExtraRolls',
        'showDefensesInChat',
        'hideInsteadOfOpaque',
        'roundUpDamageApplication',
        'rechargeOncePerDay',
        'automateBaseStatsFromClass',
        'showPrivateGMAttackRolls',
      ],
      highlights: [
        'enableOngoingEffectsMessages',
      ],
    },
    {
      label: 'ARCHMAGE.SETTINGS.groups.appearance',
      settings: [
        'nightmode',
        'sheetTooltips',
      ],
      highlights: [],
    },
    {
      label: 'ARCHMAGE.SETTINGS.groups.accessibility',
      settings: [
        'colorBlindMode'
      ],
      highlights: [],
    },
    {
      label: 'ARCHMAGE.SETTINGS.groups.general',
      settings: [
        'extendedStatusEffects',
        'initiativeDexTiebreaker',
        'initiativeStaticNpc',
        'unboundEscDie',
        'tourVisibility',
      ],
      highlights: [],
    }
  ];

  // Find the parent category element.
  const settingsElements = html.find('.form-group[data-setting-id*="archmage"]');
  const parent = settingsElements.closest('.category');
  parent.addClass('archmage-settings');

  // Iterate through our groups and move all of their settings into the matching element.
  for (let group of groups) {
    const details = $(`<details><summary>${game.i18n.localize(group.label)}</summary><span class="slot"></span></details>`);
    for (let setting of group.settings) {
      const element = html.find(`[data-setting-id="archmage.${setting}"]`);
      // Add a highlight if necessary.
      if (group.highlights.includes(setting)) {
        element.addClass('highlight');
        element.find('label').append(`<span class="new-setting"> (${game.i18n.localize('ARCHMAGE.SETTINGS.newSetting')})</span>`);
      }

      // Move the element.
      element.detach();
      details.append(element);
    }
    parent.append(details);
  }
});

/* -------------------------------------------- */

Hooks.on('renderSceneConfig', (app, html, data) => {

  // Attach a list of Terrains to the scene config as a multi-select
  const terrainOptions = game.archmage.terrains.map(t => {
      return {
          value: t.id,
          label: game.i18n.localize(t.name)
      };
  });
  const currentTerrains = data.document.getFlag('archmage', 'terrains') || [];

  // Create multiple select dom element
  const htmlSelect = $(`<select multiple="multiple" name="flags.archmage.terrains" data-dtype="String"></select>`);
  terrainOptions.forEach(o => {
      const attrs = ["value='"+o.value+"'", currentTerrains.includes(o.value) ? "selected=" : ""];
      const option = $(`<option ${attrs.join(" ")}>${o.label}</option>`);
      htmlSelect.append(option);
  });

  // Wrap the select in a form-group
  const htmlFormGroup = $(`<div class="form-group"></div>`);
  htmlFormGroup.append(`<label>${game.i18n.localize("ARCHMAGE.TERRAINS.label")}</label>`);
  htmlFormGroup.append(htmlSelect);

  // Attach the select after .initial-position
  html.find('.initial-position').after(htmlFormGroup);
  html.find('.initial-position').after('<hr>');

  // Update the height of the scene config by setting to auto
  app._element.css('height', 'auto');
});

/* -------------------------------------------- */

Hooks.on("updateScene", (scene, data, options, userId) => {
  renderSceneTerrains();
});

/* ---------------------------------------------- */

Hooks.on("renderSettings", async (app, html) => {
  let button = $(`<button id="archmage-reference-btn" type="button" data-action="archmage-help"><i class="fas fa-dice-d20"></i> Attributes and Inline Rolls Reference</button>`);
  html.find('button[data-action="controls"]').after(button);

  button.on('click', ev => {
    ev.preventDefault();
    new ArchmageReference().render(true);
  });

  let helpButton = $(`<button id="archmage-help-btn" type="button" data-action="archmage-help"><i class="fas fa-question-circle"></i> System Documentation</button>`);
  html.find('button[data-action="controls"]').after(helpButton);

  helpButton.on('click', ev => {
    ev.preventDefault();
    window.open('https://asacolips.gitbook.io/toolkit13-system/', 'archmageHelp', 'width=1032,height=720');
  });

  let licenseButton = $(`<button id="archmage-license-btn" type="button" data-action="archmage-help"><i class="fas fa-book"></i> ${game.i18n.localize('ARCHMAGE.DIALOG.CUP.title')}</button>`);
  html.find('button[data-action="controls"]').after(licenseButton);

  licenseButton.on('click', ev => {
    ev.preventDefault();
    new Dialog({
      title: game.i18n.localize('ARCHMAGE.DIALOG.CUP.title'),
      content: game.i18n.localize('ARCHMAGE.DIALOG.CUP.content'),
      buttons: {},
    }).render(true);
  });


  // This is intentionally in renderSettings, as it is one of the last bits of HTML to get rendered, which is required for the Tour to hook in
  let tourVisibility = game.settings.get('archmage', 'tourVisibility');
  let showTours = tourVisibility !== 'off' ? true : false;

  if (tourVisibility == 'gm' && !game.user.isGM) {
    showTours = false;
  }

  if (showTours) {
    let tourGuide = new TourGuide();
    await tourGuide.registerTours();
    // @todo fix tours for v10
    // tourGuide.startNewFeatureTours();
  }
});

Hooks.on('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: "archmage", name: "Archmage" }, false);

  // Disable DsN's automatic parsing of inline rolls - let users enable it
  if (foundry.utils.isNewerVersion(game.modules.get('dice-so-nice')?.version, "4.1.1")
    && !game.settings.get("archmage", "DsNInlineOverride")) {
    game.settings.set("dice-so-nice", "animateInlineRoll", false);
    game.settings.set("archmage", "DsNInlineOverride", true);
  }

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


Hooks.on('renderCompendium', (app, html, data) => {
  renderCompendium.handle(app, html, data);
});

/* ---------------------------------------------- */
Hooks.on('preCreateToken', async (scene, data, options, id) => {
  let actorId = data.actorId;
  // Attempt to get the actor.
  let actor = game.actors.get(actorId);

  // If there's an actor, set the token size.
  if (actor) {
    let size = actor.system.details.size?.value;
    if (size == 'large' && data.height == 1 && data.width == 1) {
      data.height = 2;
      data.width = 2;
    }
    if (size == 'huge' && data.height == 1 && data.width == 1) {
      data.height = 3;
      data.width = 3;
    }
  }
});

/* -------------------------------------------- */

// TODO: When we expand to support Duration, this probably will be more complicated
Hooks.on('dropActorSheetData', async (actor, sheet, data) => {
  if ( data.type === "condition" ) {
    const statusEffect = CONFIG.statusEffects.find(x => x.id === data.id);
    if ( statusEffect ) {

      // If we have a Token, just toggle the effect
      // First load the token from a token actor (is null for linked)
      let token = actor.token;
      // If not, look for linked tokens in the scene
      if (!token) token = canvas.scene.tokens.find(
          t => (t.data.actorId === actor.id && t.isLinked)
      );
      if (token) return token._object.toggleEffect(statusEffect);

      // Otherwise, create the AE
      statusEffect.label = game.i18n.localize(statusEffect.label);
      return actor.createEmbeddedDocuments("ActiveEffect", [statusEffect]);
    }
    else {
      // Just a generic condition, transfer the name
      let effectData = {
        name: data.name,
        icon: 'icons/svg/aura.svg'
      };
      return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
  }
  else if ( data.type === "effect" ) {
    const actorId = data.actorId;
    const sourceActor = game.actors.get(actorId);
    const effect = sourceActor.effects.get(data.id);
    let effectData = foundry.utils.duplicate(effect);
    console.dir(effectData);
    return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }
  else if ( data.type == "ongoing-damage" ) {

    // Load the source actor and grab its image if possible
    let sourceActor = await fromUuid(data.source);
    let img = sourceActor?.img ?? "icons/skills/toxins/symbol-poison-drop-skull-green.webp";

    let effectData = {
      name: data.name,
      icon: img,
      origin: data.source,
      flags: {
        archmage: {
          ongoingDamage: data.value,
          ongoingDamageType: data.damageType,
          duration: data.ends,
          tooltip: data.tooltip
        }
      }
    }
    return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }
});

/* ---------------------------------------------- */

Hooks.on('dropCanvasData', async (canvas, data) => {

  function findToken() {
    // Get the token at the drop point, if any
    const x = data.x;
    const y = data.y;
    const gridSize = canvas.scene.grid.size;
    // Get the set of targeted tokens
    const targets = Array.from(canvas.scene.tokens.values()).filter(t => {
      if (!t.visible) return false;
      return (t.x <= x
          && (t.x + t.width * gridSize) >= x
          && t.y <= y
          && (t.y + t.height * gridSize) >= y);
    });
    if (targets.length == 0) return null;

    let token = targets[0];
    if (targets.length > 1) {
      // Select closest to center
      token = targets.reduce((a, b) => {
        const cntr_x_a = a.x + a.width * gridSize / 2;
        const cntr_y_a = a.y + a.height * gridSize / 2;
        const dist_a = Math.sqrt(Math.pow(x - cntr_x_a, 2) + Math.pow(y - cntr_y_a, 2));
        const cntr_x_b = b.x + b.width * gridSize / 2;
        const cntr_y_b = b.y + b.height * gridSize / 2;
        const dist_b = Math.sqrt(Math.pow(x - cntr_x_b, 2) + Math.pow(y - cntr_y_b, 2));
        return (dist_a < dist_b ? a : b);
      });
    }
    return token;
  }

  if (data.type === 'condition') {

    const token = findToken();
    if (!token) return;

    let statusEffect = foundry.utils.duplicate(CONFIG.statusEffects.find(x => x.id === data.id));

    // For conditions just toggle the effect
    return token._object.toggleEffect(statusEffect);
  }
  else if ( data.type == "ongoing-damage" ) {

    const token = findToken();
    if (!token) return;

    // Load the source actor and grab its image if possible
    let sourceActor = await fromUuid(data.source);
    let img = sourceActor?.img ?? "icons/skills/toxins/symbol-poison-drop-skull-green.webp";

    let effectData = {
      name: data.name,
      icon: img,
      origin: data.source,
      flags: {
        archmage: {
          ongoingDamage: data.value,
          ongoingDamageType: data.damageType,
          duration: data.ends,
          tooltip: data.tooltip
        }
      }
    }
    return token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }
});

Hooks.on("renderJournalSheet", async (app, html, data) => {
  app._element[0].classList.add("archmage-v2");
});

/* ---------------------------------------------- */

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


Hooks.on('renderChatMessage', (chatMessage, html, options) => {

  // Override the inline roll click behavior.
  html.find('a.inline-roll').addClass('inline-roll--archmage').removeClass('inline-roll');
  html.find('.inline-roll--archmage').each(function() {
    var uuid = uuidv4();
    // Add a way to uniquely identify this roll
    $(this).addClass(uuid);
    $(this).off("contextmenu");

    const triggerTarget = game.i18n.localize("ARCHMAGE.CHAT.target") + ":";
    const triggerCastPower = game.i18n.localize("ARCHMAGE.CHAT.castPower") + ":";
    if ($(this).parent()[0].innerText.includes(triggerTarget) &&
        !$(this).parent()[0].innerText.includes(triggerCastPower)) {
      // Ignore if this is a "Target:" line (but not if its "Cast for Power:",
      // which in some localizations contains "Target:").
      return;
    }

    const triggerAttack = game.i18n.localize("ARCHMAGE.attack") + ":";
    if ($(this).parent()[0].innerText.includes(triggerAttack)) {
      // Ignore if this is a "Attack:" line.
      return;
    }

    new ContextMenu2($(this).parent(), "." + uuid, [
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyDamage"),
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 1);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyDamageHalf"),
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, .5);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyDamageDouble"),
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 2);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyDamageTriple"),
        icon: '<i class="fas fa-tint"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asDamage(inlineRoll, 3);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyHealing"),
        icon: '<i class="fas fa-medkit"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asHealing(inlineRoll, 1);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyHealingHalf"),
        icon: '<i class="fas fa-medkit"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asHealing(inlineRoll, .5);
        }
      },
      {
        name: game.i18n.localize("ARCHMAGE.contextApplyTempHealth"),
        icon: '<i class="fas fa-heart"></i>',
        callback: inlineRoll => {
          new DamageApplicator().asTempHealth(inlineRoll);
        }
      }
    ]);
  });
  html.find('a.inline-roll--archmage').on('click', async event => {
    event.preventDefault();
    const a = event.currentTarget;

    // For inline results expand or collapse the roll details
    if (a.classList.contains("inline-result")) {
      const roll = Roll.fromJSON(unescape(a.dataset.roll));
      // Build a die string of the die parts, including whether they're discarded.
      const dieTotal = roll.terms.reduce((string, r) => {
        if (typeof string == 'object') {
          string = '';
        }

        if (r.results) {
          string = `${string}${r.results.map(d => `<span class="${d.discarded || d.rerolled ? 'die die--discarded' : 'die'}">${d.result}</span>`).join('+')}`;
        }
        else {
          string = `${string}<span class="mod">${r.number ?? r.operator}</span>`;
        }

        return string;
      }, {});

      // Replace the html.
      const tooltip = a.classList.contains("expanded") ? roll.total : `${dieTotal} = ${roll._total}`;
      a.innerHTML = `<i class="fas fa-dice-d20"></i> ${tooltip}`;
      a.classList.toggle("expanded");
    }

    // Otherwise execute the deferred roll
    else {
      const cls = CONFIG.ChatMessage.documentClass;

      // Get the "speaker" for the inline roll
      const actor = cls.getSpeakerActor(cls.getSpeaker());
      const rollData = actor ? actor.getRollData() : {};

      // Execute the roll
      const roll = await new Roll(a.dataset.formula, rollData).roll();
      var message = roll.toMessage({ flavor: a.dataset.flavor }, { rollMode: a.dataset.mode });
      $('.message').off("contextmenu");
      return message;
    }

  });

  // Hook up Effect buttons
  html.find(".effect-control").on("click", async (event) => {
    const action = event.currentTarget.dataset.action;
    event.currentTarget.classList.add("grayed-out");
    // Get parent
    const parent = event.currentTarget.closest(".effect");
    const uuid = parent.dataset.uuid;
    const actor = await fromUuid(uuid);
    const effectId = parent.dataset.effectId;
    switch (action) {
      case "apply":
        const value = parent.dataset.value;
        // Healing always starts from 0 HP
        const base = value >= 0 ? actor.system.attributes.hp.value : Math.max(actor.system.attributes.hp.value, 0);
        await actor.update({ "data.attributes.hp.value": base - value });
        if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag('archmage', `effectApplied.${effectId}`, true);
        else game.socket.emit('system.archmage', {type: 'condButton', msg: chatMessage.id, flg: `effectApplied.${effectId}`});
        break;
      case "save":
        const duration = parent.dataset.save;
        const durationToDifficulty = {
          "EasySaveEnds": "easy",
          "NormalSaveEnds": "normal",
          "HardSaveEnds": "hard",
        }
        await actor.rollSave(durationToDifficulty[duration] ?? "normal");
        if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag('archmage', `effectSaved.${effectId}`, true);
        else game.socket.emit('system.archmage', {type: 'condButton', msg: chatMessage.id, flg: `effectSaved.${effectId}`});
        break;
      case "d20":
        new Roll("d20").toMessage()
        if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag('archmage', `effectRolled.${effectId}`, true);
        else game.socket.emit('system.archmage', {type: 'condButton', msg: chatMessage.id, flg: `effectRolled.${effectId}`});
        break;
      case "remove":
        await actor.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
        if (chatMessage.isAuthor || game.user.isGM) {
          await chatMessage.setFlag('archmage', `effectRemoved.${effectId}`, true);
          // Replace grayed-out with disabled
          event.currentTarget.classList.remove("grayed-out");
          event.currentTarget.classList.add("disabled");
          event.currentTarget.setAttribute('disabled', true);
        } else {
          game.socket.emit('system.archmage', {
            type: 'condButton',
            msg: chatMessage.id,
            flg: `effectRolled.${effectId}`,
            disable: event.currentTarget});
        }
        break;
    }
    chatMessage.render();
  });

  // Gray out and disable the effect buttons if the effect has already been applied, saved, or removed
  html.find(".effect-control").each((i, el) => {
    if (!chatMessage.data?.flags?.archmage) return;
    const flags = chatMessage.data.flags.archmage;
    const parent = el.closest('.effect');
    const effectId = parent.dataset.effectId;

    if (el.dataset.action === "apply" && flags?.effectApplied?.[effectId] == true) {
      el.classList.add("grayed-out");
    } else if (el.dataset.action === "save" && flags?.effectSaved?.[effectId] == true) {
      el.classList.add("grayed-out");
    } else if (el.dataset.action === "d20" && flags?.effectRolled?.[effectId] == true) {
      el.classList.add("grayed-out");
    } else if (el.dataset.action === "remove" && flags?.effectRemoved?.[effectId] == true) {
      el.classList.add("disabled");
      el.setAttribute('disabled', true);
    }
  });
});

function _handleCondButtonMsg(msg) {
  if (!game.user.isGM) return;
  const chatMessage = game.messages.get(msg.msg);
  if (chatMessage) {
    if (msg.disable) {
      // Replace grayed-out with disabled
      msg.disable.classList.remove("grayed-out");
      msg.disable.classList.add("disabled");
      msg.disable.setAttribute('disabled', true);
    } else {
      chatMessage.setFlag('archmage', msg.flg, true);
    }
  }
}


Hooks.once('ready', async function () {
  game.socket.on("system.archmage", (msg) => {
    switch (msg.type) {
      case 'shareItem':
        ItemArchmageSheet.handleShareItem(msg);
        break;
      case 'condButton':
        _handleCondButtonMsg(msg);
        break;
      default:
        console.log(msg);
    }
  });
})


Hooks.on("getChatLogEntryContext", (html, options) => {
  let canApply = li => {
    const message = game.messages.get(li.data("messageId"));
    return message?.isRoll && message?.isContentVisible;
  };
  let getRoll = li => {
    const message = game.messages.get(li.data("messageId"));
    const roll = message?.rolls[0];
    return roll;
  }
  options.push(
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyDamage"),
      icon: '<i class="fas fa-tint"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asDamage(getRoll(li), 1);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyDamageHalf"),
      icon: '<i class="fas fa-tint"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asDamage(getRoll(li), .5);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyDamageDouble"),
      icon: '<i class="fas fa-tint"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asDamage(getRoll(li), 2);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyDamageTriple"),
      icon: '<i class="fas fa-tint"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asDamage(getRoll(li), 3);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyHealing"),
      icon: '<i class="fas fa-medkit"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asHealing(getRoll(li), 1);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyHealingHalf"),
      icon: '<i class="fas fa-medkit"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asHealing(getRoll(li), .5);
      }
    },
    {
      name: game.i18n.localize("ARCHMAGE.contextApplyTempHealth"),
      icon: '<i class="fas fa-heart"></i>',
      condition: canApply,
      callback: li => {
        new DamageApplicator().asTempHealth(getRoll(li));
      }
    }
  );
  return options;
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

    // Update open sheets.
    for (let app of Object.values(ui.windows)) {
      const appType = app?.object?.type ?? null;
      if (appType == 'character' || appType == 'npc') {
        app.render();
      }

      if (app.constructor.name === 'ArchmageCompendiumBrowserApplication') {
        app.render();
      }
    }
  }
}));

/* -------------------------------------------- */

Hooks.on('combatTurn', combatTurn);

/* -------------------------------------------- */

Hooks.on('combatRound', combatRound);

/* -------------------------------------------- */

Hooks.on('preDeleteCombat', preDeleteCombat);

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

  if (!game.user.isGM) return;

  // Clear out death saves, per combat resources and temp HP.
  let combatants = combat.combatants;
  if (combatants) {
    // Retrieve the character actors.
    let actors = combatants.filter(c => c?.actor?.type == 'character');
    let updatedActors = {};
    // Iterate over the actors for updates.
    actors.forEach(async (a) => {
      // Only proceed if this combatant has an actor and hasn't been updated.
      if (a.actor && !updatedActors[a.actor._id]) {
        // Retrieve the actor.
        let actor = a.actor;
        // Perform the update.
        if (actor) {
          let updates = {};
          updates['system.attributes.saves.deathFails.value'] = 0;
          updates['system.attributes.hp.temp'] = 0;
          for (let k of Object.keys(actor.system.resources.perCombat)) {
            if ( actor.system.resources.perCombat[k].default )
              updates[`system.resources.perCombat.${k}.current`] = actor.system.resources.perCombat[k].default;
            else
              updates[`system.resources.perCombat.${k}.current`] = 0;
          }
          await actor.update(updates);
          updatedActors[actor._id];
        }
      }
    });
  }
});

Hooks.on('createCombatant', (document, data, options, id) => {
  if (!game.user.isGM) return;
  let actor = document.actor;
  // Add command points at start of combat.
  if (actor && actor.type == 'character') {
    let updates = {};
    let hasStrategist = actor.items.find(i => i.system.name.label.safeCSSId().includes('strategist'));
    let basePoints = hasStrategist ? 2 : 1;
    // TODO: Add support for Forceful Command.
    updates['system.resources.perCombat.commandPoints.current'] = basePoints;
    actor.update(updates);
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
          formula: actor.system.attributes.level !== undefined ? Math.floor(actor.system.attributes.level.value / 2) : 0
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
  if (actor.system.attributes.level.value >= 5) {
    levelMultiplier = 2;
  }
  if (actor.system.attributes.level.value >= 8) {
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
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.warnMacroOnlyOwnedItems"));
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command
  const command = `game.archmage.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command) && m.author.isSelf);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: {
        "archmage.itemMacro": true,
        "archmage.itemUuid": data.uuid
      }
    });
  }

  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemData
 * @return {Promise}
 */
function rollItemMacro(itemData) {
  // Reconstruct the drop data so that we can load the item.
  // @todo this section isn't currently used, the name section below is used.
  if (itemData.includes('Actor.') || itemData.includes('Token.')) {
    const dropData = {
      type: 'Item',
      uuid: itemData
    };
    Item.fromDropData(dropData).then(item => {
      // Determine if the item loaded and if it's an owned item.
      if (!item || !item.parent) {
        const itemName = item?.name ?? itemData;
        return ui.notifications.warn(game.i18n.format("ARCHMAGE.UI.warnMacroItemNotFound", { item: itemName}));
      }

      // Trigger the item roll
      item.roll();
    });
  }
  // Load item by name from the actor.
  else {
    const speaker = ChatMessage.getSpeaker();
    const itemName = itemData;
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(game.i18n.format("ARCHMAGE.UI.warnMacroItemNotOnActor", { item: itemName}));

    // Trigger the item roll
    return item.roll();
  }
}
