<template>
  <section class="section section--backgrounds flexcol" v-if="Object.keys(backgrounds).length">
    <h2 class="unit-title">{{localize('ARCHMAGE.backgrounds')}}</h2>
    <ul class="list list--backgrounds backgrounds">
      <li v-for="(item, index) in backgrounds" :key="concat('system.backgrounds.', index)" class="list-item list-item--backgrounds background flexrow" :data-key="index"
          :data-tooltip="tooltip('pcBackground', {desc:item.name.value})">
        <span class="rollable rollable--background flexshrink" data-roll-type="background" :data-roll-opt="item.name.value"></span>
        <span class="background-sign">+</span>
        <input type="number" v-bind:name="concat('system.backgrounds.', index, '.bonus.value')" class="background-bonus" v-model="item.bonus.value"/>
        <TextareaGrow :name="`system.backgrounds.${index}.name.value`" :value="item.name.value" classes="background-name"/>
      </li>
    </ul>
  </section>
</template>

<script>
import { localize, concat, tooltip } from '@/methods/Helpers';
import TextareaGrow from '@/components/parts/TextareaGrow.vue';
export default {
  name: 'CharBackgrounds',
  props: ['actor'],
  setup() {
    return {
      localize,
      concat,
      tooltip
    }
  },
  data() {
    return {}
  },
  components: {
    TextareaGrow
  },
  computed: {
    backgrounds() {
      let filteredBackgrounds = {};
      for (let [k,v] of Object.entries(this.actor.system.backgrounds)) {
        if (v.isActive.value === true) filteredBackgrounds[k] = v;
      }
      return filteredBackgrounds;
    }
  },
  methods: {},
  async mounted() {}
}
</script>
