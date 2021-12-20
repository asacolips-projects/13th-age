// @todo Remove this file, it's no longer used.
export class ActorSheetFlags extends BaseEntitySheet {
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
    return `${game.i18n.localize('ARCHMAGE.CHARACTERFLAGS.title')}: ${this.object.name}`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data used to render the special Actor traits selection UI
   * @return {Object}
   */
  getData() {
    const data = super.getData();
    data.actor = this.object;
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
  async _updateObject(event, formData) {
    const actor = this.object;
    const updateData = {
      flags: {
        archmage: expandObject(formData)
      }
    };

    let unset = false;
    const flags = updateData.flags.archmage;

    // Iterate over the flags which may be configured
    for (let [k, v] of Object.entries(flags)) {
      if ([undefined, null, "", false, 0].includes(v)) {
        delete flags[k];
        if (hasProperty(actor.data.flags, `archmage.${k}`)) {
          unset = true;
          flags[`-=${k}`] = null;
        }
      }
    }

    // Apply the changes
    await actor.update(updateData, { diff: false });
  }
}