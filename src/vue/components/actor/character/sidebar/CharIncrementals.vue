<template>
  <section class="section section--incrementals flexcol" v-if="!actor.flags.archmage?.hideIncrementals">
    <h2 class="unit-title">{{localize('ARCHMAGE.incrementalAdvances')}}</h2>
    <ul class="list list--incrementals incrementals">
      <li v-for="(item, index) in getOrderedIncrementals(actor)" :key="index" class="list-item list-item--incrementals incremental" :data-key="index">
        <label :for="concat('system.incrementals.', index)" :title="localize(getIncrementalTitle(index))">
          <input type="checkbox" :name="concat('system.incrementals.', index)" v-model="actor.system.incrementals[index]">
          {{localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Name'))}}
        </label>
      </li>
    </ul>
  </section>
</template>

<script>
import { localize, concat } from '@/methods/Helpers';
export default {
  name: 'CharIncrementals',
  props: ['actor'],
  setup() {
    return {
      localize,
      concat
    }
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    getIncrementalTitle(incremental) {
      if (incremental == 'abilityScoreBonus') {
        if (game.settings.get('archmage', 'secondEdition')) {
          incremental = `${incremental}2e`;
        }
      }
      return `ARCHMAGE.INCREMENTALS.${incremental}Hint`;
    },
    getOrderedIncrementals(actor) {
      let incrementalKeys = ['abilityScoreBonus', 'skills', 'extraMagicItem', 'feat', 'talent', 'hp', 'iconRelationshipPoint', 'powerSpell1', 'powerSpell2', 'powerSpell3', 'powerSpell4'];
      if (game.settings.get("archmage", "secondEdition")) {
        incrementalKeys = ['abilityScoreBonus', 'feat', 'recovery', 'extraMagicItem', 'powerSpell1', 'talent', 'skillInitiative', 'abilMultiplier'];
      }
      let newIncrementalArray = {};
      incrementalKeys.forEach(e => newIncrementalArray[e] = actor.system.incrementals[e]);
      return newIncrementalArray;
    }
  },
  async mounted() {}
}
</script>
