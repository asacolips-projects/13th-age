// CONFIG.debug.hooks = true;

String.prototype.safeCSSId = function () {
  return encodeURIComponent(
    this.toLowerCase()
  ).replace(/%[0-9A-F]{2}/gi, '-');
}

// Power Settings
CONFIG.powerSources = {
  'class': 'Class',
  'race': 'Race',
  'item': 'Item',
  'other': 'Other'
};

CONFIG.powerTypes = {
  'power': 'Power',
  'feature': 'Feature',
  'talent': 'Talent',
  'maneuver': 'Maneuver',
  'spell': 'Spell',
  'other': 'Other'
};

CONFIG.powerUsages = {
  'at-will': 'At Will',
  'once-per-battle': 'Once Per Battle',
  'recharge': 'Recharge',
  'daily': 'Daily',
  'other': 'Other'
};

CONFIG.actionTypes = {
  'standard': 'Standard',
  'move': 'Move',
  'quick': 'Quick',
  'free': 'Free',
  'interrupt': 'Interrupt'
};

class DiceArchmage {

  /**
   * A standardized helper function for managing core 5e "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus,
   * Advantage, or Disadvantage respectively
   *
   * @param {Event} event The triggering event which initiated the roll
   * @param {Array} parts The dice roll component parts, excluding the initial
   *    d20
   * @param {Object} data Actor or item data against which to parse the roll
   * @param {String} template       The HTML template used to render the roll
   *    dialog
   * @param {String} title          The dice roll UI window title
   * @param {String} alias          The alias with which to post to chat
   * @param {Function} flavor       A callable function for determining the chat
   *    message flavor given parts and data
   * @param {Boolean} advantage     Allow rolling with advantage (and therefore
   *    also with disadvantage)
   * @param {Boolean} situational   Allow for an arbitrary situational bonus
   *    field
   * @param {Boolean} highlight     Highlight critical successes and failures
   * @param {Boolean} fastForward   Allow fast-forward advantage selection
   * @param {Function} onClose      Callback for actions to take when the dialog
   *    form is closed
   * @param {Object} dialogOptions  Modal dialog options
   *
   * @return {undefined}
   */
  static d20Roll({
    event,
    parts,
    data,
    template,
    title,
    alias,
    flavor,
    advantage = true,
    situational = true,
    highlight = true,
    fastForward = true,
    onClose,
    dialogOptions
  }) {

    // Inner roll function
    let rollMode = 'roll';
    let roll = () => {
      let flav = (flavor instanceof Function) ? flavor(parts, data) : title;
      if (adv === 1) {
        parts[0] = ['2d20kh'];
        flav = `${title} (Advantage)`;
      }
      else if (adv === -1) {
        parts[0] = ['2d20kl'];
        flav = `${title} (Disadvantage)`;
      }

      // Don't include situational bonus unless it is defined
      if (!data.bonus && parts.indexOf('@bonus') !== -1) {
        parts.pop();
      }

      // Execute the roll and send it to chat
      let roll = new Roll(parts.join('+'), data).roll();
      roll.toMessage({
        alias: alias,
        flavor: flav,
        rollMode: rollMode,
        highlightSuccess: roll.parts[0].total === 20,
        highlightFailure: roll.parts[0].total === 1
      });
    };

    // Modify the roll and handle fast-forwarding
    let adv = 0;
    parts = ['1d20'].concat(parts);
    if (event.shiftKey) {
      return roll();
    }
    else if (event.altKey) {
      adv = 1;
      return roll();
    }
    else if (event.ctrlKey || event.metaKey) {
      adv = -1;
      return roll();
    }
    else {
      parts = parts.concat(['@bonus']);
    }

    // Render modal dialog
    template = template ||
      'systems/archmage/templates/chat/roll-dialog.html';
    let dialogData = {
      formula: parts.join(' + '),
      data: data,
      rollModes: CONFIG.rollModes
    };
    renderTemplate(template, dialogData).then(dlg => {
      new Dialog({
        title: title,
        content: dlg,
        buttons: {
          advantage: {
            label: 'Advantage',
            callback: () => adv = 1
          },
          normal: {
            label: 'Normal',
          },
          disadvantage: {
            label: 'Disadvantage',
            callback: () => adv = -1
          }
        },
        default: 'normal',
        close: html => {
          if (onClose) {
            onClose(html, parts, data);
          }
          rollMode = html.find('[name="rollMode"]').val();
          data['bonus'] = html.find('[name="bonus"]').val();
          roll();
        }
      }, dialogOptions).render(true);
    });
  }

  /* -------------------------------------------- */

  /**
   * A standardized helper function for managing core 5e "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus,
   * Critical, or no bonus respectively
   *
   * @param {Event} event The triggering event which initiated the roll
   * @param {Array} parts The dice roll component parts, excluding the initial
   *    d20
   * @param {Object} data Actor or item data against which to parse the roll
   * @param {String} template The HTML template used to render the roll dialog
   * @param {String} title The dice roll UI window title
   * @param {String} alias The alias with which to post to chat
   * @param {Function} flavor A callable function for determining the chat
   *    message flavor given parts and data
   * @param {Boolean} critical Allow critical hits to be chosen
   * @param {Boolean} situational Allow for an arbitrary situational bonus field
   * @param {Boolean} fastForward Allow fast-forward advantage selection
   * @param {Function} onClose Callback for actions to take when the dialog form
   *    is closed
   * @param {Object} dialogOptions Modal dialog options
   *
   * @return {undefined}
   */
  static damageRoll({
    event,
    parts,
    data,
    template,
    title,
    alias,
    flavor,
    critical = true,
    situational = true,
    fastForward = true,
    onClose,
    dialogOptions
  }) {

    // Inner roll function
    let rollMode = 'roll';
    let roll = () => {
      let roll = new Roll(parts.join('+'), data);
      let flav = (flavor instanceof Function) ? flavor(parts, data) : title;
      if (crit) {
        roll.alter(0, 2);
        flav = `${title} (Critical)`;
      }

      // Execute the roll and send it to chat
      roll.toMessage({
        alias: alias,
        flavor: flav,
        rollMode: rollMode
      });

      // Return the Roll object
      return roll;
    };

    // Modify the roll and handle fast-forwarding
    let crit = 0;
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return roll();
    }
    else if (event.altKey) {
      crit = 1;
      return roll();
    }
    else {
      parts = parts.concat(['@bonus']);
    }

    // Construct dialog data
    template = template ||
      'systems/archmage/templates/chat/roll-dialog.html';
    let dialogData = {
      formula: parts.join(' + '),
      data: data,
      rollModes: CONFIG.rollModes
    };

    // Render modal dialog
    return new Promise(resolve => {
      renderTemplate(template, dialogData).then(dlg => {
        new Dialog({
          title: title,
          content: dlg,
          buttons: {
            critical: {
              condition: critical,
              label: 'Critical Hit',
              callback: () => crit = 1
            },
            normal: {
              label: critical ? 'Normal' : 'Roll',
            },
          },
          default: 'normal',
          close: html => {
            if (onClose) {
              onClose(html, parts, data);
            }
            rollMode = html.find('[name="rollMode"]').val();
            data['bonus'] = html.find('[name="bonus"]').val();
            data['background'] = html.find('[name="background"]').val();
            resolve(roll());
          }
        }, dialogOptions).render(true);
      });
    });
  }
}

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
class ActorArchmageSheet extends ActorSheet {

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes = options.classes.concat(['archmage', 'actor-sheet']);
    options.template = 'systems/archmage/templates/actor-sheet.html';
    options.width = 800;
    options.height = 960;
    return options;
  }

  /* -------------------------------------------- */

  // get actorType() {
  //   return this.actor.data.type;
  // }

  /* -------------------------------------------- */

  /**
   * Add some extra data when rendering the sheet to reduce the amount of logic
   * required within the template.
   *
   * @return {Object} sheetData
   */
  getData() {
    const sheetData = super.getData();

    this._prepareCharacterItems(sheetData);

    // Return data to the sheet
    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Powers
    const powers = [];
    const equipment = [];

    // // Classes
    // const classes = [];

    // // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Feats
      if (i.type === 'power') {
        // Add labels.
        i.data.powerSource.label = CONFIG.powerSources[i.data.powerSource.value];
        i.data.powerType.label = CONFIG.powerTypes[i.data.powerType.value];
        i.data.powerUsage.label = CONFIG.powerUsages[i.data.powerUsage.value];
        if (i.data.action) {
          i.data.actionTypes.label = CONFIG.actionTypes[i.data.action.value];
        }
        powers.push(i);
      }

      if (i.type === 'tool' || i.type === 'loot' || i.type === 'equipment') {
        equipment.push(i);
      }
    }

    // Assign and return
    actorData.powers = powers;
    actorData.equipment = equipment;
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param {HTML} html The prepared HTML object ready to be rendered into
   * the DOM.
   *
   * @return {undefined}
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Activate tabs
    html.find('.tabs').each((_, el) => {
      let tabs = $(el);
      let initial = this.actor.data.flags['_sheetTab-' + tabs.attr('data-tab-container')];
      new Tabs(tabs, initial, clicked => {
        this.actor.data.flags['_sheetTab-' + clicked.parent().attr('data-tab-container')] = clicked.attr('data-tab');
      });
    });

    // Configure Special Flags
    html.find('.configure-flags').click(this._onConfigureFlags.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) {
      return;
    }

    // // Activate MCE
    // let editor = html.find('.editor-content');
    // createEditor({
    //   target: editor[0],
    //   height: this.position.height - 260,
    //   setup: ed => {
    //     this._mce = ed;
    //   },
    //   // eslint-disable-next-line camelcase
    //   save_onsavecallback: ed => {
    //     let target = editor.attr('data-edit');
    //     this.actor.update({[target]: ed.getContent()}, true);
    //   }
    // }).then(ed => {
    //   this.mce = ed[0];
    //   // this.mce.focus();
    // });

    // Ability Checks
    html.find('.ability-name').click(ev => {
      let abl = ev.currentTarget.parentElement.getAttribute('data-ability');
      this.actor.rollAbility(abl);
    });

    // Weapon Attacks
    html.find('.weapon.rollable').click(ev => {
      let weapon = $(ev.currentTarget).data();
      var templateData = {
        actor: this.actor,
        item: { name: weapon.label },
        data: {
          powerUsage: { value: 'at-will' },
          attack: { value: `[[d20 + ${weapon.atk} + @attributes.escalation.value]]` },
          hit: { value: `[[${weapon.dmg}]]` },
          miss: { value: `${weapon.miss}` }
        }
      };

      let template = 'systems/archmage/templates/chat/action-card.html';
      renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
          user: game.user._id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: content
        });
      });
    });

    /* -------------------------------------------- */
    /*  Rollable Items                              */
    /* -------------------------------------------- */

    // html.find('.item .rollable').click(ev => {
    //   let itemId = Number($(ev.currentTarget).parents('.item').attr('data-item-id'));
    //   let Item = CONFIG.Item.entityClass;
    //   let item = new Item(this.actor.items.find(i => i.id === itemId), this.actor);
    //   item.roll();
    // });

    // Item summaries
    html.find('.item .item-name h4').click(event => this._onItemSummary(event));

    // Item Rolling
    html.find('.item .item-image').click(event => this._onItemRoll(event));
    html.find('.item--action h4').click(event => this._onItemRoll(event));
    html.find('.item--trait h4').click(event => this._onItemRoll(event));
    html.find('.item--nastier-special h4').click(event => this._onItemRoll(event));

    /* -------------------------------------------- */
    /*  Inventory
    /* -------------------------------------------- */

    // Create New Item
    html.find('.item-create').click(ev => {
      let header = event.currentTarget;
      let type = ev.currentTarget.getAttribute('data-item-type');
      this.actor.createOwnedItem({
        name: 'New ' + type.capitalize(),
        type: type,
        data: duplicate(header.dataset)
      });
    });

    html.find('.powers .item-create').on('contextmenu', ev => {
      var itemType = ev.currentTarget.getAttribute('data-item-type');

      let prepop = new ArchmagePrepopulate();
      let powerClass = this.actor.data.data.details.class.value.toLowerCase();
      let powerLevel = this.actor.data.data.details.level;

      prepop.getPowersList(powerClass, powerLevel).then((res) => {
        var options = {
          width: 720,
          height: 640,
          classes: ['archmage-prepopulate']
        };

        for (let i = 0; i < res.powers.length; i++) {
          if (res.powers[i].usage !== null) {
            res.powers[i].usageClass = _getPowerClasses(res.powers[i].usage)[0];
          }
          else {
            res.powers[i].usageClass = 'other';
          }
        }

        var templateData = {
          powers: res.powers,
          class: powerClass,
          itemType: 'power' // @TODO: Make this not hardcoded.
        }

        let template = 'systems/archmage/templates/prepopulate/powers--list.html';
        renderTemplate(template, templateData).then(content => {
          let d = new Dialog({
            title: "Import Power",
            content: content,
            buttons: {
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => null
              },
              submit: {
                icon: '<i class="fas fa-check"></i>',
                label: "Submit",
                callback: dlg => _onImportPower(dlg, this.actor)
              }
            }
          }, options);
          d.render(true);
        });
      });
    });

    function _getPowerClasses(inputString) {
      // Get the appropriate usage.
      let usage = 'other';
      let recharge = 0;
      let usageString = inputString !== null ? inputString.toLowerCase() : '';
      if (usageString.includes('will')) {
        usage = 'at-will';
      }
      else if (usageString.includes('recharge')) {
        usage = 'recharge';
        if (usageString.includes('16')) {
          recharge = 16;
        }
        else if (usageString.includes('11')) {
          recharge = 11;
        }
        else if (usageString.includes('6')) {
          recharge = 6;
        }
      }
      else if (usageString.includes('battle')) {
        usage = 'once-per-battle';
      }
      else if (usageString.includes('daily')) {
        usage = 'daily';
      }

      return [usage, recharge];
    }

    /**
     * Helper function to process relative links.
     *
     * This helper function processes relative links and replaces them as
     * external links to www.toolkit13.com.
     *
     * @param {String} inputString
     * @return {String}
     */
    function _replaceLinks(inputString) {
      var outputString = inputString;
      if (inputString !== undefined && inputString !== null) {
        if (inputString.includes('"/srd')) {
          outputString = inputString.replace(/\/srd/g, 'http://www.toolkit13.com/srd');
        }
      }
      return outputString;
    }

    function _onImportPower(dlg, actor) {
      let $selected = $(dlg[0]).find('input[type="checkbox"]:checked');

      if ($selected.length <= 0) {
        return;
      }

      let prepop = new ArchmagePrepopulate();
      for (let input of $selected) {
        let $powerInput = $(input);
        var type = $powerInput.data('item-type');
        prepop.getPowerById($powerInput.data('uuid')).then((res) => {
          if (res.powers.length > 0) {
            let power = res.powers[0];
            let attack = {
              label: "Attack",
              type: "String",
              value: power.attack
            };
            // Get the appropriate usage.
            let usageArray = _getPowerClasses(power.usage);
            let usage = usageArray[0];
            let recharge = usageArray[1];
            // Get the appropriate action.
            let action = 'standard';
            let actionString = power.action !== null ? power.action.toLowerCase() : '';
            if (actionString.includes('move')) {
              action = 'move';
            }
            else if (actionString.includes('quick')) {
              action = 'quick';
            }
            else if (actionString.includes('interrupt')) {
              action = 'interrupt';
            }
            else if (actionString.includes('free')) {
              action = 'free';
            }
            actor.createOwnedItem({
              name: power.title,
              data: {
                'powerUsage.value': usage,
                'actionType.value': action,
                'powerLevel.value': power.level,
                'range.value': power.type,
                'trigger.value': power.trigger,
                'target.value': power.target,
                'attack.value': power.attack,
                'hit.value': power.hit,
                'miss.value': power.miss,
                'missEven.value': power.missEven,
                'missOdd.value': power.missOdd,
                'cost.value': power.cost,
                'castBroadEffect.value': power.castBroadEffect,
                'castPower.value': power.castPower,
                'sustainedEffect.value': power.sustainedEffect,
                'finalVerse.value': power.finalVerse,
                'effect.value': _replaceLinks(power.effect),
                'special.value': _replaceLinks(power.special),
                'spellLevel3.value': power.spellLevel3,
                'spellLevel5.value': power.spellLevel5,
                'spellLevel7.value': power.spellLevel7,
                'spellLevel9.value': power.spellLevel9,
                'spellChain.value': power.spellChain,
                'breathWeapon.value': power.breathWeapon,
                'recharge.value': recharge,
                'feats.adventurer.description.value': power.featAdventurer,
                'feats.champion.description.value': power.featChampion,
                'feats.epic.description.value': power.featEpic,
              },
              type: type
            });
            return;
          }
        });
      }
    }

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      let itemId = $(ev.currentTarget).parents('.item').attr('data-item-id');
      let Item = CONFIG.Item.entityClass;
      // const item = new Item(this.actor.items.find(i => i.id === itemId), {actor: this.actor});
      const item = this.actor.getOwnedItem(itemId);
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      let li = $(ev.currentTarget).parents('.item');
      let itemId = li.attr('data-item-id');
      this.actor.deleteOwnedItem(itemId);
      li.slideUp(200, () => this.render(false));
    });

    /* -------------------------------------------- */
    /*  Miscellaneous
    /* -------------------------------------------- */

    /* Item Dragging */
    // Core handlers from foundry.js
    let dragHandler = ev => this._onDragItemStart(ev);
    // Custom handlers.
    // let dragHandlerArchmage = ev => this._onDragItemStartArchmage(ev);
    // let dragOverHandlerArchmage = ev => this._onDragOverArchmage(ev);
    // let dropHandlerArchmage = ev => this._onDropArchmage(ev);
    html.find('.item').each((i, li) => {
      li.setAttribute('draggable', true);
      li.addEventListener('dragstart', dragHandler, false);
      // li.addEventListener('dragstart', dragHandlerArchmage, false);
      // li.addEventListener('ondragover', dragOverHandlerArchmage, false);
      // li.addEventListener('ondrop', dropHandlerArchmage, false);
    });
  }

  _onDragItemStartArchmage(ev) {
    // @TODO: Remove this if obsolete.
    // Get the source item's array index.
    // let $self = $(ev.target);
    // ev.dataTransfer.dropEffect = 'move';
    // ev.dataTransfer.setData('itemIndex', $self.data('index'));
  }

  _onDragOverArchmage(ev) {
    // @TODO: Add class on hover.
  }

  _onDropArchmage(ev) {
    // @TODO: Remove class on drop.
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for the Traits tab button to configure special Character Flags
   */
  _onConfigureFlags(event) {
    event.preventDefault();
    new ActorSheetFlags(this.actor).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id"),
      item = this.actor.getOwnedItem(itemId);
    item.roll();
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemSummary(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let item = this.actor.getOwnedItem(li.attr("data-item-id"));
    let chatData = item.getChatData({ secrets: this.actor.owner });

    // Toggle summary
    if (li.hasClass('item--power')) {
      if (li.hasClass("expanded")) {
        let summary = li.children(".item-summary");
        summary.slideUp(200, () => summary.remove());
      } else {
        let div = $(`<div class="item-summary"></div>`);
        let descrip = $(`<div class="item-description">${chatData.description.value}</div>`);
        let tags = $(`<div class="item-tags"></div>`);
        let props = $(`<div class="item-properties"></div>`);
        let effects = $(`<div class="item-effects"></div>`);
        chatData.tags.forEach(t => tags.append(`<span class="tag tag--${t.label.safeCSSId()}">${t.value}</span>`));
        if (chatData.range.value !== null) {
          props.append(`<div class="tag tag--property tag--${chatData.range.value.safeCSSId()}"><em>${chatData.range.value}</em></div>`)
        }
        chatData.properties.forEach(p => props.append(`<span class="tag tag--property tag--${p.label.safeCSSId()}"><strong>${p.label}:</strong> ${p.value}</span>`));
        chatData.effects.forEach(e => props.append(`<div class="tag tag--property tag--${e.label.safeCSSId()}"><strong>${e.label}:</strong> ${e.value}</div>`));
        chatData.feats.forEach(f => props.append(`<div class="tag tag--feat tag--${f.label.safeCSSId()}"><strong>${f.label}:</strong><div class="description">${f.description}</div></div>`))
        div.append(tags);
        div.append(props);
        div.append(effects);
        div.append(descrip);
        li.append(div.hide());
        div.slideDown(200);
      }
      li.toggleClass("expanded");
    }
  }
}

/**
 * Parse inline rolls.
 */
Hooks.on('preCreateChatMessage', (message_class, data) => {
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
    $rows.each(function (index) {
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
            $roll.each(function (roll_index) {
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

Actors.unregisterSheet('core', ActorSheet);
Actors.registerSheet('archmage', ActorArchmageSheet, {
  types: [],
  makeDefault: true
});

class ActorArchmageNPCSheet extends ActorArchmageSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage', 'actor', 'npc-sheet']),
      width: 640,
      height: 720
    });
    return options;
  }

  get template() {
    const path = 'systems/archmage/templates/actors/';
    if (!game.user.isGM && this.actor.limited) return path + "limited-npc-sheet.html";
    return path + "actor-npc-sheet.html";
  }

  getData() {
    const sheetData = super.getData();

    this._prepareCharacterItems(sheetData.actor);

    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(actorData) {

    const actions = [];
    const traits = [];
    const nastierSpecials = [];

    // // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of actorData.items) {
      // i.img = i.img || DEFAULT_TOKEN;
      // Feats
      if (i.type === 'action') {
        let action = i;
        let properties = [
          'hit',
          'hit1',
          'hit2',
          'hit3',
          'hit4',
          'hit5',
          'miss'
        ];

        // Parse for simple markdown (italics and bold).
        for (var prop in i.data) {
          if (Object.prototype.hasOwnProperty.call(i.data, prop)) {
            if (properties.includes(prop)) {
              action.data[prop].formatted = parseMarkdown(i.data[prop].value);
            }
          }
        }

        actions.push(action);
      }
      else if (i.type === 'trait') {
        traits.push(i);
      }
      else if (i.type === 'nastierSpecial') {
        nastierSpecials.push(i);
      }
    }

    // Assign and return
    actorData.actions = actions;
    actorData.traits = traits;
    actorData.nastierSpecials = nastierSpecials;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.options.editable) return;
  }
}

Actors.registerSheet("archmage", ActorArchmageNPCSheet, {
  types: ["npc"],
  makeDefault: true
});


/* -------------------------------------------- */


/**
 * Override and extend the basic :class:`ItemSheet` implementation
 */
class ItemArchmageSheet extends ItemSheet {

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes = options.classes.concat(['archmage', 'item', 'item-sheet']);
    options.template = 'systems/archmage/templates/item-power-sheet.html';
    options.height = 400;
    return options;
  }

  constructor(item, options) {
    super(item, options);
    this.mce = null;
  }

  /* -------------------------------------------- */

  /**
   * Use a type-specific template for each different item type
   */
  get template() {
    let type = this.item.type;
    // Special cases.
    if (type === 'nastierSpecial') {
      type = 'nastier-special';
    }
    // Get template.
    return `systems/archmage/templates/items/item-${type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare item sheet data
   * Start with the base item data and extending with additional properties for
   * rendering.
   *
   * @return {undefined}
   */
  getData() {
    const data = super.getData();

    // Power-specific data
    if (this.item.type === 'power') {
      data['powerSources'] = CONFIG.powerSources;
      data['powerTypes'] = CONFIG.powerTypes;
      data['powerUsages'] = CONFIG.powerUsages;
      data['actionTypes'] = CONFIG.actionTypes;
    }

    if (this.actor) {
      let powerClass = 'monster';

      if (this.actor.type === 'character') {
        // Pass general character data.
        powerClass = this.actor.data.data.details.class.value.toLowerCase();
      }
  
      let powerLevel = this.actor.data.data.details.level.value;
      let powerLevelString = '';
  
      for (let i = 1; i <= powerLevel; i++) {
        if (powerLevelString.length < 1) {
          powerLevelString = '' + i;
        }
        else {
          powerLevelString = `${powerLevelString}+${i}`;
        }
  
        if (i >= 10) {
          break;
        }
      }
  
      data['powerClass'] = powerClass;
      data['powerLevel'] = powerLevelString;  
    }
    
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for interactive item sheet events.
   *
   * @param {HTML} html The prepared HTML object ready to be rendered into
   *
   * @return {undefined}
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Activate tabs
    new Tabs(html.find('.tabs'));

    $('.archmage-import-power').on('click', (event) => {
      let prepop = new ArchmagePrepopulate();
      let powerClass = $(event.target).data('class');
      let powerLevel = $(event.target).data('level');
      prepop.getPowersList(powerClass, powerLevel).then((res) => {
        var options = {
          width: 520,
          height: 640
        };

        let template = 'systems/archmage/templates/prepopulate/powers--list.html';
        renderTemplate(template, {
          powers: res.powers,
          class: powerClass
        }).then(content => {
          let d = new Dialog({
            title: "Import Power",
            content: content,
            buttons: {
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => null
              },
              submit: {
                icon: '<i class="fas fa-check"></i>',
                label: "Submit",
                callback: () => null
              }
            }
          }, options);
          d.render(true);
        });
      });
    });

    $('body').on('click', '.import-powers-link', (event) => {
      event.preventDefault();
      event.stopPropagation();
      let $self = $(event.currentTarget);
      let prepop = new ArchmagePrepopulate();
      prepop.getPowerById($self.data('uuid')).then((res) => {
        // console.log(res.powers[0]);
      });
    });
  }
}

Items.unregisterSheet("core", ItemSheet);
Items.registerSheet("archmage", ItemArchmageSheet, { makeDefault: true });

// Override CONFIG
CONFIG.Item.sheetClass = ItemArchmageSheet;

/* -------------------------------------------- */

/**
 * Extend the base Actor class to implement additional logic specialized for D&D5e.
 */
class ActorArchmage extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  prepareData() {
    super.prepareData();

    // Get the Actor's data object
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Prepare Character data
    if (actorData.type === 'character') {
      this._prepareCharacterData(data);
    }
    else if (actorData.type === 'npc') {
      this._prepareNPCData(data);
    }

    // Ability modifiers and saves
    for (let abl of Object.values(data.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = Math.floor((abl.value - 10) / 2) + data.attributes.level.value;
    }

    /**
     * Determine the median value.
     * @param {Array} values array of values to tset.
     *
     * @return {Int} The median value
     */
    function median(values) {
      values.sort(function (a, b) {
        return a - b;
      });

      if (values.length === 0) {
        return 0;
      }

      var half = Math.floor(values.length / 2);

      if (values.length % 2) {
        return values[half];
      }
      else {
        return (values[half - 1] + values[half]) / 2.0;
      }
    }

    var meleeAttackBonus = 0;
    var rangedAttackBonus = 0;
    var divineAttackBonus = 0;
    var arcaneAttackBonus = 0;
    
    var acBonus = 0;
    var mdBonus = 0;
    var pdBonus = 0;

    function getBonusOr0(type) {
      if (type && type.bonus) {
        return type.bonus;
      }
      return 0;
    }

    if (this.items) {
      this.items.forEach(function (item) {
        if (item.type === 'equipment') {
          meleeAttackBonus += getBonusOr0(item.data.data.attributes.attack.melee);
          rangedAttackBonus += getBonusOr0(item.data.data.attributes.attack.ranged);
          divineAttackBonus += getBonusOr0(item.data.data.attributes.attack.divine);
          arcaneAttackBonus += getBonusOr0(item.data.data.attributes.attack.arcane);

          acBonus += getBonusOr0(item.data.data.attributes.ac);
          mdBonus += getBonusOr0(item.data.data.attributes.md);
          pdBonus += getBonusOr0(item.data.data.attributes.pd);
        }
      });
    }

    // Attributes
    var improvedInit = 0;
    if (flags.archmage) {
      improvedInit = flags.archmage.improvedIniative ? 4 : 0;
    }
    data.attributes.init.mod = data.abilities.dex.mod + (data.attributes.init.value || 0) + improvedInit + data.attributes.level.value;
    // data.attributes.ac.min = 10 + data.abilities.dex.mod;

    // Set a copy of level in details in order to mimic 5e's data structure.
      data.details.level = data.attributes.level;

    if (actorData.type === 'character') {

      data.attributes.attack = {
        melee: {
          bonus: meleeAttackBonus
        },
        ranged: {
          bonus: rangedAttackBonus
        },
        divine: {
          bonus: divineAttackBonus
        },
        arcane: {
          bonus: arcaneAttackBonus
        }
      };

      data.attributes.ac.value = data.attributes.ac.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod]) + data.attributes.level.value + acBonus;
      data.attributes.pd.value = data.attributes.pd.base + median([data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod]) + data.attributes.level.value + pdBonus;
      data.attributes.md.value = data.attributes.md.base + median([data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod]) + data.attributes.level.value + mdBonus;

      // Skill modifiers
      // for (let skl of Object.values(data.skills)) {
      //   skl.value = parseFloat(skl.value || 0);
      //   skl.mod = data.abilities[skl.ability].mod + Math.floor(skl.value * data.attributes.prof.value);
      // }



      // Add level ability mods.
      // Replace the ability attributes in the calculator with custom formulas.
      let levelMultiplier = 1;
      if (data.attributes.level.value >= 5) {
        levelMultiplier = 2;
      }
      if (data.attributes.level.value >= 8) {
        levelMultiplier = 3;
      }

      if (levelMultiplier > 0) {
        for (let prop in data.abilities) {
          data.abilities[prop].dmg = levelMultiplier * data.abilities[prop].mod;
        }
      }

      // Set an attribute for weapon damage.
      if (data.attributes.weapon === undefined) {
        data.attributes.weapon = {
          melee: {
            dice: 'd8',
            value: 'd8',
            abil: 'str'
          },
          ranged: {
            dice: 'd6',
            value: 'd6',
            abil: 'dex'
          }
        };
      }
      // Handle some possibly unitialized variables. These can be tweaked through the sheet settings.
      data.attributes.weapon.melee.miss = data.attributes.weapon.melee.miss === undefined ? true : data.attributes.weapon.melee.miss;
      data.attributes.weapon.ranged.miss = data.attributes.weapon.ranged.miss === undefined ? false : data.attributes.weapon.ranged.miss;
      data.attributes.weapon.melee.abil = data.attributes.weapon.melee.abil === undefined ? 'str' : data.attributes.weapon.melee.abil;
      data.attributes.weapon.ranged.abil = data.attributes.weapon.ranged.abil === undefined ? 'dex' : data.attributes.weapon.ranged.abil;
      // Set calculated values.
      data.attributes.weapon.melee.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.melee.abil].mod + data.attributes.attack.melee.bonus;
      data.attributes.weapon.melee.value = `${data.attributes.level.value}${data.attributes.weapon.melee.dice}`;
      data.attributes.weapon.melee.dmg = data.abilities[data.attributes.weapon.melee.abil].dmg;

      data.attributes.weapon.ranged.attack = data.attributes.level.value + data.abilities[data.attributes.weapon.ranged.abil].mod + data.attributes.attack.ranged.bonus;
      data.attributes.weapon.ranged.value = `${data.attributes.level.value}${data.attributes.weapon.ranged.dice}`;
      data.attributes.weapon.ranged.dmg = data.abilities[data.attributes.weapon.ranged.abil].dmg;

    }

    // Get the escalation die value.
    data.attributes.escalation = {
      value: game.settings.get('archmage', 'currentEscalation')
    };

    if (actorData.type === 'character') {
      data.attributes.standardBonuses = {
        value: data.attributes.level.value + data.attributes.escalation.value
      };
    }

    // Return the prepared Actor data
    return actorData;
  }

  /* -------------------------------------------- */

  /**
   * Prepare Character type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareCharacterData(data) {

    // Level, experience, and proficiency
    data.attributes.level.value = parseInt(data.attributes.level.value);
  }

  /* -------------------------------------------- */

  /**
   * Prepare NPC type specific data
   * @param data
   *
   * @return {undefined}
   */
  _prepareNPCData(data) {
  }

  /* -------------------------------------------- */

  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param abilityId {String}    The ability id (e.g. "str")
   *
   * @return {undefined}
   */
  rollAbility(abilityId) {
    this.rollAbilityTest(abilityId);
  }

  /* -------------------------------------------- */

  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any
   * Situational Bonus
   * @param abilityId {String}    The ability ID (e.g. "str")
   *
   * @return {undefined}
   */
  rollAbilityTest(abilityId) {
    let abl = this.data.data.abilities[abilityId];
    let parts = ['@mod'];
    let flavor = `${abl.label} Ability Test`;

    // Call the roll helper utility
    DiceArchmage.d20Roll({
      event: event,
      parts: parts,
      data: {
        mod: abl.mod + this.data.data.attributes.level.value
      },
      title: flavor,
      alias: this.actor,
    });
  }
}

// Assign the actor class to the CONFIG
CONFIG.Actor.entityClass = ActorArchmage;

/* -------------------------------------------- */

/**
 * Override and extend the basic :class:`Item` implementation
 */
class ItemArchmage extends Item {

  /**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async roll() {

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/${this.data.type.toLowerCase()}-card.html`
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token.scene._id}.${token.id}` : null,
      item: this.data,
      data: this.getChatData()
    };

    // Basic chat message data
    const chatData = {
      user: game.user._id,
      speaker: {
        actor: this.actor._id,
        token: this.actor.token,
        alias: this.actor.name
      }
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperIDs("GM");
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Create the chat message
    return ChatMessage.create(chatData, { displaySheet: false });
  }

  /* -------------------------------------------- */
  /*  Chat Card Data
  /* -------------------------------------------- */

  getChatData(htmlOptions) {
    const data = this[`_${this.data.type}ChatData`]();
    data.description.value = data.description.value !== undefined ? enrichHTML(data.description.value, htmlOptions) : '';
    return data;
  }

  _powerChatData() {
    const data = duplicate(this.data.data);
    const tags = [
      {
        label: data.actionType.label,
        value: CONFIG.actionTypes[data.actionType.value]
      },
      {
        label: data.powerUsage.label,
        value: CONFIG.powerUsages[data.powerUsage.value]
      },
      {
        label: data.powerSource.label,
        value: CONFIG.powerSources[data.powerSource.value]
      },
      {
        label: data.powerType.label,
        value: CONFIG.powerTypes[data.powerType.value]
      },
      {
        label: data.powerLevel !== undefined ? data.powerLevel.label : 'Level',
        value: data.powerLevel !== undefined ? 'Level ' + data.powerLevel.value : 'Level ' + this.actor.data.data.details.level.value
      }
    ];
    const properties = [
      // {
      //   label: data.range.label,
      //   value: data.range.value
      // },
      {
        label: data.recharge.label,
        value: data.recharge.value
      },
      {
        label: data.trigger.label,
        value: data.trigger.value
      },
      {
        label: data.target.label,
        value: data.target.value
      },
      {
        label: data.attack.label,
        value: data.attack.value
      },
      {
        label: data.hit.label,
        value: data.hit.value
      },
      {
        label: data.miss.label,
        value: data.miss.value
      },
      {
        label: data.missEven.label,
        value: data.missEven.value
      },
      {
        label: data.missOdd.label,
        value: data.missOdd.value
      },
      {
        label: data.cost.label,
        value: data.cost.value
      }
    ];
    const feats = [
      {
        label: data.feats.adventurer.description.label,
        description: data.feats.adventurer.description.value,
        isActive: data.feats.adventurer.isActive.value
      },
      {
        label: data.feats.champion.description.label,
        description: data.feats.champion.description.value,
        isActive: data.feats.champion.isActive.value
      },
      {
        label: data.feats.epic.description.label,
        description: data.feats.epic.description.value,
        isActive: data.feats.epic.isActive.value
      }
    ];
    const effects = [
      {
        label: data.effect.label,
        value: data.effect.value
      },
      {
        label: data.castBroadEffect.label,
        value: data.castBroadEffect.value
      },
      {
        label: data.castPower.label,
        value: data.castPower.value
      },
      {
        label: data.sustainedEffect.label,
        value: data.sustainedEffect.value
      },
      {
        label: data.finalVerse.label,
        value: data.finalVerse.value
      },
      {
        label: data.spellLevel3.label,
        value: data.spellLevel3.value
      },
      {
        label: data.spellLevel5.label,
        value: data.spellLevel5.value
      },
      {
        label: data.spellLevel7.label,
        value: data.spellLevel7.value
      },
      {
        label: data.spellLevel9.label,
        value: data.spellLevel9.value
      },
      {
        label: data.spellChain.label,
        value: data.spellChain.value
      },
      {
        label: data.breathWeapon.label,
        value: data.breathWeapon.value
      },
      {
        label: data.special.label,
        value: data.special.value
      }
    ];
    data.tags = tags.filter(t => t.value !== null && t.value !== undefined && t.value != '');
    data.properties = properties.filter(p => p.value !== null && p.value !== undefined && p.value != '');
    data.feats = feats.filter(f => f.description !== null && f.description !== undefined && f.description !== '');
    data.effects = effects.filter(e => e.value !== null && e.value !== undefined && e.value != '');
    data.effect = {
      label: data.effect.label,
      value: data.effect.value
    };
    data.special = {
      label: data.special.label,
      value: data.special.value
    };
    return data;
  }

  _actionChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  _traitChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  _nastierSpecialChatData() {
    const data = duplicate(this.data.data);
    return data;
  }

  static chatListeners(html) {

    // Chat card actions
    html.on('click', '.card-buttons button', ev => {
      ev.preventDefault();

      // Extract card data
      const button = $(ev.currentTarget),
        messageId = button.parents('.message').attr("data-message-id"),
        senderId = game.messages.get(messageId).user._id,
        card = button.parents('.chat-card');

      // Confirm roll permission
      if (!game.user.isGM && (game.user._id !== senderId)) return;

      // Get the Actor from a synthetic Token
      let actor;
      const tokenKey = card.attr("data-token-id");
      if (tokenKey) {
        const [sceneId, tokenId] = tokenKey.split(".");
        let token;
        if (sceneId === canvas.scene._id) token = canvas.tokens.get(tokenId);
        else {
          const scene = game.scenes.get(sceneId);
          if (!scene) return;
          let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
          if (tokenData) token = new Token(tokenData);
        }
        if (!token) return;
        actor = Actor.fromToken(token);
      } else actor = game.actors.get(card.attr('data-actor-id'));

      // Get the Item
      if (!actor) return;
      const itemId = card.attr("data-item-id");
      let itemData = actor.items.find(i => i.id === itemId);
      if (!itemData) return;
      const item = new CONFIG.Item.entityClass(itemData, { actor: actor });

      // Get the Action
      const action = button.attr("data-action");

      // Weapon attack
      if (action === "weaponAttack") item.rollWeaponAttack(ev);
      else if (action === "weaponDamage") item.rollWeaponDamage(ev);
      else if (action === "weaponDamage2") item.rollWeaponDamage(ev, true);

      // Spell actions
      else if (action === "spellAttack") item.rollSpellAttack(ev);
      else if (action === "spellDamage") item.rollSpellDamage(ev);

      // Feat actions
      else if (action === "featAttack") item.rollFeatAttack(ev);
      else if (action === "featDamage") item.rollFeatDamage(ev);

      // Consumable usage
      else if (action === "consume") item.rollConsumable(ev);

      // Tool usage
      else if (action === "toolCheck") item.rollToolCheck(ev);
    });
  }
}

// Assign ItemArchmage class to CONFIG
CONFIG.Item.entityClass = ItemArchmage;


class ActorSheetFlags extends BaseEntitySheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return mergeObject(options, {
      id: "actor-flags",
      template: "systems/archmage/templates/actors/actor-flags.html",
      width: 500,
      closeOnSubmit: true
    });
  }

  /* -------------------------------------------- */

  /**
   * Configure the title of the special traits selection window to include the Actor name
   * @type {String}
   */
  get title() {
    return `${game.i18n.localize('Archmage.FlagsTitle')}: ${this.object.name}`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data used to render the special Actor traits selection UI
   * @return {Object}
   */
  getData() {
    const data = super.getData();
    data.flags = this._getFlags();
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Prepare an object of flags data which groups flags by section
   * Add some additional data for rendering
   * @return {Object}
   */
  _getFlags() {
    const flags = {};
    for (let [k, v] of Object.entries(CONFIG.Actor.characterFlags)) {
      if (!flags.hasOwnProperty(v.section)) flags[v.section] = {};
      let flag = duplicate(v);
      flag.type = v.type.name;
      flag.isCheckbox = v.type === Boolean;
      flag.isSelect = v.hasOwnProperty('choices');
      flag.value = this.entity.getFlag("archmage", k);
      flags[v.section][k] = flag;
    }
    return flags;
  }

  /* -------------------------------------------- */

  /**
   * Update the Actor using the configured flags
   * Remove/unset any flags which are no longer configured
   */
  _updateObject(event, formData) {
    const actor = this.object;
    const flags = duplicate(actor.data.flags.archmage || {});

    // Iterate over the flags which may be configured
    for (let [k, v] of Object.entries(CONFIG.Actor.characterFlags)) {
      if ([undefined, null, "", false].includes(formData[k])) delete flags[k];
      else if ((v.type === Number) && (formData[k] === 0)) delete flags[k];
      else flags[k] = formData[k];
    }

    // Set the new flags in bulk
    actor.update({ 'flags.archmage': flags });
  }
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
  }
};

Hooks.once("init", () => {
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

  /**
   * Override the default Initiative formula to customize special behaviors of the D&D5e system.
   * Apply advantage, proficiency, or bonuses where appropriate
   * Apply the dexterity score as a decimal tiebreaker if requested
   * See Combat._getInitiativeFormula for more detail.
   * @private
   */
  Combat.prototype._getInitiativeFormula = function (combatant) {
    const actor = combatant.actor;
    if (!actor) return "1d20";
    const init = actor.data.data.attributes.init;
    // Init mod includes dex + level + misc bonuses.
    const parts = ["1d20", init.mod];
    if (actor.getFlag("archmage", "initiativeAdv")) parts[0] = "2d20kh";
    if (CONFIG.initiative.tiebreaker) parts.push(actor.data.data.abilities.dex.value / 100);
    return parts.filter(p => p !== null).join(" + ");
  }

  /**
   * Override the default getRollData() method to add abbreviations for the
   * abilities and attributes properties.
   */
  const original = Actor.prototype.getRollData;
  Actor.prototype.getRollData = function () {
    const data = original.call(this);
    data.attr = data.attributes;
    data.abil = data.abilities;
    return data;
  };
});


/* ---------------------------------------------- */
// Particles

/**
 * A special full-screen weather effect which uses one Emitters to render cinders
 * @type {SpecialEffect}
 */
class CinderWeatherEffect extends SpecialEffect {
  static get label() {
    return 'Cinder';
  }

  /* -------------------------------------------- */

  getParticleEmitters() {
    return [this._getCinderEmitter(this.parent)];
  }

  /* -------------------------------------------- */

  _getCinderEmitter(parent) {
    const d = canvas.dimensions;
    const p = (d.width / d.size) * (d.height / d.size) * this.options.density.value;
    const config = mergeObject(this.constructor.CINDER_CONFIG, {
      spawnRect: {
        x: 0,
        y: -0.10 * d.height,
        w: d.width,
        h: d.height
      },
      maxParticles: p,
      frequency: 1 / p
    }, { inplace: false });
    return new PIXI.particles.Emitter(parent, ['ui/particles/snow.png'], config);
  }
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

Hooks.once('ready', () => {
  let escalation = game.settings.get('archmage', 'currentEscalation');
  let hide = game.combats.entities.length < 1 || escalation === 0 ? ' hide' : '';
  $('body').append(`<div class="archmage-escalation${hide}" data-value="${escalation}">${escalation}</div>`);
  $('body').append('<div class="archmage-preload"></div>');
});

/**
 * Class that defines utility methods for the Archmage system.
 */
class ArchmageUtility {

  /**
   * Get Escalation Die value.
   *
   * @param {object} combat
   *   (Optional) Combat to check the escalation for.
   *
   * @return {int} The escalation die value.
   */
  static getEscalation(combat = null) {
    // Get the current combat if one wasn't provided.
    if (!combat) {
      combat = game.combat;
    }

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.data.round;
      }
      // Format it for min/max values.
      if (round < 1) {
        return 0;
      }
      else if (round > 6) {
        return 6;
      }
      else {
        return round - 1;
      }
    }

    // Otherwise, return 0.
    return 0;
  }

  /**
   * Determine if roll includes a d20 crit.
   *
   * @param {object} roll
   *
   * @return {string} 'crit', 'fail', or 'normal'.
   */
  static inlineRollCritTest(roll) {
    for (let i = 0; i < roll.parts.length; i++) {
      var part = roll.parts[i];
      if (part.rolls) {
        let result = part.rolls.map((r) => {
          if (part.faces === 20) {
            if (r.roll === part.faces) {
              return 'crit';
            }
            else if (r.roll === 1) {
              return 'fail';
            }
            else {
              return 'normal';
            }
          }
          else {
            return 'normal';
          }
        });

        return result;
      }
      else {
        return 'none';
      }
    }
  }
}

// Update escalation die values.
Hooks.on('updateCombat', (async (combat, update) => {
  // Handle non-gm users.
  if (combat.current === undefined) {
    combat = game.combat;
  }
  if (combat.current.round !== combat.previous.round) {
    let escalation = ArchmageUtility.getEscalation(combat);
    var updated = false;
    game.settings.set('archmage', 'currentEscalation', escalation);

    // Update the current combtants.
    for (let combatant of combat.data.combatants) {
      if (combatant.actor !== undefined) {
        await combatant.actor.update({ 'data.attributes.escalation.value': escalation });
        updated = true;
      }
    }

    if (updated) {
      console.log('Updated escalation die value on combatants.');
    }

    // Update the escalation die tracker.
    let $escalationDiv = $('.archmage-escalation');
    $escalationDiv.attr('data-value', escalation);
    $escalationDiv.removeClass('hide');
    $escalationDiv.text(escalation);
  }
}));

// Update escalation die values on scene change.
Hooks.on('renderCombatTracker', (async () => {
  // Handle non-gm users.
  combat = game.combat;

  // Restore the escalation die.
  if (combat !== null) {
    let escalation = ArchmageUtility.getEscalation(combat);
    var updated = false;
    game.settings.set('archmage', 'currentEscalation', escalation);

    // Update the current combtants.
    for (let combatant of combat.data.combatants) {
      if (combatant.actor !== undefined) {
        await combatant.actor.update({ 'data.attributes.escalation.value': escalation });
        updated = true;
      }
    }

    if (updated) {
      console.log('Updated escalation die value on combatants.');
    }

    // Update the escalation die tracker.
    let $escalationDiv = $('.archmage-escalation');
    $escalationDiv.attr('data-value', escalation);
    $escalationDiv.removeClass('hide');
    $escalationDiv.text(escalation);
  }
  // Hide the escalation die.
  else {
    let escalation = 0;
    let $escalationDiv = $('.archmage-escalation');
    $escalationDiv.attr('data-value', escalation);
    $escalationDiv.addClass('hide');
    $escalationDiv.text(escalation);
  }
}));

// Clear escalation die values.
Hooks.on('deleteCombat', (combat) => {
  game.settings.set('archmage', 'currentEscalation', 0);
  $('.archmage-escalation').addClass('hide');
});

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