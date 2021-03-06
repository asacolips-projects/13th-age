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
    <div class="unit unit--defenses">
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
    <div class="unit unit--init-death flexcol">
      <h2 class="unit-title">{{localize('Initiative')}}</h2>
      <h2 class="unit-title">{{localize('Death Saves')}}</h2>
    </div>
  </section>
</template>

<script>
export default {
  name: 'archmage-actor-c-attributes',
  props: ['actor'],
  data: () => ({}),
  computed: {},
  methods: {
    getSafeValue(property, defaultValue) {
      if (property) return property.value;
      return defaultValue;
    },
    localize(key) {
      return game.i18n.localize(key);
    }
  },
  async mounted() {}
}
</script>