import { ArchmageBaseItemSheetV2 } from "./base-item-sheet-v2.js";

import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { ArchmageItemSheetVue } from "../../vue/components.vue.es.js";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class ArchmageItemSheetV2 extends VueRenderingMixin(ArchmageBaseItemSheetV2) {
  vueParts = {
    'archmage-item-sheet-vue': {
      component: ArchmageItemSheetVue,
      template: `<archmage-item-sheet-vue :context="context">Vue rendering for sheet failed.</archmage-item-sheet-vue>`
    }
  }

  spellFields = CONFIG.ARCHMAGE.is2e ? [
    'spellLevel2',
    'spellLevel3',
    'spellLevel4',
    'spellLevel5',
    'spellLevel6',
    'spellLevel7',
    'spellLevel8',
    'spellLevel9',
    'spellLevel10',
    'spellLevel11',
  ] : [
    'spellLevel3',
    'spellLevel5',
    'spellLevel7',
    'spellLevel9',
  ];
  powerFields = [
    'trigger',
    'sustainOn',
    'target',
    'always',
    'attack',
    'hit',
    'hitEven',
    'hitOdd',
    'crit',
    'miss',
    'missEven',
    'missOdd',
    'resources',
    'castBroadEffect',
    'castPower',
    'sustainedEffect',
    'finalVerse',
    'special',
    'effect',
    ...this.spellFields,
    'spellChain',
    'breathWeapon',
    'recharge',
  ];

  codeMirrorEditors = [];
  
  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["archmage-appv2", "item", "dialog-form", "standard-form"],
    actions: {
      onEditImage: this._onEditImage,
      edit: this._viewEffect,
      create: this._createEffect,
      delete: this._deleteEffect,
      toggle: this._toggleEffect
    },
    position: {
      width: 860,
      height: 630,
    },
    window: {
      resizable: true,
      controls: [
        {
          action: "showItemArtwork",
          icon: "fa-solid fa-image",
          label: "ITEM.ViewArt",
          ownership: "OWNER"
        },
      ]
    },
    actions: {
      createFeat: this._updateFeat,
      deleteFeat: this._updateFeat,
      moveFeatUp: this._updateFeat,
      moveFeatDown: this._updateFeat,
    },
    tag: 'form',
    form: {
      submitOnChange: true,
      submitOnClose: true,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }]
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.isOwner,
      limited: this.document.limited,
      // Add the item document.
      item: this.item.toObject(),
      // Adding system and flags for easier access
      system: this.item.system,
      flags: this.item.flags,
      // Rolldata.
      rollData: this.actor?.getRollData() ?? {},
      // Adding a pointer to CONFIG.ARCHMAGE
      config: CONFIG.ARCHMAGE,
      // Force re-renders. Defined in the vue mixin.
      _renderKey: this._renderKey ?? 0,
      // @todo add this after switching to DataModel
      // Necessary for formInput and formFields helpers
      // fields: this.document.schema.fields,
      // systemFields: this.document.system.schema.fields
    };

    console.log('context', context);

    // Handle enriched fields.
    const enrichmentOptions = {
      // Whether to show secret blocks in the finished html
      secrets: this.document.isOwner,
      // Data to fill in for inline rolls
      rollData: this.item?.getRollData() ?? {},
      // Relative UUID resolution
      relativeTo: this.item
    };

    // Enrich the description.
    context.editors = {
      'system.description.value': {
        enriched: await TextEditor.enrichHTML(this.item.system.description?.value ?? '', enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          name: 'system.description.value',
          toggled: true,
          collaborate: true,
          documentUUID: this.document.uuid,
          height: 300,
          value: context.system.description?.value ?? '',
        }),
      },
    };

    // Enrich other fields.
    for (let field of this.powerFields) {
      context.editors[field] = {
        // @todo write a power enricher.
        enriched: await this.wrapRolls(this.item.system[field].value ?? '', [], 'short', {}, field, enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          name: `system.${field}.value`,
          toggled: true,
          collaborate: true,
          documentUUID: this.document.uuid,
          height: 300,
          value: context.system[field]?.value ?? '',
        }),
      };
    }

    // Enrich feats.
    for (let [featKey, feat] of Object.entries(this.item.system.feats)) {
      context.editors[`feat.${featKey}`] = {
        enriched: await this.wrapRolls(feat.description.value ?? '', [], 'short', {}, featKey, enrichmentOptions),
        element: foundry.applications.elements.HTMLProseMirrorElement.create({
          name: `system.feats.${featKey}.description.value`,
          toggled: true,
          collaborate: true,
          documentUUID: this.document.uuid,
          height: 300,
          value: feat.description.value ?? '',
        }),
      }
    }

    for (let [field, editor] of Object.entries(context.editors)) {
      if (context.editors[field].element) {
        context.editors[field].element.innerHTML = context.editors[field].enriched;
      }
    }

    return context;
  }

  /* ---------------------------------------------------- */

  /**
   * Render the outer framing HTMLElement and mount the Vue application.
   * 
   * This occurs when the application is opened, but not on subsequent renders.
   * 
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   * 
   * @protected
   * @override
   */
  async _renderFrame(options) {
    const element = await super._renderFrame(options);

    // Add codemirror to the macro editor.
    if (game.modules.get('_CodeMirror')?.active && typeof CodeMirror !== undefined) {
      const macroEditors = this.vueRoot.$el.querySelectorAll('.power-macro-editor textarea');
      for (let textarea of macroEditors) {
        // @todo the value is hidden on first load. Not sure why.
        const editor = CodeMirror.fromTextArea(textarea, {
          ...CodeMirror.userSettings,
          mode: "javascript",
          lineNumbers: true,
          inputStyle: "contenteditable",
          autofocus: false,
          theme: game.settings.get("archmage", "nightmode") ? 'monokai' : 'default',
          readOnly: textarea.hasAttribute('readonly')
        })
        editor.on('change', (instance) => instance.save());
        this.codeMirrorEditors.push(editor);
      }
    }

    return element;
  }

  /**
   * Handle updates for the Vue application instance.
   * 
   * Normally, this would render the HTML for the content within the application.
   * However, for Vue, all we want to do is update the 'context' property that's
   * passed into the Vue application instance.
   * 
   * Unlinke _renderFrame(), this occurs on every update for the application.
   * 
   * @param {ApplicationRenderContext} context 
   * @param {RenderOptions} options 
   * @returns {Promise<string>}
   * 
   * @protected
   * @override
   */
  async _renderHTML(context, options) {
    await super._renderHTML(context, options);
    // Manually refresh codemirror editors.
    for (let editor of this.codeMirrorEditors) {
      editor.refresh();
    }
    return '';
  }

  /* ---------------------------------------------------- */

  /**
   * Add/delete/reorder feats on a power.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  static async _updateFeat(event, target) {
    let dataset = target.dataset;

    let item = this.item;
    if (item.type != "power") return;

    let featIndex = Number(dataset.featKey);
    let feats = item.system.feats;

    let change = (async () => {return;});
    switch(dataset.action) {
      case 'createFeat':
        if (feats) feats = Object.values(feats);
        else feats = [];
        feats.push({
          "description": {
            "type": "String",
            "value": ""
          },
          "isActive": {
            "type": "Boolean",
            "value": false
          },
          "tier": {
            "type": "String",
            "value": "adventurer"
          },
          "powerUsage": {
            "type": "String",
            "value": ""
          },
          "quantity": {
            "type": "Number",
            "value": null
          },
          "maxQuantity": {
            "type": "Number",
            "value": null
          }
        });
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'deleteFeat':
        change = (async () => {
          let newFeats = foundry.utils.deepClone(feats);
          delete newFeats[featIndex];
          newFeats = Object.assign({}, Object.values(newFeats));  // Re-index from 0
          let updateData = {'system.feats': newFeats};
          for (let key of Object.keys(item.system.feats)) {
            if (!newFeats[key]) updateData[`system.feats.-=${key}`] = null;
          }
          await item.update(updateData);
        });
        break;
      case 'moveFeatUp':
        if (featIndex == 0) return;
        feats = Object.values(feats);
        [feats[featIndex], feats[featIndex - 1]] = [feats[featIndex - 1], feats[featIndex]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
      case 'moveFeatDown':
        feats = Object.values(feats);
        if (featIndex >= feats.length - 1) return;
        [feats[featIndex + 1], feats[featIndex]] = [feats[featIndex], feats[featIndex + 1]]
        await item.update({'system.feats': Object.assign({}, feats)});
        return;
    }

    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      await change();
      return;
    }
    foundry.applications.api.DialogV2.prompt({
      window: {title: 'Delete feat?'},
      content: `<p>${game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm")}</p>`,
      rejectClose: false,
      ok: {
        callback: (event, button, dialog) => {
          change();
        }
      }
    });
  }

  /* ---------------------------------------------------- */

  async wrapRolls(text, replacements = [], diceFormulaMode = 'short', rollData = null, field = null, enrichmentOptions = {}) {
    // Unproxy the roll data object.
    rollData = rollData ? JSON.parse(JSON.stringify(rollData)) : {};
  
    // Fallback.
    if (!diceFormulaMode) diceFormulaMode = 'short';
  
    // Build a map of string replacements.
    let replaceMap = replacements.concat([
      // Put these at the top for higher replacement priority
      ['[[/r', '<span class="expression">'],
      ['(@lvl)d(@wpn.m.dieNum-2)', '(WPN-2)'],
      ['(@lvl)d(@wpn.r.dieNum-2)', '(WPN-2)'],
      // Common replacements
      ['[[', '<span class="expression">'],
      [']]', '</span>'],
      ['@ed', 'ED'],
      ['@lvl', 'LVL'],
      ['@std', 'LVL+ED'], //STD
      ['@tier', 'TIER'],
      ['@str.mod', 'STR'],
      ['@str.dmg', 'STR×TIER'],
      ['@con.mod', 'CON'],
      ['@con.dmg', 'CON×TIER'],
      ['@dex.mod', 'DEX'],
      ['@dex.dmg', 'DEX×TIER'],
      ['@int.mod', 'INT'],
      ['@int.dmg', 'INT×TIER'],
      ['@wis.mod', 'WIS'],
      ['@wis.dmg', 'WIS×TIER'],
      ['@cha.mod', 'CHA'],
      ['@cha.dmg', 'CHA×TIER'],
      ['@atk.mod', 'ATK'],
      ['@wpn.m.dice', 'WPN'],
      ['@wpn.r.dice', 'WPN'],
      ['@wpn.j.dice', 'JAB'],
      ['@wpn.p.dice', 'PUNCH'],
      ['@wpn.k.dice', 'KICK'],
      ['@atk.m.bonus', 'ITM'], //ITM_MLE
      ['@atk.r.bonus', 'ITM'], //ITM_RNG
      ['@atk.a.bonus', 'ITM'], //ITM_ARC
      ['@atk.d.bonus', 'ITM'], //ITM_DIV
      ['@animalCompanion.atk', 'Animal Atk'],
      ['@animalCompanion.dmg', 'Animal Dmg'],
      // Do this last to remove stray multiplication symbols
      ['*', '×']
    ]);
  
    // Remove whitespace from inline rolls.
    let clean = text ? text?.toString() ?? '' : '';  // cast to string, could be e.g. number
  
    clean = this.replaceEffectAndConditionReferences(clean)
    clean = this.replaceActiveEffectLinkReferences(clean);
  
    // Handle replacements for the 'short' syntax. Ex: WPN+DEX+LVL
    if (diceFormulaMode == 'short') {
      // Remove additional whitespace.
      clean.toString().replace(/(\[\[)([^\[]*)(\]\])/g, (match) => {
        clean = clean.replace(match, match.replaceAll(' ', ''));
      });
      // Iterate over all of our potential replacements and replace them if
      // they're present.
      for (let [needle, replacement] of replaceMap) {
        clean = clean.replaceAll(needle, replacement);
      };
    }
    // Handle replacements for the 'long' syntax, which is the original inline
    // roll. Ex: [[@wpn.m.dice+@dex+@lvl]]
    else if (diceFormulaMode == 'long') {
      // Run a regex over all inline rolls.
      clean = clean.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
        return `<span class="expression">[${p2}]</span>`;
      });
    }
    // Handle replacements for the 'numeric' syntax, which replacements all
    // numeric and static terms and condenses them into as few numbers as
    // possible. Ex: 5d8+9
    else if (diceFormulaMode == 'numeric') {
      // Run a regex over all inline rolls.
      clean = clean.toString().replaceAll(/(\[\[)([^\[]*)(\]\])/g, (match, p1, p2, p3) => {
        // Get the roll formula. If this is an attack, append the attack mod.
        let rollFormula = field == 'attack' && p2.includes('d20') ? `${p2} + @atk.mod` : p2;
        // Create the roll and evaluate it.
        let roll = null;
        try {
          roll = new Roll(rollFormula, rollData);
          // @todo this sort of works in v12? It's aysnc, which should be problematic
          // in this context.
          roll.evaluate();
        } catch (error) {
          roll = null;
          if (rollFormula.startsWith('/')) {
            rollFormula = `[[${rollFormula}]]`;
            console.log(`Skipping numeric roll replacement for ${rollFormula}`);
          }
          else {
            rollFormula = `[${rollFormula}]`;
            console.warn(error);
          }
        }
        // Duplicate the roll into a condensed version that combines numbers
        // where possible.
        const newRoll = roll?.formula ? this.rollCondenser(roll) : { formula: rollFormula };
        // Return the replacement.
        return `<span class="expression">${newRoll.formula}</span>`;
      });
    }
  
    // Call TextEditor.enrichHTML to process remaining object links
    clean = await TextEditor.enrichHTML(clean, enrichmentOptions);
  
    // Return the revised text and convert markdown to HTML.
    return parseMarkdown(clean);
  }

  replaceEffectAndConditionReferences(text) {
    let conditions = CONFIG.ARCHMAGE.statusEffects.filter(x => x.journal);
    const conditionNames = new Set(conditions.map(x => game.i18n.localize(x.name)));

    function generateConditionLink(name) {
        const condition = conditions.find(x => game.i18n.localize(x.name) === name);
        return `<a class="effect-link" data-type="condition" data-id="${condition.id}" title="">
                <img class="effects-icon" src="${condition.icon}" />
                ${name}</a>`;
    }

    for (const name of conditionNames) {
        const link = generateConditionLink(name);
        const regex = new RegExp(`\\*${name}\\*`, "ig");
        text = text.replace(regex, link);
    }

    return text;
  }

  replaceActiveEffectLinkReferences(text) {
    return text.replaceAll(/@UUID\[(.*ActiveEffect.*)\]({.*})*/g, (all, uuid, name) => {
      const effect = fromUuidSync(uuid);
      const parent = effect?.parent?.uuid ? effect.parent : {};
      // Not technically draggable due to the item itself being draggable.
      return `<a class="effect-link" data-uuid="${uuid}" data-source="${parent?.uuid}" data-actor-id="${parent?.id}" data-type="ActiveEffect" data-tooltip="Base Active Effect">
        <img class="effects-icon" src="${effect.img}"/>
        ${effect.name}
      </a>`;
    });
  }

  /**
   * Condense numeric and operator terms into a single numeric term.
   *
   * @param {array} terms Array of roll term objects.
   * @returns {array}
   */
  termCondenser(terms) {
    const last = terms.length - 1;
    // Deal with trailing operators.
    if (terms[last]?.operator) {
      terms.splice(last, 1);
    }
    // If there aren't enough terms, exit early.
    if (terms.length < 1) {
      return false;
    }
    // Attempt to create a roll from the terms.
    let r = null;
    try {
      r = Roll.fromTerms(terms);
    } catch (error) {
      console.warn(error);
      return false;
    }
    // Create a new term from the total.
    let t = new foundry.dice.terms.NumericTerm({number: r.total}).toJSON();
    t.evaluated = true;
    // Return the new NumericTerm instance.
    return foundry.dice.terms.NumericTerm.fromJSON(JSON.stringify(t));
  }

  /**
   * Duplicate a roll and return a new version where numeric terms are combined
   * into as few numeric terms as possible. For example, d20+5+3 will become
   * d20+8.
   *
   * @param {object} roll Roll object to modify.
   * @returns
   */
  rollCondenser(roll) {
    // Initialize our variables.
    let originalTerms = roll.terms;
    let newTerms = [];
    let nestedTerms = [];
    let operator = null;
    let condensedTerm = null;
    let previousTermType = null;

    // Iterate over the original terms.
    originalTerms.forEach(term => {
      // Force the terms to be considered evaluated.
      term.evaluated = true;
      term._evaluated = true;
      // Check to see what kind of term this is.
      switch (term.constructor.name) {
        // If this is a numeric term, push it to our temporary nestedTerms array.
        case 'NumericTerm':
          nestedTerms.push(term);
          break;

        // If this is an operator term, also push it to the temporary nestedTerms
        // array (but skip in certain cases).
        case 'OperatorTerm':
          // If this is the first operator, store that for later when we build
          // our final terms array. Don't store it if it's a double operator and
          // negative (usually means something like d12 + -2).
          // @todo this isn't quite functional yet. Doesn't work well with d12 - d8 + d6 + -3.
          if (previousTermType !== 'OperatorTerm') {
            operator = term;
          }
          // If this is the first term and is multiplication or division, don't
          // include it in our array since we can't condense it.
          if (nestedTerms.length < 1) {
            if (['*', '/'].includes(term.operator)) {
              break;
            }
          }
          // Append the operator.
          nestedTerms.push(term);
          break;

        // If this is any other kind of term, add to our newTerms array.
        default:
          // If our nestedTerms array has been modified, append it.
          if (nestedTerms.length > 0) {
            // If there's an operator, we neeed to append it first.
            if ((operator) && (nestedTerms.length > 1 || nestedTerms[0].constructor.name !== 'OperatorTerm')) {
              newTerms.push(operator);
            }
            // Condense the nestedTerms array into a single numeric term and
            // append it.
            condensedTerm = nestedTerms.length > 1 ? termCondenser(nestedTerms) : nestedTerms[0];
            if (condensedTerm) newTerms.push(condensedTerm);
          }
          // Make sure that there's an operator if we're appending a dice after
          // we previously appended a non-operator.
          if (newTerms.length > 0 && !newTerms[newTerms.length - 1]?.operator) {
            operator = foundry.dice.terms.OperatorTerm.fromJSON(JSON.stringify({
              class: 'OperatorTerm',
              evaluated: true,
              _evaluated: true,
              operator: '+'
            }));
            newTerms.push(operator);
          }
          // Append our current term as well.
          newTerms.push(term);
          // Reset the nested terms and operator now that they're part of the
          // newTerms array.
          nestedTerms = [];
          operator = null;
          break;
      }

      // Update our previous term for the next iteration.
      previousTermType = term.constructor.name;
    });

    // After the loop completes, we need to also append the operator and
    // nestedTerms if there are any stragglers.
    if (nestedTerms.length > 0) {
      if (operator) {
        operator.evaluated = true;
        operator._evaluated = true;
        newTerms.push(operator);
      }
      condensedTerm = nestedTerms.length > 1 ? termCondenser(nestedTerms) : nestedTerms[0];
      if (condensedTerm) newTerms.push(condensedTerm);
    }

    // Generate the roll and return it.
    let newRoll = false;
    try {
      newRoll = Roll.fromTerms(newTerms);
    } catch (error) {
      // Return the unmodified roll if there's an error.
      console.warn(error);
      return roll;
    }

    return newRoll;
  }
}
