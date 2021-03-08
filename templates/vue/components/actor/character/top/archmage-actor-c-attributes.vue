<template>
  <section class="section section--attributes flexrow">
    <!-- Actor image -->
    <div class="unit unit--img">
      <img :src="actor.img" alt="localize('Character profile image')" class="avatar" height="105" width="105" data-edit="img"/>
    </div>
    <!-- HP -->
    <div class="unit unit--has-max unit--hp">
      <h2 class="unit-title">{{localize('Hit Points')}}</h2>
      <div class="resource flexrow">
        <input type="text" name="data.attributes.hp.value" class="resource-current" v-model="actor.data.attributes.hp.value">
        <span class="resource-separator">/</span>
        <input type="text" name="data.attributes.hp.max" class="resource-max" v-model="actor.data.attributes.hp.max">
      </div>
      <div class="labeled-input flexrow">
        <label for="data.attributes.hp.temp" class="unit-subtitle">{{localize('Temp HP')}}</label>
        <input type="text" name="data.attributes.hp.temp" class="temp-hp" v-model="actor.data.attributes.hp.temp">
      </div>
    </div>
    <!-- Defenses -->
    <div class="unit unit--defenses" :key="recalKey">
      <h2 class="unit-title">{{localize('Defenses')}}</h2>
      <div class="defenses grid grid-3col">
        <div class="defense defense--ac flexcol">
          <span class="defense-value">{{actor.data.attributes.ac.value}}</span>
          <h3 class="unit-subtitle">{{localize('AC')}}</h3>
        </div>
        <div class="defense defense--pd flexcol">
          <span class="defense-value">{{actor.data.attributes.pd.value}}</span>
          <h3 class="unit-subtitle">{{localize('PD')}}</h3>
        </div>
        <div class="defense defense--md flexcol">
          <span class="defense-value">{{actor.data.attributes.md.value}}</span>
          <h3 class="unit-subtitle">{{localize('MD')}}</h3>
        </div>
      </div>
    </div>
    <!-- Recoveries -->
    <div class="unit unit--has-max unit--recoveries">
      <h2 class="unit-title">{{localize('Recoveries')}}</h2>
      <div class="resource flexrow">
        <input type="text" name="data.attributes.recoveries.value" class="resource-current" v-model="actor.data.attributes.recoveries.value">
        <span class="resource-separator">/</span>
        <input type="text" name="data.attributes.recoveries.max" class="resource-max" v-model="actor.data.attributes.recoveries.max">
      </div>
      <div class="roll">
        <a class="rollable rollable--recover" data-roll-type="recovery">{{actor.data.attributes.level.value}}{{actor.data.attributes.recoveries.dice}}+{{actor.data.abilities.con.dmg}}</a>
      </div>
    </div>
    <!-- Saving Throws -->
    <div class="unit unit--saving-throws flexcol">
      <h2 class="unit-title">{{localize('Saving Throws')}}</h2>
      <div class="saves flexcol">
        <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="easy">{{actor.data.attributes.save.easy}}+ ({{localize('Easy')}})</a>
        <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="normal">{{actor.data.attributes.save.normal}}+ ({{localize('Normal')}})</a>
        <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="hard">{{actor.data.attributes.save.hard}}+ ({{localize('Hard')}})</a>
      </div>
    </div>
    <!-- Init / Death Saves -->
    <div class="unit unit--init-death">
      <div class="dividers flexcol">
        <a class="rollable rollable--init" data-roll-type="init">{{numberFormat(actor.data.attributes.init.mod, 0, true)}} {{localize('Initiative')}}</a>
        <div class="death-saves">
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="death">{{localize('Death Saves')}}</a>
          <div class="death-save-attempts flexrow">
            <input type="checkbox" name="data.attributes.saves.deathFails.0" v-model="actor.data.attributes.saves.deathFails[0]">
            <input type="checkbox" name="data.attributes.saves.deathFails.1" v-model="actor.data.attributes.saves.deathFails[1]">
            <input type="checkbox" name="data.attributes.saves.deathFails.2" v-model="actor.data.attributes.saves.deathFails[2]">
            <input type="checkbox" name="data.attributes.saves.deathFails.3" v-model="actor.data.attributes.saves.deathFails[3]">
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  props: ['actor', 'recalKey'],
  data: () => ({}),
  computed: {},
  methods: {},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>