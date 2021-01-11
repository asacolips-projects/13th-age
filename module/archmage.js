import { ARCHMAGE } from './setup/config.js';
import { ActorArchmage } from './actor/actor.js';
import { ActorArchmageSheet } from './actor/actor-sheet.js';
import { ActorArchmageNPCSheet } from './actor/actor-npc-sheet.js';
import { ItemArchmage } from './item/item.js';
import { ItemArchmageSheet } from './item/item-sheet.js';
import { CinderWeatherEffect } from './setup/weather.js';
import { ArchmageUtility } from './setup/utility-classes.js';
import { ArchmageReference } from './setup/utility-classes.js';
import { ContextMenu2 } from './setup/contextMenu2.js';
import { DamageApplicator } from './setup/damageApplicator.js';
import { DiceArchmage } from './actor/dice.js';
import { TourGuide } from './tours/tourguide.js';

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
    // "strongRecovery": {
    //   name: "Strong Recovery",
    //   hint: "General feat to reroll some of your recovery die, keeping highest",
    //   section: "Feats",
    //   type: Boolean
    // },
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
});

/* ---------------------------------------------- */

Hooks.on("renderSettings", (app, html) => {
  let button = $(`<button id="archmage-help-btn" data-action="archmage-help"><i class="fas fa-dice-d20"></i> Attributes and Inline Rolls Reference</button>`);
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

  // User guide
  let docs = html.find("button[data-action='docs']");
  $(`<button data-action="userguide"><i class="fas fa-file" aria-hidden="true"></i>System Wiki</button>`).insertAfter(docs);
  html.find('button[data-action="userguide"]').click(ev => {
    new FrameViewer('https://mageflame.github.io/Toolkit13/', {resizable: true}).render(true);
  });


  // This is intentionally in renderSettings, as it is one of the last bits of HTML to get rendered, which is required for the Tour to hook in
  let tourGuide = new TourGuide();
  tourGuide.startNewFeatureTours();
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
  let $content = $(`<div class="wrapper">${data.content}</div>`);
  let $rolls = $content.find('.inline-result');
  let rollTotal = undefined;
  let rollTarget = "";
  let originalRolls = $rolls;
  let updated_content = null;
  let hasHit = undefined;
  let hasMissed = undefined;
  let targetsHit = [];
  let targetsMissed = [];
  let targets = [...game.user.targets.values()];

  // TODO (#74): All card evaluation needs to load from Localization
  let rowsToSkip = ["Level:", "Recharge:", "Cost:", "Uses Remaining:", "Special:", "Effect:", "Cast for Broad Effect:", "Cast for Power:", "Opening and Sustained Effect:", "Final Verse:", "Chain Spell", "Breath Weapon:"];

  let tokens = canvas.tokens.controlled;
  let actor = tokens ? tokens[0] : null;

  if (data?.speaker?.actor) {
    actor = game.actors.get(data.speaker.actor);
    if (data.speaker.token) {
      let token = canvas.tokens.get(data.speaker.token);
      actor = token.actor;
    }
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

    let rollResult = 0;
    // console.log(roll_data);

    if (!isNewerVersion(game.data.version, "0.7")) {
      roll_data.parts.forEach(p => {
        if (p.faces === 20) {
          rollResult = p.total;
        }
      });
    }
    else {
      roll_data.terms.forEach(p => {
        if (p.faces === 20) {
          rollResult = p.total;
        }
      });
    }



    // Update the array of roll HTML elements.
    $rolls[i] = $roll[0];
    $rolls[i].d20result = rollResult;
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

      if (rowsToSkip.filter(x => row_text.includes(x)).length > 0) {
        return;
      }

      if (row_text.includes('Attack:')) {
        if (row_text.includes('dc-crit')) {
          has_crit = true;
        }
        if (row_text.includes('dc-fail')) {
          has_fail = true;
        }

        // If the user currently has Targets selected, try and figure out if we hit or missed said target
        //console.log(targets);

        if (targets.length > 0) {
          if (row_text.toLowerCase().includes(" ac")) {
            rollTarget = "ac";
          }
          else if (row_text.toLowerCase().includes(" pd")) {
            rollTarget = "pd";
          }
          else if (row_text.toLowerCase().includes(" md")) {
            rollTarget = "md";
          }

          let $roll = $row_self.find('.inline-result');
          // If there isn't exactly one roll, then we can't parse it
          if ($roll.length === 1) {
            // Iterate through the inline rolls on the hit row.
            $roll.each(function(roll_index) {
              let $roll_self = $(this);
              let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));
              rollTotal = roll_data.total;
            });
          }

          //console.log(rollTotal + " vs " + rollTarget);

          if (rollTotal != undefined) {
            targets.forEach(target => {
              //console.log(target);

              var targetDefense = getTargetDefenseValue(target);

              var hit = rollTotal >= targetDefense;
              //console.log(rollTotal + " vs " + targetDefense + " ? " + hit);

              // Keep track of hasHit and hasMissed seperately in case we have a group of enemies we are targetting
              if (hit) {
                targetsHit.push(target.data.name);
                if (hasHit == undefined || !hasHit) {
                  hasHit = true;
                }
                if (hasMissed == undefined) {
                  hasMissed = false;
                }
              }
              else {
                targetsMissed.push(target.data.name);
                if (hasMissed == undefined || !hasMissed) {
                  hasMissed = true;
                }
                if (hasHit == undefined) {
                  hasHit = false;
                }
              }
            });
          }

          //console.log(targetsHit);
          //console.log(targetsMissed);

          // Get either the Token overridden value or the base sheet value
          function getTargetDefenseValue(target) {
            //console.log(target);
            if (target.data?.actorData?.data?.attributes != undefined) {
              // Return token overridden value
              if (target.data.actorData.data.attributes[rollTarget]) {
                return target.data.actorData.data.attributes[rollTarget].value;
              }
            }
            return target.actor.data.data.attributes[rollTarget].value;
          }
        }
      }


      if (row_text.includes('Target:') && targets.length > 0) {

        function shuffle(a) {
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        }

        if (row_text.toLowerCase().includes("random")) {
          targets = shuffle(targets);
        }

        // If there are 3 targets selected but the attack only can hit 2 (ex: result of 1d3 nearby targets), then we slice to that amount, in order of selection (unless randomized)

        // This regex just finds any numbers in the string, and we use the first one
        var regex = new RegExp("\\d+");
        var scoreToBeatArray = regex.exec($row_self[0].innerText);

        if (scoreToBeatArray && scoreToBeatArray.length == 1) {
          var maxTargets = parseInt(scoreToBeatArray[0]);
          //console.log("MaxTargets " + maxTargets);

          targets = targets.slice(0, maxTargets);
        }

        var text = document.createTextNode(" (" + targets.map(x => x.name).join(", ") + ")");
        $row_self[0].appendChild(text);
      }


      // Append hit targets to text
      if (row_text.includes('Hit:') && targetsHit.length > 0) {
        $row_self.find('strong').after("<span> (" + targetsHit.join(", ") + ") </span>")
      }

      // Append missed targets to text
      if (row_text.includes('Miss:') && targetsMissed.length > 0) {
        $row_self.find('strong').after("<span> (" + targetsMissed.join(", ") + ") </span>")
      }


      // Determine if this line is a "Trigger" - something like "Natural 16+:" or "Even Miss:"
      var triggerText = row_text.toLowerCase();
      //console.log(triggerText);
      if (triggerText.includes("natural") || triggerText.includes("miss:") || triggerText.includes("hit:")) {

        var active = undefined;

        // We've previously setup all d20's in the rolls to have a value. Rolls that aren't a d20 will have a value of 0, which gets filtered out. We cancel checking if there are more than one.
        var rollResults = $rolls.toArray().map(x => x.d20result).filter(x => x > 0);
        if (rollResults.length > 1) {
          console.log("Archmage | Multi-attack rolls are not supported for Trigger evaluation, skipping.");

          // Empty out our data arrays so we don't apply errant styling
          targetsHit = [];
          targetsMissed = [];
          hasHit = undefined;
          hasMissed = undefined;
          return;
        }
        var rollResult = rollResults[0];

        if (triggerText.includes("even")) {
          if (rollResult % 2 == 0) {
            active = true;
            if (hasHit != undefined) {
              if (triggerText.includes("hit") && !hasHit) {
                active = false;
              }
            }
            if (hasMissed != undefined) {
              if (triggerText.includes("miss") && !hasMissed) {
                active = false;
              }
            }
          }
          else {
            active = false;
          }
        }

        else if (triggerText.includes("odd")) {
          if (rollResult % 2 == 1) {
            active = true;

            if (hasHit != undefined) {
              if (triggerText.includes("hit") && !hasHit) {
                active = false;
              }
            }
            if (hasMissed != undefined) {
              if (triggerText.includes("miss") && !hasMissed) {
                active = false;
              }
            }
          }
          else {
            active = false;
          }
        }

        else if (triggerText.includes("+") && !triggerText.includes("hit") && !triggerText.includes("miss")) {

          // This regex just finds any numbers in the string, and we use the first one
          var regex = new RegExp("\\d+");
          var scoreToBeatArray = regex.exec(triggerText);
          if (scoreToBeatArray && scoreToBeatArray.length == 1) {
            var scoreToBeat = parseInt(scoreToBeatArray[0]);
            if (rollResult >= scoreToBeat) {
              active = true;
            }
            else {
              active = false;
            }
          }
        }

        if (hasHit != undefined) {
          // We've already handled even / odd + hit / miss when evaluating even / odd
          if (triggerText.includes("hit") && !triggerText.includes("even") && !triggerText.includes("odd")) {

            if (hasHit) {
              active = true;
            }
            else {
              active = false;
            }
          }
        }

        if (hasMissed != undefined) {
          if (triggerText.includes("miss") && !triggerText.includes("even") && !triggerText.includes("odd")) {

            if (hasMissed) {
              active = true;
            }
            else {
              active = false;
            }
          }
        }

        if (active == undefined) {
          $row_self.addClass("trigger-unknown");
        }
        else if (active) {
          $row_self.addClass("trigger-active");
        }
        else {
          $row_self.addClass("trigger-inactive");
          if (game.settings.get("archmage", "hideInsteadOfOpaque")) {
            $row_self.addClass("hide");
          }
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
              //////////////////////////////////////////////////////////////////////////
              //////////////// DEPRECATED CODE - 0.6.X COMPATIBILITY ///////////////////
              //////////////////////////////////////////////////////////////////////////
              if (!isNewerVersion(game.data.version, "0.7")) {
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
              }
              //////////////////////////////////////////////////////////////////////////
              //////////////////////// END OF DEPRECATED CODE //////////////////////////
              //////////////////////////////////////////////////////////////////////////
              {
                let new_formula = roll_data.formula;
                // If there's a crit, double the formula and reroll. If there's a
                // fail with no crit, 0 it out.
                if (has_crit) {
                  new_formula = `${roll_data.formula}+${roll_data.formula}`;
                  $roll_self.addClass('dc-crit');
                }
                else {
                  new_formula = `0`;
                  $roll_self.addClass('dc-fail');
                }
                // Reroll and recalculate.
                let new_roll = new Roll(new_formula).roll();
                // Update inline roll's markup.
                $roll_self.attr('data-roll', escape(JSON.stringify(new_roll)));
                $roll_self.attr('title', new_roll.formula);
                $roll_self.html(`<i class="fas fa-dice-d20"></i> ${new_roll.total}`);
              }
            });
          }
          // Update the row with the new roll(s) markup.
          $row_self.find('.inline-result').replaceWith($roll);
        }
        if (row_text.includes('Miss:')) {
          let $roll = $row_self.find('.inline-result');
                    if ($roll.length > 0) {
            // Iterate through the inline rolls on the hit row.
            $roll.each(function(roll_index) {
                let $roll_self = $(this);
                // Retrieve the roll formula.
                let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));
                //////////////////////////////////////////////////////////////////////////
                //////////////// DEPRECATED CODE - 0.6.X COMPATIBILITY ///////////////////
                //////////////////////////////////////////////////////////////////////////
                if (!isNewerVersion(game.data.version, "0.7")) {
                  // If there's a crit, double the formula and reroll. If there's a
                  // fail with no crit, 0 it out.
                  if (has_fail)
                  {
                    roll_data.formula = `0`;
                    $roll_self.addClass('dc-fail');
                  }
                  // Reroll and recalculate.
                  roll_data = roll_data.reroll();
                  // Update inline roll's markup.
                  $roll_self.attr('data-roll', escape(JSON.stringify(roll_data)));
                  $roll_self.attr('title', roll_data.formula);
                  $roll_self.html(`<i class="fas fa-dice-d20"></i> ${roll_data.total}`);
                }
                //////////////////////////////////////////////////////////////////////////
                //////////////////////// END OF DEPRECATED CODE //////////////////////////
                //////////////////////////////////////////////////////////////////////////
                else
                {
                  let new_formula = roll_data.formula;
                  // If there's a crit, double the formula and reroll. If there's a
                  // fail with no crit, 0 it out.
                  if (has_fail) {
                    new_formula = `0`;
                    $roll_self.addClass('dc-fail');
                  }
                  // Reroll and recalculate.
                  let new_roll = new Roll(new_formula).roll();
                  // Update inline roll's markup.
                  $roll_self.attr('data-roll', escape(JSON.stringify(new_roll)));
                  $roll_self.attr('title', new_roll.formula);
                  $roll_self.html(`<i class="fas fa-dice-d20"></i> ${new_roll.total}`);
              }
            });
          }
        }
      }
    });

    // Update the content
    $content.find('.card-prop').replaceWith($rows);
    updated_content = $content.html();
    if (updated_content != null) {
      data.content = updated_content;
    }
  }
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

// Clear escalation die values.
Hooks.on('deleteCombat', (combat) => {
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