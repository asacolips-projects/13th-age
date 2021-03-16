<template>
  <section :class="classes" data-tab="inventory">
    <!-- Sorts and filters. -->
    <header class="equipment-filters flexrow">
      <div class="sort-equipment">
        <label for="equipment-sort">{{localize('Sort')}}</label>
        <select name="equipment-sort" v-model="sortBy">
          <option v-for="option in sortOptions" :key="option" :value="option.value">{{localize(option.label)}}</option>
        </select>
      </div>
      <div class="filter-search-equipment">
        <input type="text" name="equipment-filter-search" v-model="searchValue" :placeholder="localize('Filter equipment by name')"/>
      </div>
    </header>
    <!-- Equipment, by group. -->
    <section class="equipment-group">
      <div class="equipment-group-header">
        <!-- Group title and add button. -->
        <div class="equipment-header-title grid equipment-grid">
          <h2 class="equipment-group-title unit-title">{{localize('Magic Items')}}</h2>
          <div class="item-controls">
            <a class="item-control item-create" data-item-type="equipment"><i class="fas fa-plus"></i> Add</a>
          </div>
        </div>
        <!-- Column labels. -->
        <div class="equipment-header-labels grid equipment-grid">
          <div class="equipment-name">{{localize('Equipment Name')}}</div>
          <div class="equipment-bonus">{{localize('Bonuses')}}</div>
          <div class="equipment-chakra">{{localize('Chakra')}}</div>
          <div class="item-controls">{{localize('Edit')}}</div>
        </div>
      </div>
      <ul class="equipment-group-content flexcol">
        <li v-for="(equipment, equipmentKey) in equipment" :key="equipmentKey" :class="concat('equipment-item equipment-item--', equipment._id)" :data-item-id="equipment._id">
          <!-- Clickable equipment header. -->
          <div class="equipment-summary grid equipment-grid equipment">
            <archmage-h-rollable name="item" :hide-icon="true" type="item" :opt="equipment._id"><img :src="equipment.img" class="equipment-image"/></archmage-h-rollable>
            <a class="equipment-name" v-on:click="toggleEquipment" :data-item-id="equipment._id">
              <h3 class="equipment-title unit-subtitle">{{equipment.name}}</h3>
            </a>
            <div class="equipment-bonus flexrow">
              <span class="bonus" v-for="(bonus, bonusProp) in getBonuses(equipment)" :key="bonusProp">
                <span class="bonus-label">{{bonusProp}} </span>
                <span class="bonus-value">{{numberFormat(bonus, 0, true)}}</span>
              </span>
            </div>
            <div class="equipment-chakra" v-if="equipment.data.chackra">
              <!-- TODO: Fix typo in attr name. -->
              <h3 class="equipment-title unit-subtitle">{{equipment.data.chackra}}</h3>
            </div>
            <div class="item-controls">
              <a class="item-control item-edit" :data-item-id="equipment._id"><i class="fas fa-edit"></i></a>
              <a class="item-control item-delete" :data-item-id="equipment._id"><i class="fas fa-trash"></i></a>
            </div>
          </div>
          <!-- Expanded equipment content. -->
          <div :class="concat('equipment-content', (activeEquipment[equipment._id] ? ' active' : ''))" :style="getEquipmentStyle(equipment._id)">
            <archmage-h-equipment :equipment="equipment" :bonuses="getBonuses(equipment)" :ref="concat('equipment--', equipment._id)"></archmage-h-equipment>
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
      equipment: [],
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        // { value: 'chakra', label: 'Chakra' } // TODO: Add this after fixing the typo in the template.
      ],
      sortBy: 'custom',
      searchValue: null,
      activeEquipment: {}
    }
  },
  computed: {
    classes() {
      return `section section--inventory flexcol${this.tab.active ? ' active' : ''}`;
    }
  },
  methods: {
    /**
     * Clean a equipment name for usage in group keys.
     */
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    },
    /**
     * Update the `equipment` prop to be equal to a filtered version of the current
     * equipment items on the actor. Filters by type and search keys.
     */
    getEquipment() {
      let equipment = this.actor.items.filter(i => i.type == 'equipment');
      if (this.searchValue) {
        equipment = equipment.filter(i => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = `${i.name}${i.data.chackra ? i.data.chackra : ''}`;

          let bonuses = this.getBonuses(i);
          for (let [k,v] of Object.entries(bonuses)) {
            haystack = `${haystack}${k}${v}`;
          }

          haystack = this.cleanClassName(haystack);

          return haystack.includes(needle);
        });
      }
      if (this.sortBy == 'name') {
        equipment = equipment.sort((a,b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      }
      equipment.forEach(i => {
        if (this.activeEquipment[i._id] == undefined) {
          this.$set(this.activeEquipment, i._id, {value: false});
          this.activeEquipment[i._id] = false;
        }
      });
      this.equipment = equipment;
    },
    getBonuses(equipment) {
      let bonuses = {};
      for (let [prop, value] of Object.entries(equipment.data.attributes)) {
        if (value.bonus) {
          bonuses[prop] = value.bonus
        }
        else if (prop == 'attack') {
          for (let [atkProp, atkValue] of Object.entries(value)) {
            if (atkValue.bonus) {
              bonuses[atkProp] = atkValue.bonus;
            }
          }
        }
      }
      return bonuses;
    },
    /**
     * Toggle equipment display (click event).
     */
    toggleEquipment(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.itemId;
      if (id) {
        // Toggle the state if the equipment is currently being tracked.
        if (this.activeEquipment[id] !== undefined) {
          this.$set(this.activeEquipment, id, !this.activeEquipment[id]);
        }
        // Otherwise, assume it should be open since this was click event.
        else {
          this.$set(this.activeEquipment, id, true);
        }
      }
    },
    /**
     * Calculate CSS height of equipment.
     */
    getEquipmentStyle(equipmentId) {
      // Retrieve the element from our refs.
      let equipment = this.$refs[`equipment--${equipmentId}`];
      let height = 0;

      // Set the height if there's a ref.
      if (equipment) {
        height = this.activeEquipment[equipmentId] ? `${equipment[0].$el.clientHeight}px` : `0px`;
      }

      // Return CSS style object.
      return {
        maxHeight: height
      };
    }
  },
  watch: {
    'actor.items': {
      deep: true,
      handler() {
        this.getEquipment();
      }
    },
    'searchValue': {
      deep: false,
      handler() {
        this.getEquipment();
      }
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.getEquipment();
  }
}
</script>