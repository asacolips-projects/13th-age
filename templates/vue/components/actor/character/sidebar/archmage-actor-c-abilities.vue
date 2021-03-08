<template>
  <section class="section section--abilities flexcol">
    <div class="list-item-header grid grid-4col">
      <div class="ability-mod-label grid-start-3">{{localize('MOD')}}</div>
      <div class="ability-lvl-label grid-start-4">{{localize('LVL')}}</div>
    </div>
    <ul class="list list--abilities abilities">
      <li v-for="(item, index) in actor.data.abilities" :key="concat('data.abilities.', index, '.value')" class="list-item list-item--abilities ability grid grid-4col" :data-key="index">
        <input type="number" v-bind:name="concat('data.abilities.', index, '.value')" class="ability-score" v-model="item.value"/>
        <a class="ability-name rollable rollable--ability" data-roll-type="ability" :data-roll-opt="index">{{localize(concat('ARCHMAGE.', index, '.label'))}}</a>
        <div class="ability-mod">{{numberFormat(item.mod, 0, true)}}</div>
        <div class="ability-lvl">{{numberFormat(item.lvl, 0, true)}}</div>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: function () {
    return {
      abilities: {},
      level: {}
    }
  },
  computed: {
  },
  methods: {},
  watch: {
    actor: {
      deep: true,
      handler() {
        for (let [k,v] of Object.entries(this.abilities)) {
          this.abilities[k].mod = Math.floor((v.value - 10) / 2);
          this.abilities[k].lvl = this.abilities[k].mod + this.level.value;
        }
        console.log('Abilities updated');
      }
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.abilities = this.actor.data.abilities;
    this.level = this.actor.data.attributes.level;
  }
}
</script>