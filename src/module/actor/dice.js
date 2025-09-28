export class DiceArchmage {

  /**
   * A standardized helper function for managing core "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus,
   * Advantage, or Disadvantage respectively
   *
   * @param {Event} event The triggering event which initiated the roll
   * @param {Array} terms The dice roll component terms, excluding the initial
   *    d20
   * @param {Object} data Actor or item data against which to parse the roll
   * @param {String} template       The HTML template used to render the roll
   *    dialog
   * @param {String} title          The dice roll UI window title
   * @param {String} alias          The alias with which to post to chat
   * @param {Function} flavor       A callable function for determining the chat
   *    message flavor given terms and data
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
    terms,
    data,
    template,
    abilities,
    backgrounds,
    title,
    alias,
    actor,
    ability,
    background,
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
    let rollMode = game.settings.get("core", "rollMode");
    let rolled = false;
    let roll = async (html = null, data = {}) => {
      let flav = (flavor instanceof Function) ? flavor(terms, data) : title;

      // Don't include situational bonus unless it is defined
      if (!data.bonus && terms.indexOf('@bonus') !== -1) {
        terms.pop();
      }

      // Handle combat advantage.
      if (adv === 1) {
        terms[0] = ['2d20kh'];
        flav = `${title} (Advantage)`;
      }
      else if (adv === -1) {
        terms[0] = ['2d20kl'];;
        flav = `${title} (Disadvantage)`;
      }

      if (situational != 0) {
        terms.push(situational);
        flav = `${title} (${situational > 0 ? '+' + situational : situational})`;
      }

      let form = html ? html.find('form')[0] : null;
      rollMode = form ? form.rollMode.value : rollMode;

      // Execute the roll
      let roll = new Roll(terms.join('+'), data);
      await roll.evaluate();

      // Grab the template.
      const template = `systems/archmage/templates/chat/skill-check-card.html`;
      const token = actor.token;

      // Prepare chat data for the template.
      const chatData = {
        user: game.user.id,
        roll: roll,  // TODO: fix template to use rolls prop
        rolls: [roll],
        speaker: game.archmage.ArchmageUtility.getSpeaker(actor)
      };

      // Prepare template data.
      const templateData = {
        actor: actor,
        tokenId: token ? `${token.id}` : null,
        ability: {
          name: data.abilityName ?? null,
          bonus: data.abil ?? 0
        },
        background: {
          name: data.backgroundName ?? null,
          bonus: data.bg ?? 0
        },
        data: chatData
      };

      // Render the template.
      foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        game.archmage.ArchmageUtility.createChatMessage(chatData, { rollMode: rollMode });
      });
    };

    // Modify the roll and handle fast-forwarding
    let adv = 0;
    terms = ['1d20'].concat(terms);
    if (event?.shiftKey) {
      return roll(null, data);
    }
    else if (event?.altKey) {
      adv = 1;
      return roll(null, data);
    }
    else if (event?.ctrlKey || event?.metaKey) {
      adv = -1;
      return roll(null, data);
    }
    else {
      terms = terms.concat(['@bonus']);
    }

    // Render modal dialog
    template = template ||
      'systems/archmage/templates/chat/roll-dialog.html';
    let dialogData = {
      formula: terms.join(' + '),
      data: data,
      abilityCheck: data.abilityCheck ?? true,
      backgroundCheck: data.backgroundCheck ?? false,
      defaultAbility: false,
      defaultRollMode: rollMode,
      abilities: abilities ?? {},
      backgrounds: backgrounds ?? {},
      rollModes: CONFIG.Dice.rollModes
    };

    // If this is a background check, default to the highest ability score.
    if (data.backgroundCheck) {
      let highestAbility = -5;
      for (let ability of Object.values(abilities)) {
        if (Number(ability.mod) > highestAbility) {
          highestAbility = Number(ability.mod);
        }
      }
      dialogData.defaultAbility = highestAbility;
    }

    foundry.applications.handlebars.renderTemplate(template, dialogData).then(dlg => {
      new Dialog({
        title: title,
        content: dlg,
        buttons: {
          disadvantage: {
            label: game.i18n.localize("ARCHMAGE.rollDisadvantageShort"),
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
            label: game.i18n.localize("ARCHMAGE.rollNormal"),
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
            label: game.i18n.localize("ARCHMAGE.rollAdvantageShort"),
            callback: () => {
              adv = 1;
              rolled = true;
            }
          }
        },
        default: 'normal',
        close: html => {
          if (onClose) {
            onClose(html, terms, data);
          }
          if (rolled) {
            rollMode = html.find('[name="rollMode"]').val();
            data['bonus'] = html.find('[name="bonus"]').val();
            if (data.abilityCheck) {
              data['bg'] = html.find('[name="background"]').val();
              data['backgroundName'] = Number(data['bg']) > 0 ? html.find('[name="background"] option:selected').text() : null;
            }
            if (data.backgroundCheck) {
              data['abil'] = html.find('[name="ability"]').val();
              data['abilityName'] = !isNaN(Number(data['abil'])) ? html.find('[name="ability"] option:selected').data('label') : null;
            }
            roll(html, data);
          }
        }
      }, dialogOptions).render(true);
    });
  }

  /* -------------------------------------------- */

  /**
   * A standardized helper function for managing core "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus,
   * Critical, or no bonus respectively
   *
   * @param {Event} event The triggering event which initiated the roll
   * @param {Array} terms The dice roll component terms, excluding the initial
   *    d20
   * @param {Object} data Actor or item data against which to parse the roll
   * @param {String} template The HTML template used to render the roll dialog
   * @param {String} title The dice roll UI window title
   * @param {String} alias The alias with which to post to chat
   * @param {Function} flavor A callable function for determining the chat
   *    message flavor given terms and data
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
    terms,
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
      let roll = new Roll(terms.join('+'), data);
      let flav = (flavor instanceof Function) ? flavor(terms, data) : title;
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
      terms = terms.concat(['@bonus']);
    }

    // Construct dialog data
    template = template ||
      'systems/archmage/templates/chat/roll-dialog.html';
    let dialogData = {
      formula: terms.join(' + '),
      data: data,
      rollModes: CONFIG.Dice.rollModes
    };

    // Render modal dialog
    return new Promise(resolve => {
      foundry.applications.handlebars.renderTemplate(template, dialogData).then(dlg => {
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
              onClose(html, terms, data);
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

  static async BackgroundRoll (
    actor,
    { defaultBackground = null, defaultAbility = null }
  ) {
    const formatBonus = bonus => {
      return bonus >= 0 ? `+${bonus}` : `${bonus}`
    }

    const content = await renderTemplate(
      'systems/archmage/templates/chat/background-check-dialog.html',
      {
        abilities: Object.entries(actor.system.abilities).map(
          ([key, ability]) => ({
            key: key,
            label: key.toUpperCase(),
            bonus: formatBonus(ability.mod),
            checked: key === defaultAbility
          })
        ),
        backgrounds: Object.entries(actor.system.backgrounds)
          .filter(([_, bg]) => bg.bonus.value || bg.name.value)
          .map(([key, background]) => ({
            key: key,
            label: background.name.value,
            bonus: formatBonus(background.bonus.value),
            checked: background.name.value === defaultBackground
          })),
        rollModes: CONFIG.Dice.rollModes,
        defaultRollMode: game.settings.get('core', 'rollMode')
      }
    )

    new foundry.applications.api.DialogV2({
      window: {
        title: game.i18n.localize('ARCHMAGE.checkBackground'),
        resizeable: true
      },
      content: content,
      buttons: [
        {
          action: 'disadvantage',
          label: game.i18n.localize('ARCHMAGE.rollDisadvantageShort')
        },
        {
          action: 'minus4',
          label: '-4'
        },
        {
          action: 'minus2',
          label: '-2'
        },
        {
          action: 'normal',
          label: game.i18n.localize('ARCHMAGE.rollNormal')
        },
        {
          action: 'plus2',
          label: '+2'
        },
        {
          action: 'plus4',
          label: '+4'
        },
        {
          action: 'advantage',
          label: game.i18n.localize('ARCHMAGE.rollAdvantageShort')
        }
      ],
      submit: result => {
        console.log(`User picked option: ${result}`)
      }
    }).render({ force: true })
  }
}
