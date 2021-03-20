<template>
  <section :class="classes" data-tab="settings">
    <h2 class="unit-title">{{localize('Settings')}}</h2>
    <section class="sheet-settings grid grid-6col">
      <!-- Main Settings -->
      <div class="unit unit--base-settings">
        <div class="sub-unit sub-unit--base-ac flexrow">
          <strong class="unit-subtitle">{{localize('Base AC')}}</strong>
          <input type="number" name="data.attributes.ac.base" v-model="actor.data.attributes.ac.base"/>
        </div>
        <div class="sub-unit sub-unit--base-pd flexrow">
          <strong class="unit-subtitle">{{localize('Base PD')}}</strong>
          <input type="number" name="data.attributes.pd.base" v-model="actor.data.attributes.pd.base"/>
        </div>
        <div class="sub-unit sub-unit--base-md flexrow">
          <strong class="unit-subtitle">{{localize('Base MD')}}</strong>
          <input type="number" name="data.attributes.md.base" v-model="actor.data.attributes.md.base"/>
        </div>
        <div class="sub-unit sub-unit--base-hp flexrow">
          <strong class="unit-subtitle">{{localize('Base HP')}}</strong>
          <input type="number" name="data.attributes.hp.base" step=".1" v-model="actor.data.attributes.hp.base"/>
        </div>
        <div class="sub-unit sub-unit--base-recoveries flexrow">
          <strong class="unit-subtitle">{{localize('Base Recoveries')}}</strong>
          <input type="number" name="data.attributes.recoveries.base" v-model="actor.data.attributes.recoveries.base"/>
        </div>
        <div class="sub-unit sub-unit--calculate-max-hp flexrow">
          <strong class="unit-subtitle">{{localize('Calculate Max HP?')}}</strong>
          <input type="checkbox" name="data.attributes.hp.automatic" v-model="actor.data.attributes.hp.automatic"/>
        </div>
        <div class="sub-unit sub-unit--calculate-max-recoveries flexrow">
          <strong class="unit-subtitle">{{localize('Calculate Max Recoveries?')}}</strong>
          <input type="checkbox" name="data.attributes.recoveries.automatic" v-model="actor.data.attributes.recoveries.automatic"/>
        </div>
        <div class="sub-unit sub-unit--initiative-adjustment flexrow">
          <strong class="unit-subtitle">{{localize('Initiative Adjustment')}}</strong>
          <input type="number" name="data.attributes.init.value" v-model="actor.data.attributes.init.value" placeholder="0"/>
        </div>
        <div class="sub-unit sub-unit--recovery-dice flexrow">
          <strong class="unit-subtitle">{{localize('Recovery Die')}}</strong>
          <input type="text" name="data.attributes.recoveries.dice" v-model="actor.data.attributes.recoveries.dice" placeholder="d8"/>
        </div>
        <div class="sub-unit sub-unit--melee">
          <div class="sub-unit sub-unit--melee-dice flexrow">
            <strong class="unit-subtitle">{{localize('Melee Weapon Die')}}</strong>
            <input type="text" name="data.attributes.weapon.melee.dice" v-model="actor.data.attributes.weapon.melee.dice" placeholder="d8"/>
          </div>
          <div class="sub-unit sub-unit--melee-ability flexcol">
            <strong class="unit-subtitle">{{localize('Melee Weapon Ability')}}</strong>
            <select name="data.attributes.weapon.melee.abil" v-model="actor.data.attributes.weapon.melee.abil">
              <option value="str">{{localize('ARCHMAGE.str.key')}}</option>
              <option value="dex">{{localize('ARCHMAGE.dex.key')}}</option>
              <option value="con">{{localize('ARCHMAGE.con.key')}}</option>
              <option value="int">{{localize('ARCHMAGE.int.key')}}</option>
              <option value="wis">{{localize('ARCHMAGE.wis.key')}}</option>
              <option value="cha">{{localize('ARCHMAGE.cha.key')}}</option>
            </select>
          </div>
          <div class="sub-unit sub-unit--melee-miss flexrow">
            <strong class="unit-subtitle">{{localize('Melee Miss Damage')}}</strong>
            <input type="checkbox" name="data.attributes.weapon.melee.miss" v-model="actor.data.attributes.weapon.melee.miss"/>
          </div>
        </div>
        <div class="sub-unit sub-unit--ranged">
          <div class="sub-unit sub-unit--ranged-dice flexrow">
            <strong class="unit-subtitle">{{localize('Ranged Weapon Die')}}</strong>
            <input type="text" name="data.attributes.weapon.ranged.dice" v-model="actor.data.attributes.weapon.ranged.dice" placeholder="d8"/>
          </div>
          <div class="sub-unit sub-unit--ranged-ability flexcol">
            <strong class="unit-subtitle">{{localize('Ranged Weapon Ability')}}</strong>
            <select name="data.attributes.weapon.ranged.abil" v-model="actor.data.attributes.weapon.ranged.abil">
              <option value="str">{{localize('ARCHMAGE.str.key')}}</option>
              <option value="dex">{{localize('ARCHMAGE.dex.key')}}</option>
              <option value="con">{{localize('ARCHMAGE.con.key')}}</option>
              <option value="int">{{localize('ARCHMAGE.int.key')}}</option>
              <option value="wis">{{localize('ARCHMAGE.wis.key')}}</option>
              <option value="cha">{{localize('ARCHMAGE.cha.key')}}</option>
            </select>
          </div>
          <div class="sub-unit sub-unit--ranged-miss flexrow">
            <strong class="unit-subtitle">{{localize('Ranged Miss Damage')}}</strong>
            <input type="checkbox" name="data.attributes.weapon.ranged.miss" v-model="actor.data.attributes.weapon.ranged.miss"/>
          </div>
        </div>
      </div>
      <!-- Flag Settings -->
      <div class="unit unit--flags">
        <div v-for="(flag, f) in flags" :key="f" :data-key="f" class="settings-flags">
          <label :for="concat('flags.archmage.', f)" class="unit-subtitle flexrow"><input type="checkbox" :name="concat('flags.archmage.', f, )" v-model="flag.value"> {{flag.name}}</label>
          <p class="notes">{{flag.hint}}</p>
        </div>
      </div>
      <!-- Background Settings -->
      <div class="unit unit--backgrounds">
        <div v-for="(background, b) in actor.data.backgrounds" :key="b" class="settings-background" :data-key="b">
          <strong class="unit-subtitle">{{localize(concat('ARCHMAGE.CHARACTERSETTINGS.', b))}}</strong>
          <input type="checkbox" :name="concat('data.backgrounds.', b, '.isActive.value')" v-model="background.isActive.value">
        </div>
      </div>
      <!-- Icon Settings -->
      <div class="unit unit--icons">
        <div v-for="(icon, i) in actor.data.icons" :key="i" class="settings-icon" :data-key="i">
          <strong class="unit-subtitle">{{localize(concat('ARCHMAGE.CHARACTERSETTINGS.', i))}}</strong>
          <input type="checkbox" :name="concat('data.icons.', i, '.isActive.value')" v-model="icon.isActive.value">
        </div>
      </div>
      <!-- Resource Settings -->
      <div class="unit unit--resources">
        <div v-for="(resource, r) in resources" :key="r" class="settings-resource" :data-key="r">
          <strong class="unit-subtitle">{{localize(concat('ARCHMAGE.CHARACTERSETTINGS.', r))}}</strong>
          <input type="checkbox" :name="concat('data.resources.spendable.', r, '.enabled')" v-model="resource.enabled">
        </div>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor', 'owner', 'tab'],
  data: () => ({}),
  computed: {
    flags() {
      let flags = CONFIG.Actor.characterFlags;
      for (let [k, v] of Object.entries(flags)) {
        v.value = this.actor.flags.archmage && this.actor.flags.archmage[k] ? this.actor.flags.archmage[k] : null;
        flags[k] = v;
      }
      return flags;
    },
    classes() {
      return `section section--settings flexcol${this.tab.active ? ' active' : ''}`;
    },
    resources() {
      let resources = {};
      for (let [k,v] of Object.entries(this.actor.data.resources.spendable)) {
        if (k.includes('custom')) {
          resources[k] = v;
        }
      }
      return resources;
    }
  },
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>