export class EffectArchmageSheet extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "active-effect-sheet", "archmage", "item", "item-sheet"],
      template: "systems/archmage/templates/active-effects/effect.html",
      width: 560,
      height: 550,
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "effects"}],
      submitOnClose: true,
      submitOnChange: true,
      closeOnSubmit: false,
    });
  }

  /* -------------------------------------------- */

  async getData(options) {
    const context = await super.getData(options);

    function setValue(obj,access,value){
      if (typeof(access)=='string'){
        access = access.split('.');
      }
      if (access.length > 1){
        const key = access.shift();
        if ( !obj[key] ) obj[key] = {};
        setValue(obj[key],access,value);
      }
      else{
        obj[access[0]] = value;
      }
    }

    for ( const change of context.effect.changes ) {
      if ( change.key === "system.attributes.escalation.value" ) continue;
      setValue(context, change.key, change.value);
    }

    const edChange = context.effect.changes.find(x => x.key === "system.attributes.escalation.value");
    //effect.system.blockedFromEscalationDie = edChange ? edChange.value === "0" : false;

    context.supportsDescription = game.release.generation >= 11;
    context.durationOptions = CONFIG.ARCHMAGE.effectDurationTypes;
    context.isCharacter = this.object.parent.type === "character";
    context.isNpc = this.object.parent.type === "npc";

    // Get data from flag
    context.duration = context.effect.flags.archmage?.duration || "Unknown";
    context.ongoingDamage = context.effect.flags.archmage?.ongoingDamage || 0;
    context.ongoingDamageType = context.effect.flags.archmage?.ongoingDamageType || "";
    context.ongoingDamageCrit = context.effect.flags.archmage?.ongoingDamageCrit || false;

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Handle changing a Document's image.
   * @param {MouseEvent} event  The click event.
   * @returns {Promise}
   * @protected
   */
  _onEditImage(event) {
    const attr = event.currentTarget.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: path => {
        event.currentTarget.src = path;
        this.document.update({[attr]: path});
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  async _updateObject(event, formData) {
    let ae = foundry.utils.duplicate(this.object);
    ae.name = formData.name;
    ae.description = formData.description;
    ae.origin = formData.origin;

    // Duration and ongoing damage goes on a flag
    ae.flags.archmage = {
      duration: formData.duration,
      ongoingDamage: formData.ongoingDamage,
      ongoingDamageType: formData.ongoingDamageType,
      ongoingDamageCrit: formData.ongoingDamageCrit,
    };

    // Retrieve the existing effects.
    const effectData = await this.getData();
    let changes = effectData?.changes ? effectData.changes : [];

    // Build an array of effects from the form data
    let newChanges = [];

    function addChange(key) {
      let value = foundry.utils.getProperty(formData, key);
      // Ensure that weapon bonuses are valid formulas.
      if (key.includes('system.attributes.weapon')) {
        let stringValue = String(value).trim();
        // Ensure there's a prefix since this is appended to the dice roll.
        if (stringValue.length > 0 && !(stringValue.startsWith('+') || stringValue.startsWith('-'))) {
          stringValue = `+ ${stringValue}`;
        }
        // Validate the roll.
        if (Roll.validate(stringValue)) {
          value = stringValue;
        }
        // Prevent bad data.
        else {
          value = '';
        }
      }

      if ( !value ) return;
      newChanges.push({
        key: key,
        value: value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      });
    }

    // Attacks
    addChange("system.attributes.attackMod.value");
    addChange("system.attributes.attack.melee.bonus");
    addChange("system.attributes.attack.ranged.bonus");
    addChange("system.attributes.attack.divine.bonus");
    addChange("system.attributes.attack.arcane.bonus");
    addChange("system.attributes.weapon.melee.dice");
    addChange("system.attributes.weapon.ranged.dice");
    addChange("system.attributes.critMod.atk.value");

    // Defenses
    addChange("system.attributes.ac.value");
    addChange("system.attributes.md.value");
    addChange("system.attributes.pd.value");
    addChange("system.attributes.hp.max");
    addChange("system.attributes.recoveries.value");
    addChange("system.attributes.saves.bonus");
    addChange("system.attributes.disengageBonus");
    addChange("system.attributes.critMod.def.value");

    // Update the existing changes to replace duplicates.
    for (let i = 0; i < changes.length; i++) {
      const newChange = newChanges.find(c => c.key == changes[i].key);
      if (newChange) {
        // Replace with the new change and update the array to prevent duplicates.
        changes[i] = newChange;
        newChanges = newChanges.filter(c => c.key != changes[i].key);
      }
    }

    // Apply the combined effect changes.
    ae.changes = changes.concat(newChanges);

    if ( formData.system.blockedFromEscalationDie ) {
      ae.changes.push({
        key: 'system.attributes.escalation.value',
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: '0'
      });
    }

    // Filter changes for empty form fields.
    ae.changes = ae.changes.filter(c => c.value !== null);

    // Handle details fields.
    ae.disabled = !!formData?.effect?.disabled;

    return this.object.update(ae);
  }
}
