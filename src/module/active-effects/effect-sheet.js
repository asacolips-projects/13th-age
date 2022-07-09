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
      submitOnChange: true
    });
  }

  /* -------------------------------------------- */

  getData(options) {
    const effect = super.getData(options);

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
    effect.system.blockedFromEscalationDie = edChange ? edChange.value === "0" : false;

    return effect;
  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    console.dir(formData);

    let ae = foundry.utils.duplicate(this.object);
    ae.label = formData.label;
    ae.icon = formData.icon;

    ae.changes = [
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
    ];

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
