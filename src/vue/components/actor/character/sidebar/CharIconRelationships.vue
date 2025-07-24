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
          <ul v-if="item.results" class="icon-rolls flexrow">
            <li v-for="(roll, rollIndex) in item.results"
                :key="rollIndex"
                class="icon-roll"
                :class="{secondEdition: is2e}"
                :data-key="index"
                :data-roll-key="rollIndex"
                :data-roll="roll ?? 0"
                :data-tooltip="rollResultTooltip(roll)"
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
        <span class="icon-edit-toggle fas fa-edit" @click="toggleEdit"></span>
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
    is2e: CONFIG.ARCHMAGE.is2e,
    alternateIconRollingMethod: game.settings.get('archmage', 'alternateIconRollingMethod')
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
      if (this.alternateIconRollingMethod) {
        delete results[5]
        results[6] = '⨉';
      } else if (this.is2e) {
        results[5] = '~';
        results[6] = '+';
      }
      return results[roll] ?? '';
    },
    rollResultTooltip(roll) {
      const keys = {}
      if (this.alternateIconRollingMethod) {
        keys[6] = 'ARCHMAGE.ICONROLLS.tooltip2ealt6';
      } else if (this.is2e) {
        keys[5] = 'ARCHMAGE.ICONROLLS.tooltip2e5';
        keys[6] = 'ARCHMAGE.ICONROLLS.tooltip2e6';
      } else {
        keys[5] = 'ARCHMAGE.ICONROLLS.tooltip1e5';
        keys[6] = 'ARCHMAGE.ICONROLLS.tooltip1e6';
      }
      return keys[roll] ? game.i18n.localize(keys[roll]) : '';
    }
  },
  watch: {
  },
  async mounted() {
  }
}
</script>
