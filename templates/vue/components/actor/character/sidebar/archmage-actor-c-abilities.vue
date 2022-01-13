<template>
  <section class="section section--abilities flexcol">
    <div class="list-item-header grid grid-4col">
      <h2 class="unit-title grid-span-2">{{localize('ARCHMAGE.abilities')}}</h2>
      <div class="ability-mod-label grid-start-3">{{localize('ARCHMAGE.mod')}}</div>
      <div class="ability-lvl-label grid-start-4">{{localize('ARCHMAGE.lvl')}}</div>
    </div>
    <ul class="list list--abilities abilities">
      <li v-for="(item, index) in actor.data.abilities" :key="concat('data.abilities.', index, '.value')" class="list-item list-item--abilities ability grid grid-4col" :data-key="index">
        <input type="number" v-bind:name="concat('data.abilities.', index, '.value')" class="ability-score" v-model="item.value"/>
        <a class="ability-name rollable rollable--ability" data-roll-type="ability" :data-roll-opt="index">{{localize(concat('ARCHMAGE.', index, '.label'))}}</a>
        <div class="ability-mod" :style="concat('color:', modColor(item))" :title="modTitle(item, actor)">{{numberFormat(item.nonKey.mod, 0, true)}}</div>
        <div class="ability-lvl" :style="concat('color:', modColor(item))">{{numberFormat(item.nonKey.lvlmod, 0, true)}}</div>
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
  computed: {
  },
  methods: {
    modColor(abil) {
      if (abil.mod && abil.nonKey.mod) {
        if (abil.mod < abil.nonKey.mod) {
          console.log(abil.label);
          return '#E01616';
        }
      }
      return 'inherit';
    },
    modTitle(abil, actor) {
      if (abil.mod && abil.nonKey.mod) {
        if (abil.mod < abil.nonKey.mod) {
          return game.i18n.format('ARCHMAGE.keyReduced', {
            mod: window.archmageVueMethods.methods.numberFormat(abil.mod, 0, true),
            kmod1: actor.data.attributes.keyModifier.mod1,
            kmod2: actor.data.attributes.keyModifier.mod2
          });
        }
      }
      return '';
    }
  },
  watch: {},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>