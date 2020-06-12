import { ARCHMAGE } from './setup/config.js';
import { ActorArchmage } from './actor/actor.js';
import { ActorArchmageSheet } from './actor/actor-sheet.js';
import { ActorArchmageNPCSheet } from './actor/actor-npc-sheet.js';
import { ItemArchmage } from './item/item.js';
import { ItemArchmageSheet } from './item/item-sheet.js';
import { CinderWeatherEffect } from './setup/weather.js';
import { ArchmageUtility } from './setup/utility-classes.js';
import { ArchmageReference } from './setup/utility-classes.js';
import { DiceArchmage } from './actor/dice.js';

Hooks.once('init', async function() {

  // CONFIG.debug.hooks = true;

  String.prototype.safeCSSId = function() {
    return encodeURIComponent(
      this.toLowerCase()
    ).replace(/%[0-9A-F]{2}/gi, '-');
  }

  Handlebars.registerHelper('safeCSSId', (arg) => {
    return `${arg}`.safeCSSId();
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
    types: ["character"],
    makeDefault: true
  });

  Actors.registerSheet("archmage", ActorArchmageNPCSheet, {
    types: ["npc"],
    makeDefault: true
  });

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
    "averageRecoveries": {
      name: "Average Recovery Rolls",
      hint: "Average results for recovery rolls instead of rolling them.",
      section: "Dice",
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
  game.settings.register('archmage', 'currentEscalation', {
    name: 'Current Escalation Die Value',
    hint: 'Automatically updated each combat round.',
    scope: 'world',
    config: false,
    default: 0,
    type: Number,
  });
  // Macro shorthand
  game.settings.register("archmage", "macroShorthand", {
    name: "Shortened Macro Syntax",
    hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

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

  // Configure the Rain particle
  CinderWeatherEffect.CINDER_CONFIG = mergeObject(SpecialEffect.DEFAULT_CONFIG, {
    'alpha': {
      'start': 0.94,
      'end': 0.77
    },
    'scale': {
      'start': 0.12,
      'end': 0.05,
      'minimumScaleMultiplier': 1.13
    },
    'color': {
      'list': [
        {
          'value': '#c20000',
          'time': 0
        },
        {
          'value': '#ffff12',
          'time': 0.3
        },
        {
          'value': '#ffffff',
          'time': 0.6
        },
        {
          'value': '#000000',
          'time': 1
        },
      ],
      'isStepped': false
    },
    'speed': {
      'start': 40,
      'end': 0,
      'minimumSpeedMultiplier': 0
    },
    'acceleration': {
      'x': 0,
      'y': 0
    },
    'maxSpeed': 0,
    'startRotation': {
      'min': 0,
      'max': 360
    },
    'noRotation': false,
    'rotationSpeed': {
      'min': 61,
      'max': 0
    },
    'lifetime': {
      'min': 3,
      'max': 5
    },
    'blendMode': 'normal',
    'frequency': 0.001,
    'emitterLifetime': -1,
    'maxParticles': 500,
    'pos': {
      'x': 0,
      'y': 0
    },
    'addAtBack': false
  }, { inplace: false });
  CONFIG.weatherEffects.cinder = CinderWeatherEffect;

  ArchmageUtility.replaceRollData();
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
  let escalation = game.settings.get('archmage', 'currentEscalation');
  let hide = game.combats.entities.length < 1 || escalation === 0 ? ' hide' : '';
  $('body').append(`<div class="archmage-escalation${hide}" data-value="${escalation}">${escalation}</div>`);
  $('body').append('<div class="archmage-preload"></div>');

  // Wait to register the hotbar macros until ready.
  Hooks.on("hotbarDrop", (bar, data, slot) => createArchmageMacro(data, slot));
});

/* ---------------------------------------------- */

Hooks.on("renderSettings", (app, html) => {
  let button = $(`<button id="archmage-help-btn" data-action="archmage-help"><i class="fas fa-dice-d20"></i> 13th Age Inline Rolls</button>`);
  html.find('button[data-action="controls"]').after(button);

  button.on('click', ev => {
    ev.preventDefault();
    new ArchmageReference().render(true);
  });
});

// Hijack compendium search.
Hooks.on('renderCompendium', async (compendium, html, options) => {
  if (compendium.metadata.entity == 'Actor') {
    // Build a search index.
    let monsters = await compendium.getContent();
    monsters.forEach(m => {
      let option = options.index.find(o => o._id == m._id);
      let data = m.data.data;
      option.search = {
        level: data.details.level ? data.details.level.value : null,
        class: data.details.class.value ? data.details.class.value : null,
        race: data.details.race.value ? data.details.race.value : null,
        size: data.details.size ? data.details.size.value : null,
        role: data.details.role ? data.details.role.value : null,
        type: data.details.type ? data.details.type.value : null,
      };
    });

    // Replace the markup.
    html.find('.directory-list').remove();
    let template = 'systems/archmage/templates/sidebar/apps/compendium.html';
    let content = await renderTemplate(template, options);
    html.find('.directory-header').after(content);

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
  }
});

/* ---------------------------------------------- */

/**
 * Parse inline rolls.
 */
Hooks.on('preCreateChatMessage', (data, options, userId) => {
  let $content = $(`<div class="wrapper">${data.content}</div>`);
  let $rolls = $content.find('.inline-result');
  let updated_content = null;

  let actor = game.actors.get(data.speaker.actor);
  if (data.speaker.token) {
    let token = canvas.tokens.get(data.speaker.token);
    actor = token.actor;
  }

  // Iterate through inline rolls, add a class to crits/fails.
  for (let i = 0; i < $rolls.length; i++) {
    let $roll = $($rolls[i]);

    let roll_data = Roll.fromJSON(unescape($roll.data('roll')));
    let result = ArchmageUtility.inlineRollCritTest(roll_data, actor);

    if (result.includes('crit')) {
      $roll.addClass('dc-crit');
    }
    else if (result.includes('fail')) {
      $roll.addClass('dc-fail');
    }

    // Update the array of roll HTML elements.
    $rolls[i] = $roll[0];
  }

  // Now that we know which rolls were crits, update the content string.
  $content.find('.inline-result').replaceWith($rolls);
  updated_content = $content.html();
  if (updated_content != null) {
    data.content = updated_content;
  }

  // Next, let's see if any of the crits were on attack lines.
  $content = $(`<div class="wrapper">${data.content}</div>`);
  let $rows = $content.find('.card-prop');

  if ($rows.length > 0) {
    // Assume no crit or fail.
    let has_crit = false;
    let has_fail = false;
    // Iterate through each of the card properties/rows.
    $rows.each(function(index) {
      // Determine if this line is for an attack and if it's a crit/fail.
      let $row_self = $(this);
      let row_text = $row_self.html();
      if (row_text.includes('Attack:')) {
        if (row_text.includes('dc-crit')) {
          has_crit = true;
        }
        if (row_text.includes('dc-fail')) {
          has_fail = true;
        }
      }

      // If so, determine if the current row (next iteration, usually) is a hit.
      if (has_crit || has_fail) {
        if (row_text.includes('Hit:')) {
          // If the hit row includes inline results, we need to reroll them.
          let $roll = $row_self.find('.inline-result');
          if ($roll.length > 0) {
            // Iterate through the inline rolls on the hit row.
            $roll.each(function(roll_index) {
              let $roll_self = $(this);
              // Retrieve the roll formula.
              let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));
              // If there's a crit, double the formula and reroll. If there's a
              // fail with no crit, 0 it out.
              if (has_crit) {
                roll_data.formula = `${roll_data.formula}+${roll_data.formula}`;
                $roll_self.addClass('dc-crit');
              }
              else {
                roll_data.formula = `0`;
                $roll_self.addClass('dc-fail');
              }
              // Reroll and recalculate.
              roll_data = roll_data.reroll();
              // Update inline roll's markup.
              $roll_self.attr('data-roll', escape(JSON.stringify(roll_data)));
              $roll_self.attr('title', roll_data.formula);
              $roll_self.html(`<i class="fas fa-dice-d20"></i> ${roll_data.total}`);
            });
          }
          // Update the row with the new roll(s) markup.
          $row_self.find('.inline-result').replaceWith($roll);
        }
      }
    });

    // If there was a crit, update the content again with the new damage rolls.
    if (has_crit || has_fail) {
      $content.find('.card-prop').replaceWith($rows);
      updated_content = $content.html();
      if (updated_content != null) {
        data.content = updated_content;
      }
    }
  }
});

// Override the inline roll click behavior.
Hooks.on('renderChatMessage', (chatMessage, html, options) => {
  html.find('a.inline-roll').addClass('inline-roll--archmage').removeClass('inline-roll');
  html.find('a.inline-roll--archmage').on('click', event => {
    event.preventDefault();
    const a = event.currentTarget;

    // For inline results expand or collapse the roll details
    if (a.classList.contains("inline-result")) {
      const roll = Roll.fromJSON(unescape(a.dataset.roll));
      // Build a die string of the die parts, including whether they're discarded.
      const dieTotal = roll.parts.reduce((string, r) => {
        if (typeof string == 'object') {
          string = '';
        }

        if (r.rolls) {
          string = `${string}${r.rolls.map(d => `<span class="${d.discarded ? 'die die--discarded' : 'die'}">${d.roll}</span>`).join('+')}`;
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

    // Otherwise execute the deferred roll
    else {
      const cls = CONFIG.ChatMessage.entityClass;

      // Get the "speaker" for the inline roll
      const actor = cls.getSpeakerActor(cls.getSpeaker());
      const rollData = actor ? actor.getRollData() : {};

      // Execute the roll
      const roll = new Roll(a.dataset.formula, rollData).roll();
      return roll.toMessage({ flavor: a.dataset.flavor }, { rollMode: a.dataset.mode });
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
    $escalationDiv.text(escalation);
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
  $escalationDiv.text(escalation);
}));

/* ---------------------------------------------- */

// Clear escalation die values.
Hooks.on('deleteCombat', (combat) => {
  game.settings.set('archmage', 'currentEscalation', 0);
  $('.archmage-escalation').addClass('hide');
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