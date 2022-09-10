<template>
  <section class="section section--incrementals flexcol">
    <h2 class="unit-title">{{localize('ARCHMAGE.incrementalAdvances')}}</h2>
    <ul class="list list--incrementals incrementals">
      <li v-for="(item, index) in getOrderedIncrementals(actor)" :key="index" class="list-item list-item--incrementals incremental" :data-key="index">
        <label :for="concat('system.incrementals.', index)" :title="localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Hint'))">
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
    getOrderedIncrementals(actor) {
      let incrementalKeys = ['abilityScoreBonus', 'skills', 'extraMagicItem', 'feat', 'talent', 'hp', 'iconRelationshipPoint', 'powerSpell1', 'powerSpell2', 'powerSpell3', 'powerSpell4'];
      let newIncrementalArray = {};
      incrementalKeys.forEach(e => newIncrementalArray[e] = actor.system.incrementals[e]);
      return newIncrementalArray;
    }
  },
  async mounted() {}
}
</script>
