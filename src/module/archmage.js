import { ARCHMAGE, FLAGS } from './setup/config.js';
import { ActorArchmage } from './actor/actor.js';
import { ActorArchmageNpcSheetV2 } from './actor/actor-npc-sheet-v2.js';
import { ActorArchmageSheetV2 } from './actor/actor-sheet-v2.js';
import { ItemArchmage } from './item/item.js';
import { ItemArchmageSheet } from './item/item-sheet.js';
import { ArchmageMacros } from './setup/macros.js';
import { ArchmageUtility } from './setup/utility-classes.js';
import { ArchmageReference } from './setup/utility-classes.js';
import { ContextMenu2 } from './setup/contextMenu2.js';
import { DamageApplicator } from './setup/damageApplicator.js';
import { DiceArchmage } from './actor/dice.js';
import { preloadHandlebarsTemplates } from "./setup/templates.js";
import { TourGuide } from './tours/tourguide.js';
import { ActorHelpersV2 } from './actor/helpers/actor-helpers-v2.js';
import { renderCompendium } from './hooks/renderCompendium.js';
import { EffectArchmageSheet } from "./active-effects/effect-sheet.js";


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
    rollItemMacro,
    ActorHelpersV2
  };

  // Replace sheets.
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("archmage", ItemArchmageSheet, { makeDefault: true });

  DocumentSheetConfig.registerSheet(ActiveEffect, "archmage", EffectArchmageSheet, {
    label: "Toolkit13 Active Effect Sheet",
    makeDefault: true
  });

  CONFIG.ARCHMAGE = ARCHMAGE;

  // Update status effects.
  function _setArchmageStatusEffects(extended) {
    if (extended) CONFIG.statusEffects = ARCHMAGE.statusEffects.concat(ARCHMAGE.extendedStatusEffects)
    else CONFIG.statusEffects = ARCHMAGE.statusEffects;
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
    CONFIG.statusEffects[id].changes = null;
    CONFIG.statusEffects[id].journal = "uHqgXlfj0rkf0XRE";

    // Rename hampered to hindered
    id = CONFIG.statusEffects.findIndex(e => e.id == "hampered");
    CONFIG.statusEffects[id].label = "ARCHMAGE.EFFECT.StatusHindered";
    CONFIG.statusEffects[id].journal = "FHDyJEb29LWnO2Dg";

    // Update class base stats
    for (let cl of Object.keys(CONFIG.ARCHMAGE.classes2e)) {
      for (let k of Object.keys(CONFIG.ARCHMAGE.classes2e[cl])) {
        CONFIG.ARCHMAGE.classes[cl][k] = CONFIG.ARCHMAGE.classes2e[cl][k];
      }
    }
  } else {
    // Remove Mental Phenomenon flag
    delete FLAGS.characterFlags.dexToInt;
  }

  // Assign the actor class to the CONFIG
  CONFIG.Actor.documentClass = ActorArchmage;

  // Assign ItemArchmage class to CONFIG
  CONFIG.Item.documentClass = ItemArchmage;

  // Override CONFIG
  CONFIG.Item.sheetClass = ItemArchmageSheet;

  Actors.unregisterSheet('core', ActorSheet);

  Actors.registerSheet("archmage", ActorArchmageNpcSheetV2, {
    label: "NPC Sheet",
    types: ["npc"],
    makeDefault: true
  });

  // V2 actor sheet (See issue #118).
  Actors.registerSheet("archmage", ActorArchmageSheetV2, {
    label: "Character Sheet",
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

  // Track whether we overrode DsN's default inline roll parsing
  game.settings.register("archmage", "DsNInlineOverride", {
    name: "DsN Override",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  /**
   * Override the default Initiative formula to customize special behaviors of the D&D5e system.
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
    if (CONFIG.Combat.initiative.tiebreaker) parts.push(init / 100);
    else parts.push((actor.type === 'npc' ? 0.01 : 0));
    return parts.filter(p => p !== null).join(" + ");
  }
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

Hooks.once('ready', () => {

  let escalation = ArchmageUtility.getEscalation();
  let hide = game.combats.contents.length < 1 || escalation === 0 ? ' hide' : '';
  $('body').append(`<div class="archmage-escalation${hide}"><div class="ed-number">${escalation}</div><div class="ed-controls"><button class="ed-control ed-plus">+</button><button class="ed-control ed-minus">-</button></div></div>`);
  $('body').append('<div class="archmage-preload"></div>');

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
        const journalId = CONFIG.ARCHMAGE.statusEffects.find(x => x.id === id).journal;
        doc = await game.packs.get("archmage.conditions").getDocument(journalId);
        break;
      case "effect":
        console.warn("Effects not currently supported");
        break;
    }
    if ( !doc ) return;

    return doc.sheet.render(true);
  });

  // Add effect link drag data
  document.addEventListener("dragstart", event => {
    if ( !event.target.classList.contains("effect-link") ) return;
    let data = {
      type: event.target.dataset.type,
      id: event.target.dataset.id
    };
    if ( event.target.dataset.actorId ) data.actorId = event.target.dataset.actorId;
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  });

  // Wait to register the hotbar macros until ready.
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (['Item'].includes(data.type)) {
      createArchmageMacro(data, slot);
      return false;
    }
  });

  $('.message').off("contextmenu");
});

/* ---------------------------------------------- */

Hooks.on("renderSettings", async (app, html) => {
  let button = $(`<button id="archmage-reference-btn" data-action="archmage-help"><i class="fas fa-dice-d20"></i> Attributes and Inline Rolls Reference</button>`);
  html.find('button[data-action="controls"]').after(button);

  button.on('click', ev => {
    ev.preventDefault();
    new ArchmageReference().render(true);
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
    await tourGuide.registerTours();
    // @todo fix tours for v10
    // tourGuide.startNewFeatureTours();
  }
});

Hooks.on('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: "archmage", name: "Archmage" }, false);

  // Disable DsN's automatic parsing of inline rolls - let users enable it
  if (isNewerVersion(game.modules.get('dice-so-nice')?.version, "4.1.1")
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

    // If we have a Token, just toggle the effect
    // First load the token from a token actor (is null for linked)
    let token = actor.token;
    // If not, look for linked tokens in the scene
    if ( !token ) token = canvas.scene.tokens.find(
        t => (t.data.actorId === actor.id && t.isLinked)
      );
    if ( token ) return token._object.toggleEffect(statusEffect);

    // Otherwise, create the AE
    statusEffect.label = game.i18n.localize(statusEffect.label);
    return actor.createEmbeddedDocuments("ActiveEffect", [statusEffect]);
  }
  else if ( data.type === "effect" ) {
    const actorId = data.actorId;
    const sourceActor = game.actors.get(actorId);
    const effect = sourceActor.effects.get(data.id);
    let effectData = foundry.utils.duplicate(effect);
    console.dir(effectData);
    return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }
});

/* ---------------------------------------------- */

Hooks.on('dropCanvasData', (canvas, data) => {

  // Only process conditions for now
  if (data.type != 'condition') return;

  // Get the token at the drop point, if any
  const x = data.x;
  const y = data.y;
  const gridSize = canvas.scene.grid.size;
  // Get the set of targeted tokens
  const targets = Array.from(canvas.scene.data.tokens.values()).filter(t => {
    if ( !t.visible ) return false;
    return (t.data.x <= x
            && (t.data.x + t.data.width * gridSize) >= x
            && t.data.y <= y
            && (t.data.y + t.data.height * gridSize) >= y);
  });
  if (targets.length == 0) return;

  let token = targets[0];
  if (targets.length > 1) {
    // Select closest to center
    token =  targets.reduce((a, b) => {
      const cntr_x_a = a.data.x + a.data.width * gridSize / 2;
      const cntr_y_a = a.data.y + a.data.height * gridSize / 2;
      const dist_a = Math.sqrt(Math.pow(x - cntr_x_a, 2) + Math.pow(y - cntr_y_a, 2));
      const cntr_x_b = b.data.x + b.data.width * gridSize / 2;
      const cntr_y_b = b.data.y + b.data.height * gridSize / 2;
      const dist_b = Math.sqrt(Math.pow(x - cntr_x_b, 2) + Math.pow(y - cntr_y_b, 2));
      return ( dist_a < dist_b ? a : b );
    });
  }

  let statusEffect = foundry.utils.duplicate(CONFIG.statusEffects.find(x => x.id === data.id));

  // For conditions just toggle the effect
  return token._object.toggleEffect(statusEffect);

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
        app.render(true);
      }
    }
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
    let hasStrategist = actor.items.find(i => i.system.name.safeCSSId().includes('strategist'));
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
    return ui.notifications.warn("You can only create macro buttons for owned Items");
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
        return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
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
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
  }
}
