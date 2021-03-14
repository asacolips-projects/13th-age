<template>
  <section :class="classes" data-tab="powers">
    <!-- Sorts and filters. -->
    <header class="power-filters flexrow">
      <div class="group-powers">
        <label for="power-group">{{localize('Group by')}}</label>
        <select name="power-group" v-model="groupBy">
          <option v-for="option in groupOptions" :key="option" :value="option.value">{{localize(option.label)}}</option>
        </select>
      </div>
      <div class="sort-powers">
        <label for="power-sort">{{localize('Sort')}}</label>
        <select name="power-sort" v-model="sortBy">
          <option v-for="option in sortOptions" :key="option" :value="option.value">{{localize(option.label)}}</option>
        </select>
      </div>
      <div class="filter-search-powers">
        <input type="text" name="power-filter-search" v-model="searchValue" :placeholder="localize('Filter powers by name')"/>
      </div>
    </header>
    <!-- Powers, by group. -->
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="power-group">
      <div class="power-group-header">
        <!-- Group title and add button. -->
        <div class="power-header-title grid power-grid">
          <h2 class="power-group-title unit-title">{{localize(group)}}</h2>
          <div class="item-controls">
            <a class="item-control item-create" data-item-type="power" :data-power-type="groupKey"><i class="fas fa-plus"></i> Add</a>
          </div>
        </div>
        <!-- Column labels. -->
        <div class="power-header-labels grid power-grid">
          <div class="power-name">{{localize('Power Name')}}</div>
          <div class="power-feat-pips">{{localize('Feat')}}</div>
          <div class="power-action">{{localize('Act.')}}</div>
          <div class="power-recharge">{{localize('Rchg.')}}</div>
          <div class="power-uses">{{localize('Uses')}}</div>
          <div class="item-controls">{{localize('Edit')}}</div>
        </div>
      </div>
      <ul class="power-group-content flexcol">
        <li v-for="(power, powerKey) in powerGroups[groupKey]" :key="powerKey" :class="concat('power-item power-item--', power._id)" :data-item-id="power._id">
          <!-- Clickable power header. -->
          <div :class="concat('power-summary grid power-grid ', (power.data.powerUsage.value ? power.data.powerUsage.value : 'other'))">
            <img :src="power.img" class="power-image rollable-image"/>
            <a class="power-name" v-on:click="togglePower" :data-item-id="power._id">
              <h3 class="power-title unit-subtitle"><span v-if="power.data.powerLevel.value">[{{power.data.powerLevel.value}}] </span> {{power.name}}</h3>
            </a>
            <div class="power-feat-pips" v-if="hasFeats(power)">
              <ul class="feat-pips">
                <li v-for="(feat, tier) in power.data.feats" :key="tier" :class="concat('feat-pip', (feat.isActive.value ? ' active' : ''))"><div class="hide">{{tier}}</div></li>
              </ul>
            </div>
            <div class="power-action" v-if="power.data.actionType.value">{{getActionShort(power.data.actionType.value)}}</div>
            <div class="power-recharge" v-if="power.data.recharge.value">
              <archmage-h-rollable name="recharge" type="recharge" :opt="power.data.recharge.value">{{power.data.recharge.value}}+</archmage-h-rollable>
            </div>
            <div class="power-uses" v-if="power.data.quantity.value">{{power.data.quantity.value}}</div>
            <div class="item-controls">
              <a class="item-control item-edit" :data-item-id="power._id"><i class="fas fa-edit"></i></a>
              <a class="item-control item-delete" :data-item-id="power._id"><i class="fas fa-trash"></i></a>
            </div>
          </div>
          <!-- Expanded power content. -->
          <div class="power-content">
            <archmage-h-power :power="power" :active="activePowers[power._id]"></archmage-h-power>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab'],
  data: function() {
    return {
      powers: [],
      groupOptions: [
        { value: 'powerType', label: 'Type' },
        { value: 'actionType', label: 'Action' },
        { value: 'powerUsage', label: 'Usage' },
        { value: 'powerSource', label: 'Class/Race/Item' },
        { value: 'group', label: 'Custom Groups' },
      ],
      groupBy: 'powerType',
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        { value: 'level', label: 'Level' }
      ],
      sortBy: 'custom',
      searchValue: null,
      activePowers: {}
    }
  },
  computed: {
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
          groups[key] = label;
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
      return groups;
    },
    /**
     * Computed class string for the main powers section element.
     */
    classes() {
      return `section section--powers flexcol${this.tab.active ? ' active' : ''}`;
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

      // let powers = this.actor.items.filter(i => i.type == 'power');
      let powersByGroup = this.powers.reduce((powerGroup, power) => {
        let group = 'power';

        // Handle the built-in group types.
        if (sortTypes.includes(this.groupBy)) {
          group = power.data[this.groupBy].value ? power.data[this.groupBy].value : 'other';
        }
        // Handle custom groups.
        else if (this.groupBy == 'group') {
          group = power.data.group.value ? this.cleanClassName(power.data.group.value) : 'power';
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
    }
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
      for (let [tier, feat] of Object.entries(power.data.feats)) {
        if (feat.description.value || feat.isActive.value) {
          hasFeats = true;
          break;
        }
      }
      return hasFeats;
    },
    /**
     * Retrieive the abbreviated action type, such as 'STD' or 'QCK'.
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
      if (this.sortBy == 'level') {
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
      powers.forEach(i => {
        if (this.activePowers[i._id] == undefined) {
          this.$set(this.activePowers, i._id, {value: false});
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
        if (this.activePowers[id] !== undefined) {
          this.$set(this.activePowers, id, !this.activePowers[id]);
        }
        else {
          this.$set(this.activePowers, id, true);
        }
      }
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
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.getPowers();
  }
}
</script>