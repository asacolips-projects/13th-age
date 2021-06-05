<template>
  <section :class="classes" data-tab="settings">
    <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTERSETTINGS.settings')}}</h2>
    <section class="sheet-settings grid grid-6col">
      <!-- Main Settings -->
      <div class="unit unit--base-settings">
        <div class="sub-unit sub-unit--base-ac flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.baseAC')}}</strong>
          <input type="number" name="data.attributes.ac.base" v-model="actor.data.attributes.ac.base" :disabled="overrides.includes('data.attributes.ac.base')"/>
        </div>
        <div class="sub-unit sub-unit--base-pd flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.basePD')}}</strong>
          <input type="number" name="data.attributes.pd.base" v-model="actor.data.attributes.pd.base" :disabled="overrides.includes('data.data.attributes.pd.base')"/>
        </div>
        <div class="sub-unit sub-unit--base-md flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.baseMD')}}</strong>
          <input type="number" name="data.attributes.md.base" v-model="actor.data.attributes.md.base" :disabled="overrides.includes('data.data.attributes.md.base')"/>
        </div>
        <div class="sub-unit sub-unit--base-hp flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.baseHP')}}</strong>
          <input type="number" name="data.attributes.hp.base" step=".1" v-model="actor.data.attributes.hp.base" :disabled="overrides.includes('data.data.attributes.hp.base')"/>
        </div>
        <div class="sub-unit sub-unit--base-recoveries flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.baseRecoveries')}}</strong>
          <input type="number" name="data.attributes.recoveries.base" v-model="actor.data.attributes.recoveries.base" :disabled="overrides.includes('data.attributes.recoveries.base')"/>
        </div>
        <div class="sub-unit sub-unit--calculate-max-hp flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.calculateHP')}}</strong>
          <input type="checkbox" name="data.attributes.hp.automatic" v-model="actor.data.attributes.hp.automatic"/>
        </div>
        <div class="sub-unit sub-unit--calculate-max-recoveries flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.calculateRecoveries')}}</strong>
          <input type="checkbox" name="data.attributes.recoveries.automatic" v-model="actor.data.attributes.recoveries.automatic"/>
        </div>
        <div class="sub-unit sub-unit--initiative-adjustment flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.initAdjustment')}}</strong>
          <input type="number" name="data.attributes.init.value" v-model="actor.data.attributes.init.value" :disabled="overrides.includes('data.attributes.init.value')" placeholder="0"/>
        </div>
        <div class="sub-unit sub-unit--recovery-dice flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.recoveryDice')}}</strong>
          <input type="text" name="data.attributes.recoveries.dice" v-model="actor.data.attributes.recoveries.dice" :disabled="overrides.includes('data.attributes.recoveries.dice')" placeholder="d8"/>
        </div>
        <div class="sub-unit sub-unit--attackMod flexrow">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.attackMod')}}</strong>
          <input type="number" name="data.attributes.attackMod.value" v-model="actor.data.attributes.attackMod.value" :disabled="overrides.includes('data.attributes.attackMod.value')"/>
        </div>
        <div class="sub-unit sub-unit--melee">
          <div class="sub-unit sub-unit--melee-dice flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.meleeWeaponDice')}}</strong>
            <input type="text" name="data.attributes.weapon.melee.dice" v-model="actor.data.attributes.weapon.melee.dice" :disabled="overrides.includes('data.attributes.weapon.melee.dice')" placeholder="d8"/>
          </div>
          <div class="sub-unit sub-unit--shield flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.CHARACTERSETTINGS.shield')}}</strong>
            <input type="checkbox" name="data.attributes.weapon.melee.shield" v-model="actor.data.attributes.weapon.melee.shield"/>
          </div>
          <div class="sub-unit sub-unit--dualwield flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.CHARACTERSETTINGS.dualwield')}}</strong>
            <input type="checkbox" name="data.attributes.weapon.melee.dualwield" v-model="actor.data.attributes.weapon.melee.dualwield"/>
          </div>
          <div class="sub-unit sub-unit--twohanded flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.CHARACTERSETTINGS.twohanded')}}</strong>
            <input type="checkbox" name="data.attributes.weapon.melee.twohanded" v-model="actor.data.attributes.weapon.melee.twohanded"/>
          </div>
          <div class="sub-unit sub-unit--ranged-dice flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.rangedWeaponDice')}}</strong>
            <input type="text" name="data.attributes.weapon.ranged.dice" v-model="actor.data.attributes.weapon.ranged.dice" :disabled="overrides.includes('data.attributes.weapon.ranged.dice')" placeholder="d8"/>
          </div>
          <div class="sub-unit sub-unit--jab-dice flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.jabWeaponDice')}}</strong>
            <input type="text" name="data.attributes.weapon.jab.dice" v-model="actor.data.attributes.weapon.jab.dice" :disabled="overrides.includes('data.attributes.weapon.jab.dice')" placeholder="d6"/>
          </div>
          <div class="sub-unit sub-unit--punch-dice flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.punchWeaponDice')}}</strong>
            <input type="text" name="data.attributes.weapon.punch.dice" v-model="actor.data.attributes.weapon.punch.dice" :disabled="overrides.includes('data.attributes.weapon.punch.dice')" placeholder="d8"/>
          </div>
          <div class="sub-unit sub-unit--kick-dice flexrow">
            <strong class="unit-subtitle">{{localize('ARCHMAGE.kickWeaponDice')}}</strong>
            <input type="text" name="data.attributes.weapon.kick.dice" v-model="actor.data.attributes.weapon.kick.dice" :disabled="overrides.includes('data.attributes.weapon.kick.dice')" placeholder="d10"/>
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
      let charFlags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
      for (let [k, v] of Object.entries(flags)) {
        v.value = charFlags && charFlags[k] ? charFlags[k] : null;
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
    },
    overrides() {
      return Object.keys(this.actor.overrides);
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