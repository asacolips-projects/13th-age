<template>
  <section :class="classes" data-tab="powers">
    <header class="power-filters flexrow">
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
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="power-group">
      <div class="power-group-header flexrow">
        <h2 class="power-group-title unit-title">{{localize(group)}}</h2>
        <div class="item-controls">
          <a class="item-control item-create" data-item-type="power" :data-power-type="groupKey"><i class="fas fa-plus"></i> Add</a>
        </div>
      </div>
      <ul class="power-group-content flexcol">
        <li v-for="(power, powerKey) in powerGroups[groupKey]" :key="powerKey" :class="powerClass(power)">
          <h3 class="power-title unit-subtitle">{{power.name}}</h3>
          <div class="item-controls">
            <a class="item-control item-edit" :data-item-id="power._id"><i class="fas fa-edit"></i></a>
            <a class="item-control item-delete" :data-item-id="power._id"><i class="fas fa-trash"></i></a>
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
      sortOptions: [
        { value: 'powerType', label: 'Type'},
        { value: 'actionType', label: 'Action'},
        { value: 'powerUsage', label: 'Usage'},
        { value: 'powerSource', label: 'Class/Race/Item'},
        { value: 'group', label: 'Custom Groups'},
      ],
      sortBy: 'powerType',
      searchValue: null
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
      if (sortTypes.includes(this.sortBy)) {
        let sortKey = `${this.sortBy}s`;
        for (let [key, label] of Object.entries(CONFIG.ARCHMAGE[sortKey])) {
          groups[key] = label;
        }
      }
      // Handle custom groups.
      else if (this.sortBy == 'group'){
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
        if (sortTypes.includes(this.sortBy)) {
          group = power.data[this.sortBy].value ? power.data[this.sortBy].value : 'other';
        }
        // Handle custom groups.
        else if (this.sortBy == 'group') {
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
     * Return a dynamic class with the power id.
     */
    powerClass(power) {
      return `power power--${power._id} flexrow`;
    },
    /**
     * Clean a power name for usage in group keys.
     */
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
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
      this.powers = powers;
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