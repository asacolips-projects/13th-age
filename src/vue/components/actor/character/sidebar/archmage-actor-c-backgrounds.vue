<template>
  <section class="section section--backgrounds flexcol">
    <h2 class="unit-title">{{localize('ARCHMAGE.backgrounds')}}</h2>
    <ul class="list list--backgrounds backgrounds">
      <li v-for="(item, index) in backgrounds" :key="concat('data.backgrounds.', index)" class="list-item list-item--backgrounds background flexrow" :data-key="index">
        <span class="rollable rollable--background flexshrink" data-roll-type="background" :data-roll-opt="item.name.value"></span>
        <span class="background-sign">+</span>
        <input type="number" v-bind:name="concat('data.backgrounds.', index, '.bonus.value')" class="background-bonus" v-model="item.bonus.value"/>
        <input type="text" v-bind:name="concat('data.backgrounds.', index, '.name.value')" class="background-name" v-model="item.name.value"/>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data() {
    return {}
  },
  computed: {
    backgrounds() {
      let filteredBackgrounds = {};
      for (let [k,v] of Object.entries(this.actor.data.backgrounds)) {
        if (v.isActive.value === true) filteredBackgrounds[k] = v;
      }
      return filteredBackgrounds;
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