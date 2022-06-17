<template>
  <section :class="classes">
    <!-- Sorts and filters. -->
    <header class="power-filters flexrow">
      <div class="group-powers">
        <input type="hidden" name="flags.archmage.sheetDisplay.powers.groupBy.value" v-model="groupBy"/>
        <label for="power-group">{{localize('ARCHMAGE.groupBy')}}</label>
        <select name="power-group" v-model="groupBy">
          <option v-for="(option, index) in groupOptions" :key="index" :value="option.value">{{localize(concat('ARCHMAGE.GROUPS.',option.value))}}</option>
        </select>
      </div>
      <div class="sort-powers">
        <input type="hidden" name="flags.archmage.sheetDisplay.powers.sortBy.value" v-model="sortBy"/>
        <label for="power-sort">{{localize('ARCHMAGE.sort')}}</label>
        <select name="power-sort" v-model="sortBy">
          <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.',option.value))}}</option>
        </select>
      </div>
      <div class="filter-search-powers">
        <label for="power-filter-search">{{localize('ARCHMAGE.filter')}}</label>
        <input type="text" name="power-filter-search" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
      </div>
      <div class="import-powers">
        <button class="item-import button" title="Create Power" data-item-type="power" data-type="power" type="button"><i class="fas fa-atlas"></i> {{localize('ARCHMAGE.import')}}</button>
      </div>
    </header>
    <!-- Powers, by group. -->
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="power-group">
      <div class="power-group-header">
        <!-- Group title and add button. -->
        <div class="power-header-title grid power-grid">
          <h2 class="power-group-title unit-title">{{localize(group)}}</h2>
          <div class="item-controls">
            <a class="item-control item-create" data-item-type="power" :data-group-type="groupBy" :data-power-type="groupKey"><i class="fas fa-plus"></i> {{localize('ARCHMAGE.add')}}</a>
          </div>
        </div>
        <!-- Column labels. -->
        <div class="power-header-labels grid power-grid">
          <div class="power-name">{{localize('ARCHMAGE.powerName')}}</div>
          <div class="power-feat-pips">{{localize('ARCHMAGE.feat')}}</div>
          <div class="power-action">{{localize('ARCHMAGE.act')}}</div>
          <div class="power-recharge">{{localize('ARCHMAGE.rchg')}}</div>
          <div class="power-uses">{{localize('ARCHMAGE.uses')}}</div>
          <div class="item-controls">{{localize('ARCHMAGE.edit')}}</div>
        </div>
      </div>
      <ul class="power-group-content flexcol">
        <li v-for="(power, powerKey) in powerGroups[groupKey]" :key="powerKey" :class="concat('item power-item power-item--', power._id)" :data-item-id="power._id" :data-draggable="draggable" :draggable="draggable">
          <!-- Clickable power header. -->
          <div :class="concat('power-summary grid power-grid ', (power.data.powerUsage.value ? power.data.powerUsage.value : 'other'), (power.data.trigger.value ? ' power-summary--trigger' : ''), (activePowers[power._id] ? ' active' : ''))">
            <Rollable name="item" :hide-icon="true" type="item" :opt="power._id"><img :src="power.img" class="power-image"/></Rollable>
            <a class="power-name" v-on:click="togglePower" :data-item-id="power._id">
              <h3 class="power-title unit-subtitle"><span v-if="power.data.powerLevel.value">[{{power.data.powerLevel.value}}] </span> {{power.name}}</h3>
            </a>
            <div class="power-feat-pips" v-if="hasFeats(power)">
              <ul class="feat-pips">
                <li v-for="(feat, tier) in filterFeats(power.data.feats)" :key="tier" :class="concat('feat-pip', (feat.isActive.value ? ' active' : ''))" :data-item-id="power._id" :data-tier="tier"><div class="hide">{{tier}}</div></li>
              </ul>
            </div>
            <div class="power-action" v-if="power.data.actionType.value">{{getActionShort(power.data.actionType.value)}}</div>
            <div class="power-recharge" v-if="power.data.recharge.value && power.data.powerUsage.value == 'recharge'">
              <Rollable name="recharge" type="recharge" :opt="power._id">{{Number(power.data.recharge.value) || 16}}+</Rollable>
            </div>
            <div class="power-uses" :data-item-id="power._id" :data-quantity="power.data.quantity.value"><span v-if="power.data.quantity.value !== null">{{power.data.quantity.value}}</span></div>
            <div class="item-controls">
              <a class="item-control item-edit" :data-item-id="power._id"><i class="fas fa-edit"></i></a>
              <a class="item-control item-delete" :data-item-id="power._id"><i class="fas fa-trash"></i></a>
            </div>
            <div v-if="power.data.trigger.value" class="power-trigger"><strong>{{localize('ARCHMAGE.CHAT.trigger')}}:</strong> {{power.data.trigger.value}}</div>
          </div>
          <!-- Expanded power content. -->
          <div :class="concat('power-content', (activePowers[power._id] ? ' active' : ''))" :style="getPowerStyle(power._id)">
            <Power :power="power" :ref="concat('power--', power._id)"/>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Power from '@/components/parts/Power.vue';
import Rollable from '@/components/parts/Rollable.vue';
export default {
  name: 'CharPowers',
  props: ['actor', 'tab', 'flags'],
  setup() {
    return {
      concat,
      localize
    }
  },
  components: {
    Power,
    Rollable
  },
  data() {
    return {
      powers: [],
      groupOptions: [
        { value: 'powerType', label: 'Type' },
        { value: 'actionType', label: 'Action' },
        { value: 'powerUsage', label: 'Usage' },
        { value: 'powerSource', label: 'Class/Race/Item' },
        { value: 'group', label: 'Custom Groups' },
      ],
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        { value: 'level', label: 'Level' }
      ],
      groupBy: 'powerType',
      sortBy: 'custom',
      searchValue: null,
      activePowers: {}
    }
  },
  computed: {
    draggable() {
      return this.sortBy == 'custom' ? true : false;
    },
    /**
     * Retrieve the groups as a computed property. Stored as keyed object where
     * the key is the machine name for the group and the value is the labe.
     */
    groups() {
      let groups = {};
      let sortTypes = [
        'powerSource',
        'powerType',
        'powerUsage',
        'actionType',
      ];
      // Handle the built-in sort types.
      if (sortTypes.includes(this.groupBy)) {
        let sortKey = `${this.groupBy}s`;
        for (let [key, label] of Object.entries(CONFIG.ARCHMAGE[sortKey])) {
          groups[key] = sortKey == 'powerTypes' ? `ARCHMAGE.${key}s` : `ARCHMAGE.${key}`;
        }
      }
      // Handle custom groups.
      else if (this.groupBy == 'group'){
        this.powers.forEach(i => {
          groups['power'] = 'Power';
          if (i.data.group.value) {
            let group = i.data.group.value;
            if (!group || group === undefined) {
              group = 'Power';
            }
            groups[this.cleanClassName(group)] = group;
          }
        });
      }
      // Default to a 'power' group.
      else {
        groups['power'] = 'Power';
      }
      // Handle the fallback group.
      if (!groups['other']) groups['other'] = `ARCHMAGE.other`;
      // Return clean groups.
      return groups;
    },
    /**
     * Computed class string for the main powers section element.
     */
    classes() {
      return `section section--powers flexcol`;
    },
    /**
     * Computed power groups. Takes the entire powers item array and reduces it
     * into a nested array where the top level structure are the group names.
     */
    powerGroups() {
      let sortTypes = [
        'powerSource',
        'powerType',
        'powerUsage',
        'actionType'
      ];

      // Re-sort the powers.
      this.getPowers();

      // let powers = this.actor.items.filter(i => i.type == 'power');
      let powersByGroup = this.powers.reduce((powerGroup, power) => {
        let group = 'power';
        let powerData = power.data;

        // Handle the built-in group types.
        if (sortTypes.includes(this.groupBy)) {
          group = powerData[this.groupBy] && powerData[this.groupBy].value ? powerData[this.groupBy].value : 'other';
          // Override legacy 'maneuver' with 'flexible'
          group = group == 'maneuver' ? 'flexible' : group;
        }
        // Handle custom groups.
        else if (this.groupBy == 'group') {
          group = powerData.group.value ? this.cleanClassName(powerData.group.value) : 'power';
        }

        // Create the group if it doesn't exist.
        if (!powerGroup[group]) {
          powerGroup[group] = [];
        }
        // Add the power and return for the next iteration.
        powerGroup[group].push(power);
        return powerGroup;
      }, {});

      return powersByGroup;
    },
  },
  methods: {
    /**
     * Clean a power name for usage in group keys.
     */
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    },
    /**
     * Determine if this power has one or more feats.
     */
    hasFeats(power) {
      let hasFeats = false;
      if (power.data && power.data && power.data.feats) {
        for (let [tier, feat] of Object.entries(power.data.feats)) {
          if (feat.description.value || feat.isActive.value) {
            hasFeats = true;
            break;
          }
        }
      }
      return hasFeats;
    },
    /**
     * Filter empty feats
     */
    filterFeats(featObj) {
      let res = {}
      for (let [tier, feat] of Object.entries(featObj)) {
        if (feat.description.value) res[tier] = feat;
      }
      return res;
    },
    /**
     * Retrieve the abbreviated action type, such as 'STD' or 'QCK'.
     */
    getActionShort(actionType) {
      let actionTypes = {
        'standard': 'STD',
        'move': 'MOV',
        'quick': 'QCK',
        'free': 'FREE',
        'interrupt': 'INT'
      };
      return actionTypes[actionType] ? actionTypes[actionType] : 'STD';
    },
    /**
     * Update the `powers` prop to be equal to a filtered version of the current
     * powers on the actor. Filters by type and search keys.
     */
    getPowers() {
      let powers = this.actor.items.filter(i => i.type == 'power');
      if (this.searchValue) {
        powers = powers.filter(i => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = this.cleanClassName(i.name);
          return haystack.includes(needle);
        });
      }
      if (this.sortBy == 'name') {
        powers = powers.sort((a,b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      }
      else if (this.sortBy == 'level') {
        powers = powers.sort((a,b) => {
          if (a.data.powerLevel.value < b.data.powerLevel.value) {
            return -1;
          }
          if (a.data.powerLevel.value > b.data.powerLevel.value) {
            return 1;
          }
          return 0;
        });
      }
      else {
        powers = powers.sort((a,b) => (a.sort || 0) - (b.sort || 0));
      }
      powers.forEach(i => {
        if (this.activePowers[i._id] == undefined) {
          // this.activePowers[i._id] = {value: false};
          this.activePowers[i._id] = false;
        }
      });
      this.powers = powers;
    },
    /**
     * Toggle power display (click event).
     */
    togglePower(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.itemId;
      if (id) {
        // Toggle the state if the power is currently being tracked.
        if (this.activePowers[id] !== undefined) {
          this.activePowers[id] = !this.activePowers[id];
        }
        // Otherwise, assume it should be open since this was click event.
        else {
          this.activePowers[id] = true;
        }
      }
    },
    /**
     * Calculate CSS height of power.
     */
    getPowerStyle(powerId) {
      // Retrieve the element from our refs.
      let power = this.$refs[`power--${powerId}`];
      let height = 0;

      // Set the height if there's a ref.
      if (power) {
        const element = this.$el.querySelector(`.power-item--${powerId} .power-content .power`);
        height = this.activePowers[powerId] ? `${element.offsetHeight}px` : `0px`;
      }

      // Return CSS style object.
      return {
        maxHeight: height
      };
    }
  },
  /**
   * Watch both the actor items and the search key for changes.
   */
  watch: {
    'actor.items': {
      deep: true,
      handler() {
        this.getPowers();
      }
    },
    'searchValue': {
      deep: false,
      handler() {
        this.getPowers();
      }
    }
  },
  async mounted() {
    this.groupBy = this.flags.sheetDisplay.powers.groupBy.value ? this.flags.sheetDisplay.powers.groupBy.value : 'powerType';
    this.sortBy = this.flags.sheetDisplay.powers.sortBy.value ? this.flags.sheetDisplay.powers.sortBy.value : 'custom';

    this.getPowers();
  }
}
</script>