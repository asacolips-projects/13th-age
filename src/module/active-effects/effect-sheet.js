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
      submitOnChange: false
    });
  }

  /* -------------------------------------------- */

  async getData(options) {
    const effect = await super.getData(options);

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

    for ( const change of effect.effect.changes ) {
      if ( change.key === "system.attributes.escalation.value" ) continue;
      setValue(effect, change.key, change.value);
    }

    const edChange = effect.effect.changes.find(x => x.key === "system.attributes.escalation.value");
    //effect.system.blockedFromEscalationDie = edChange ? edChange.value === "0" : false;

    effect.supportsDescription = game.release.generation >= 11;

    return effect;
  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    let ae = foundry.utils.duplicate(this.object);
    ae.label = formData.label;
    ae.icon = formData.icon;
    ae.description = formData.description;

    // Retrieve the existing effects.
    const effectData = this.getData();
    // @todo c.toObject(false) doesn't appear to be needed after v10, investigate
    // if we can clean this up after v10 stable.
    let changes = effectData?.data?.changes ? effectData.data.changes.map(c => typeof c.toObject !== 'undefined' ? c.toObject(false) : c) : [];

    // Build an array of effects from the form data
    let newChanges = [
      // Attacks
      {
        key: "system.attributes.attack.melee.bonus",
        value: formData.system.attributes.attack.melee.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.attack.ranged.bonus",
        value: formData.system.attributes.attack.ranged.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.attack.divine.bonus",
        value: formData.system.attributes.attack.divine.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.attack.arcane.bonus",
        value: formData.system.attributes.attack.arcane.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.critMod.atk.value",
        value: formData.system.attributes.critMod.atk.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },

      // Defenses
      {
        key: "system.attributes.ac.value",
        value: formData.system.attributes.ac.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.md.value",
        value: formData.system.attributes.md.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.pd.value",
        value: formData.system.attributes.pd.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.hp.value",
        value: formData.system.attributes.hp.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.recoveries.value",
        value: formData.system.attributes.recoveries.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.save.value",
        value: formData.system.attributes.save.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.disengage",
        value: formData.system.attributes.disengage,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "system.attributes.critMod.def.value",
        value: formData.system.attributes.critMod.def.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
    ];

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

    return this.object.update(ae);
  }
}
