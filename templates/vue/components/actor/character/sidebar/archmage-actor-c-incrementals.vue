<template>
  <section class="section section--incrementals flexcol">
    <h2 class="unit-title">{{localize('ARCHMAGE.incrementalAdvances')}}</h2>
    <ul class="list list--incrementals incrementals">
      <li v-for="(item, index) in getOrderedIncrementals(actor)" :key="index" class="list-item list-item--incrementals incremental" :data-key="index">
        <label :for="concat('data.incrementals.', index)" :title="localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Hint'))">
          <input type="checkbox" :name="concat('data.incrementals.', index)" v-model="actor.data.data.incrementals[index]">
          {{localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Name'))}}
        </label>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: function () {
    return {}
  },
  computed: {},
  methods: {
    getOrderedIncrementals(actor) {
      let incrementalKeys = ['abilityScoreBonus', 'skills', 'extraMagicItem', 'feat', 'feature', 'hp', 'iconRelationshipPoint', 'powerSpell1', 'powerSpell2', 'powerSpell3', 'powerSpell4'];
      let newIncrementalArray = {};
      incrementalKeys.forEach(e => newIncrementalArray[e] = actor.data.data.incrementals[e]);
      return newIncrementalArray;
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>