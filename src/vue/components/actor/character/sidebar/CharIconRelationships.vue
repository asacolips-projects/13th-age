<template>
  <section class="section section--icons flexcol" v-if="Object.keys(icons).length" :data-tooltip="tooltip('pcIconRelationship')">
    <h2 class="unit-title">{{localize('ARCHMAGE.iconRelationships')}}</h2>
    <ul class="list list--icons icons">
      <li v-for="(item, index) in icons" :key="concat('system.icons.', index)" class="list-item list-item--icons icon flexrow" :data-key="index">
        <div :class="concat('icon-display flexrow', isEdit(index, editArray[index]))">
          <div class="rollable rollable--icon" data-roll-type="icon" :data-roll-opt="index">
            <span class="icon-symbol flexshrink">{{iconSymbol(item.relationship.value)}}</span>
            <span class="icon-name">{{item.bonus.value}} {{item.name.value}}</span>
          </div>
          <ul v-if="item.results" class="icon-rolls flexrow" :key="changeKey">
            <li v-for="(roll, rollIndex) in item.results"
                :key="rollIndex"
                class="icon-roll"
                :class="{secondEdition: is2e}"
                :data-key="index"
                :data-roll-key="rollIndex"
                :data-roll="roll ?? 0"
            >
              {{rollResultText(roll)}}
            </li>
          </ul>
        </div>
        <div :class="concat('icon-edit flexrow', isEdit(index, !editArray[index]))">
          <select class="relationship-edit" :name="concat('system.icons.', index, '.relationship.value')" v-model="item.relationship.value">
            <option value="Positive">{{localize('ARCHMAGE.Positive')}}</option>
            <option value="Negative">{{localize('ARCHMAGE.Negative')}}</option>
            <option value="Conflicted">{{localize('ARCHMAGE.Conflicted')}}</option>
          </select>
          <input type="number" v-bind:name="concat('system.icons.', index, '.bonus.value')" class="icon-bonus-edit" v-model="item.bonus.value"/>
          <input type="text" v-bind:name="concat('system.icons.', index, '.name.value')" class="icon-name-edit" v-model="item.name.value"/>
        </div>
        <span class="icon-edit-toggle fas fa-edit" v-on:click="toggleEdit"></span>
      </li>
    </ul>
  </section>
</template>

<script>
import { localize, concat, tooltip } from '@/methods/Helpers';
export default {
  name: 'CharIconRelationships',
  props: ['actor'],
  setup() {
    return {
      concat,
      localize,
      tooltip
    }
  },
  data: () => ({
    editArray: [],
    changeKey: 0,
    is2e: CONFIG.ARCHMAGE.is2e
  }),
  computed: {
    icons() {
      let filteredIcons = {};
      for (let [k,v] of Object.entries(this.actor.system.icons)) {
        if (v.isActive.value === true) filteredIcons[k] = v;
      }
      return filteredIcons;
    },
    relationshipTypes() {
      return [
        {label: game.i18n.localize('ARCHMAGE.Positive'), code: 'Positive'},
        {label: game.i18n.localize('ARCHMAGE.Negative'), code: 'Negative'},
        {label: game.i18n.localize('ARCHMAGE.Conflicted'), code: 'Conflicted'}
      ];
    },
  },
  methods: {
    iconSymbol(iconKey) {
      let symbols = {
        'Positive': '+',
        'Negative': '-',
        'Conflicted': '~'
      };
      return symbols[iconKey];
    },
    toggleEdit(event) {
      let $target = $(event.currentTarget);
      let $parent = $target.parents('.list-item--icons');
      let $display = $parent.find('.icon-display');
      let $edit = $parent.find('.icon-edit');

      $display.toggleClass('hide');
      $edit.toggleClass('hide');

      let index = parseInt($parent.attr('data-key'));
      this.editArray[index] = $display.hasClass('hide');
    },
    isEdit(index, type) {
      if (this.editArray.length < 1) {
        return type === true ? ' hide ' : '';
      }
      else {
        return this.editArray[index] === type ? ' hide ' : '';
      }
    },
    rollResultText(roll) {
      const results = {
        5: '5',
        6: '6'
      }
      if (CONFIG.ARCHMAGE.is2e) {
        results[5] = '~';
        results[6] = '+';
      }
      return results[roll] ?? '';
    }
  },
  watch: {
  },
  async mounted() {
  }
}
</script>
