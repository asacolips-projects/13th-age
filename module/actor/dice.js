export class DiceArchmage {

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
    backgrounds,
    title,
    alias,
    flavor,
    advantage = true,
    situational = 0,
    highlight = true,
    fastForward = true,
    onClose,
    dialogOptions
  }) {

    if (!dialogOptions) {
      dialogOptions = {
        width: 420
      };
    }

    // Inner roll function
    let speaker = ChatMessage.getSpeaker();
    let rollMode = game.settings.get("core", "rollMode");
    let rolled = false;
    let roll = (html = null) => {
      let flav = (flavor instanceof Function) ? flavor(parts, data) : title;

      // Don't include situational bonus unless it is defined
      if (!data.bonus && parts.indexOf('@bonus') !== -1) {
        parts.pop();
      }

      // Handle combat advantage.
      if (adv === 1) {
        parts[0] = ['2d20kh'];
        flav = `${title} (Advantage)`;
      }
      else if (adv === -1) {
        parts[0] = ['2d20kl'];;
        flav = `${title} (Disadvantage)`;
      }

      if (situational != 0) {
        parts.push(situational);
        flav = `${title} (${situational > 0 ? '+' + situational : situational})`;
      }

      let form = html.find('form')[0];
      rollMode = form ? form.rollMode.value : rollMode;

      // Execute the roll and send it to chat
      let roll = new Roll(parts.join('+'), data).roll();
      roll.toMessage({
        speaker: speaker,
        alias: alias,
        flavor: flav,
        highlightSuccess: roll.parts[0].total === 20,
        highlightFailure: roll.parts[0].total === 1
      }, { rollMode });
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
      backgrounds: backgrounds,
      rollModes: CONFIG.Dice.rollModes
    };
    renderTemplate(template, dialogData).then(dlg => {
      new Dialog({
        title: title,
        content: dlg,
        buttons: {
          disadvantage: {
            label: 'Dis.',
            callback: () => {
              adv = -1;
              rolled = true;
            }
          },
          pen4: {
            label: '-4',
            callback: () => {
              situational = -4;
              rolled = true;
            }
          },
          pen2: {
            label: '-2',
            callback: () => {
              situational = -2;
              rolled = true;
            }
          },
          normal: {
            label: 'Normal',
            callback: () => {
              rolled = true;
            }
          },
          bon2: {
            label: '+2',
            callback: () => {
              situational = 2;
              rolled = true;
            }
          },
          bon4: {
            label: '+4',
            callback: () => {
              situational = 4;
              rolled = true;
            }
          },
          advantage: {
            label: 'Adv.',
            callback: () => {
              adv = 1;
              rolled = true;
            }
          }
        },
        default: 'normal',
        close: html => {
          if (onClose) {
            onClose(html, parts, data);
          }
          if (rolled) {
            rollMode = html.find('[name="rollMode"]').val();
            data['bonus'] = html.find('[name="bonus"]').val();
            data['background'] = html.find('[name="background"]').val();
            console.log(html);
            roll(html);
          }
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
      rollModes: CONFIG.Dice.rollModes
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