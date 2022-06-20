<template>
  <section class="section section--attributes flexrow">
    <div class="unit unit--attributes grid grid-4col border-both">
      <!-- Defenses -->
      <div class="unit unit--defenses">
        <h2 class="unit-title">{{localize('ARCHMAGE.defenses')}}</h2>
        <div class="defenses grid grid-3col">
          <div class="defense defense--ac flexcol">
            <input type="number" name="data.attributes.ac.value" class="defense-value" v-model="actor.data.attributes.ac.value"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.ac.label'), ' (', localize('ARCHMAGE.ac.stats'), ')')">{{localize('ARCHMAGE.ac.key')}}</h3>
          </div>
          <div class="defense defense--pd flexcol">
            <input type="number" name="data.attributes.pd.value" class="defense-value" v-model="actor.data.attributes.pd.value"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.pd.label'), ' (', localize('ARCHMAGE.pd.stats'), ')')">{{localize('ARCHMAGE.pd.key')}}</h3>
          </div>
          <div class="defense defense--md flexcol">
            <input type="number" name="data.attributes.md.value" class="defense-value" v-model="actor.data.attributes.md.value"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.md.label'), ' (', localize('ARCHMAGE.md.stats'), ')')">{{localize('ARCHMAGE.md.key')}}</h3>
          </div>
        </div>
      </div>
      <!-- HP -->
      <div class="unit unit--has-max unit--hp">
        <h2 class="unit-title">{{localize('ARCHMAGE.hitPoints')}}</h2>
        <Progress name="hp" :current="actor.data.attributes.hp.value" :temp="actor.data.attributes.hp.temp" :max="actor.data.attributes.hp.max"/>
        <div class="resource flexrow">
          <input type="number" name="data.attributes.hp.value" class="resource-current" v-model="actor.data.attributes.hp.value">
          <span class="resource-separator">/</span>
          <div v-if="actor.data.attributes.hp.automatic" class="resource-max">{{actor.data.attributes.hp.max}}</div>
          <input v-else type="number" name="data.attributes.hp.max" class="resource-max" v-model="actor.data.attributes.hp.max">
        </div>
        <div class="labeled-input flexrow">
          <label for="data.attributes.hp.temp" class="unit-subtitle">{{localize('ARCHMAGE.tempHp')}}</label>
          <input type="number" name="data.attributes.hp.temp" class="temp-hp" v-model="actor.data.attributes.hp.temp">
        </div>
      </div>
      <!-- Saving Throws -->
      <div class="unit unit--saves flexcol">
        <h2 class="unit-title">{{localize('ARCHMAGE.saves')}}</h2>
        <div class="saves flexcol">
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="easy">6+ ({{localize('ARCHMAGE.SAVE.easyShort')}})</a>
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="normal">11+ ({{localize('ARCHMAGE.SAVE.normalShort')}})</a>
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="hard">16+ ({{localize('ARCHMAGE.SAVE.hardShort')}})</a>
        </div>
      </div>
      <!-- Disengage -->
      <section class="unit unit--disengage">
        <h2 class="unit-title">{{localize('ARCHMAGE.SAVE.disengage')}}</h2>
        <div class="resource flexcol">
          <a class="rollable rollable--disengage disengage-value" data-roll-type="save" data-roll-opt="disengage">{{disengage.value}}+</a>
          <div class="disengage-bonus flexrow">
            <span class="disengage-label">{{localize('ARCHMAGE.bonus')}}</span>
            <input type="number" name="data.attributes.disengageBonus" class="disengage-bonus" v-model="disengage.bonus">
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
export default {
  name: 'NpcAttributes',
  props: ['actor'],
  setup() {
    return {
      concat,
      localize
    }
  },
  data() {
    return {
      disengage: {
        value: 11,
        bonus: 0
      }
    }
  },
  components: {
    Progress
  },
  computed: {},
  methods: {},
  async mounted() {}
}
</script>

<style lang="scss" scoped>
.section--attributes {
  padding-bottom: 0;

  .unit--attributes {
    margin-bottom: 0;
  }
}
</style>