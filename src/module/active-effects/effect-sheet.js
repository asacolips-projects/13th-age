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

    for ( const change of effect.data.changes ) {
      if ( change.key === "data.attributes.escalation.value" ) continue;
      setValue(effect, change.key, change.value);
    }

    const edChange = effect.data.changes.find(x => x.key === "data.attributes.escalation.value");
    effect.data.blockedFromEscalationDie = edChange ? edChange.value === "0" : false;

    const combat = game.combats.get(effect.data.duration?.combat);
    effect.combatLabel = `${game.i18n.localize("COMBAT.Encounter")} ${game.combats.combats.findIndex(c => c === combat) + 1}`;

    if ( effect.data.origin ) {
      effect.hasOrigin = true;
      effect.originActor = game.actors.get(effect.data.origin)?.data?.name;
    }

    effect.effectDurations = CONFIG.ARCHMAGE.effectDurationChoices;

    effect.data.duration.lastsUntil = effect.data.flags.archmage?.lastsUntil ?? CONFIG.ARCHMAGE.effectDurationChoices.unset;
    if ( effect.data.duration.lastsUntil === "saveEnds" ) {
      effect.hasSaveEnds = true;
      effect.data.duration.save = effect.data.flags.archmage?.save ?? 11;
    }

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
        key: "data.attributes.attack.melee.bonus",
        value: formData.data.attributes.attack.melee.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.attack.ranged.bonus",
        value: formData.data.attributes.attack.ranged.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.attack.divine.bonus",
        value: formData.data.attributes.attack.divine.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.attack.arcane.bonus",
        value: formData.data.attributes.attack.arcane.bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },

      // Defenses
      {
        key: "data.attributes.ac.value",
        value: formData.data.attributes.ac.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.md.value",
        value: formData.data.attributes.md.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.pd.value",
        value: formData.data.attributes.pd.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.hp.value",
        value: formData.data.attributes.hp.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.recoveries.value",
        value: formData.data.attributes.recoveries.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.save.value",
        value: formData.data.attributes.save.value,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.attributes.disengage",
        value: formData.data.attributes.disengage,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      {
        key: "data.ongoingDamage",
        value: formData.data.ongoingDamage,
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM
      }
    ];

    if ( formData.data.blockedFromEscalationDie ) {
      ae.changes.push({
        key: 'data.attributes.escalation.value',
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: '0'
      });
    }

    ae.flags.archmage = {
      lastsUntil: formData.data.duration.lastsUntil,
      save: formData.data.duration.save
    };

    return this.object.update(ae);
  }
}
