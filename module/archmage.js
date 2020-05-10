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

  game.archmage = {
    ActorArchmage,
    ActorArchmageSheet,
    ActorArchmageNPCSheet,
    DiceArchmage,
    ItemArchmage,
    ItemArchmageSheet
  };

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
    types: [],
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
    CONFIG.initiative.tiebreaker = tiebreaker;
    CONFIG.initiative.decimals = tiebreaker ? 2 : 0;
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
    if (CONFIG.initiative.tiebreaker) parts.push(actor.data.data.abilities.dex.value / 100);
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

/* ---------------------------------------------- */

/**
 * Parse inline rolls.
 */
Hooks.on('preCreateChatMessage', (data, options, userId) => {
  let $content = $(`<div class="wrapper">${data.content}</div>`);
  let $rolls = $content.find('.inline-result');
  let updated_content = null;

  // Iterate through inline rolls, add a class to crits/fails.
  for (let i = 0; i < $rolls.length; i++) {
    let $roll = $($rolls[i]);

    let roll_data = Roll.fromJSON(unescape($roll.data('roll')));
    let result = ArchmageUtility.inlineRollCritTest(roll_data);

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
                roll_data.formula = `(${roll_data.formula}) * 2`;
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