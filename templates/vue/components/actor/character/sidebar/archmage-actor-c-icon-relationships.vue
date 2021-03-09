<template>
  <section class="section section--icons flexcol">
    <h2 class="unit-title">{{localize('Icon Relationships')}}</h2>
    <ul class="list list--icons icons">
      <li v-for="(item, index) in icons" :key="concat('data.icons.', index)" class="list-item list-item--icons icon flexrow" :data-key="index">
        <div :class="concat('icon-display flexrow', isEdit(index, editArray[index]))">
          <div class="rollable rollable--icon" data-roll-type="icon" :data-roll-opt="item.name.value">
            <span class="icon-symbol flexshrink">{{iconSymbol(item.relationship.value)}}</span>
            <span class="icon-name">{{item.bonus.value}} {{item.name.value}}</span>
          </div>
          <ul class="icon-rolls flexrow" :key="changeKey">
            <li v-for="(roll, rollIndex) in item.results" :key="rollIndex" class="icon-roll">{{roll.value}}</li>
          </ul>
        </div>
        <div :class="concat('icon-edit flexrow', isEdit(index, !editArray[index]))">
          <select class="relationship-edit" :name="concat('data.icons.', index, '.relationship.value')" v-model="item.relationship.value">
            <option disabled value=""></option>
            <option value="Positive">{{localize('Positive')}}</option>
            <option value="Negative">{{localize('Negative')}}</option>
            <option value="Conflicted">{{localize('Conflicted')}}</option>
          </select>
          <input type="number" v-bind:name="concat('data.icons.', index, '.bonus.value')" class="icon-bonus-edit" v-model="item.bonus.value"/>
          <input type="text" v-bind:name="concat('data.icons.', index, '.name.value')" class="icon-name-edit" v-model="item.name.value"/>
        </div>
        <span class="icon-edit-toggle fas fa-edit" v-on:click="toggleEdit"></span>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: () => ({
    editArray: [],
    changeKey: 0
  }),
  computed: {
    icons() {
      let filteredIcons = {};
      for (let [k,v] of Object.entries(this.actor.data.icons)) {
        if (v.isActive.value === true) filteredIcons[k] = v;
      }
      return filteredIcons;
    },
    relationshipTypes() {
      return [
        {label: game.i18n.localize('Positive'), code: 'Positive'},
        {label: game.i18n.localize('Negative'), code: 'Negative'},
        {label: game.i18n.localize('Conflicted'), code: 'Conflicted'}
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
    getIconResults() {
      game.archmage.ActorHelpersV2._prepareIcons(this.actor);
    }
  },
  watch: {
    'icons.i1.bonus.value': {
      deep: false,
      handler() {
        this.getIconResults();
      }
    },
    'icons.i2.bonus.value': {
      deep: false,
      handler() {
        this.getIconResults();
      }
    },
    'icons.i3.bonus.value': {
      deep: false,
      handler() {
        this.getIconResults();
      }
    },
    'icons.i4.bonus.value': {
      deep: false,
      handler() {
        this.getIconResults();
      }
    },
    'icons.i5.bonus.value': {
      deep: false,
      handler() {
        this.getIconResults();
      }
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
  }
}
</script>