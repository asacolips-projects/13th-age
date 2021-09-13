<template>
  <section :class="classes" data-tab="inventory">
    <!-- Currency. -->
    <section class="equipment-currency flexrow">
      <div v-for="type in currency" :key="type" :class="concat('unit unit--currency unit--currency-', type)">
        <h2 class="unit-title">{{localize(concat('ARCHMAGE.COINS.', type))}}</h2>
        <input type="number" :name="concat('data.coins.', type, '.value')" class="currency-input" v-model="actor.data.coins[type].value" placeholder="0">
      </div>
    </section>
    <!-- Sorts and filters. -->
    <header class="equipment-filters flexrow">
      <div class="sort-equipment">
        <input type="hidden" name="flags.archmage.sheetDisplay.inventory.sortBy.value" v-model="sortBy"/>
        <label for="equipment-sort">{{localize('ARCHMAGE.sort')}}</label>
        <select name="equipment-sort" v-model="sortBy">
          <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.', option.value))}}</option>
        </select>
      </div>
      <div class="filter-search-equipment">
        <label for="equipment-filter-search">{{localize('ARCHMAGE.filter')}}</label>
        <input type="text" name="equipment-filter-search" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
      </div>
    </header>
    <!-- Equipment, by group. -->
    <section v-for="(group, groupKey) in groups" :key="groupKey" class="equipment-group">
      <div class="equipment-group-header">
        <!-- Group title and add button. -->
        <div class="equipment-header-title grid equipment-grid">
          <h2 class="equipment-group-title unit-title">{{localize(group)}}</h2>
          <div class="item-controls">
            <a class="item-control item-create" :data-item-type="groupKey"><i class="fas fa-plus"></i> {{localize('ARCHMAGE.add')}}</a>
          </div>
        </div>
        <!-- Column labels. -->
        <div class="equipment-header-labels grid equipment-grid">
          <div class="equipment-name">{{localize('ARCHMAGE.equipmentName')}}</div>
          <div class="equipment-feat-pips" v-if="groupKey == 'equipment'">{{localize('ARCHMAGE.ITEM.active')}}</div>
          <div class="equipment-bonus" v-if="groupKey == 'equipment'">{{localize('ARCHMAGE.bonuses')}}</div>
          <div class="equipment-chakra" v-if="groupKey == 'equipment'">{{localize('ARCHMAGE.chakra')}}</div>
          <div class="equipment-recharge" v-if="groupKey == 'equipment'">{{localize('ARCHMAGE.rchg')}}</div>
          <div class="equipment-quantity" v-if="groupKey == 'equipment'">{{localize('ARCHMAGE.uses')}}</div>
          <div class="equipment-quantity" v-if="groupKey != 'equipment'">{{localize('ARCHMAGE.quantity')}}</div>
          <div class="item-controls">{{localize('ARCHMAGE.edit')}}</div>
        </div>
      </div>
      <ul class="equipment-group-content flexcol">
        <li v-for="(equipment, equipmentKey) in equipmentGroups[groupKey]" :key="equipmentKey" :class="concat('item equipment-item equipment-item--', equipment._id)" :data-item-id="equipment._id" :data-draggable="draggable" :draggable="draggable">
          <!-- Clickable equipment header. -->
          <div class="equipment-summary grid equipment-grid equipment">
            <archmage-h-rollable name="item" :hide-icon="true" type="item" :opt="equipment._id"><img :src="equipment.img" class="equipment-image"/></archmage-h-rollable>
            <a class="equipment-name" v-on:click="toggleEquipment" :data-item-id="equipment._id">
              <h3 class="equipment-title unit-subtitle">{{equipment.name}}</h3>
            </a>
            <div class="equipment-feat-pips">

              <ul class="feat-pips">
                <li :class="concat('feat-pip', (equipment.data.isActive ? ' active' : ''))" :data-item-id="equipment._id"><div class="hide">{{equipment.data.isActive}}</div></li>
              </ul>

            </div>
            <div class="equipment-bonus flexrow" v-if="equipment.data.attributes">
              <span class="bonus" v-for="(bonus, bonusProp) in getBonuses(equipment)" :key="bonusProp">
                <span class="bonus-label">{{bonusProp}} </span>
                <span class="bonus-value">{{numberFormat(bonus, 0, true)}}</span>
              </span>
            </div>
            <div class="equipment-chakra" v-if="equipment.data.chackra">{{equipment.data.chackra}}</div>
            <div class="equipment-recharge" v-if="equipment.data.recharge.value && equipment.data.powerUsage.value == 'recharge'">
              <archmage-h-rollable name="recharge" type="recharge" :opt="equipment._id">{{equipment.data.recharge.value}}+</archmage-h-rollable>
            </div>
            <div class="equipment-quantity" :data-item-id="equipment._id" :data-quantity="equipment.data.quantity.value"><span>{{equipment.data.quantity.value}}</span></div>
            <div class="item-controls">
              <a class="item-control item-edit" :data-item-id="equipment._id"><i class="fas fa-edit"></i></a>
              <a class="item-control item-delete" :data-item-id="equipment._id"><i class="fas fa-trash"></i></a>
            </div>
          </div>
          <!-- Expanded equipment content. -->
          <div :class="concat('equipment-content', (activeEquipment[equipment._id] ? ' active' : ''))" :style="getEquipmentStyle(equipment._id)">
            <archmage-h-equipment v-if="equipment.type == 'equipment'" :equipment="equipment" :bonuses="getBonuses(equipment)" :ref="concat('equipment--', equipment._id)"></archmage-h-equipment>
            <archmage-h-loot v-if="equipment.type != 'equipment'" :equipment="equipment" :ref="concat('equipment--', equipment._id)"></archmage-h-loot>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab', 'flags'],
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
      activeEquipment: {},
      currency: [
        'platinum',
        'gold',
        'silver',
        'copper'
      ]
    }
  },
  computed: {
    draggable() {
      return this.sortBy == 'custom' ? true : false;
    },
    classes() {
      return `section section--inventory flexcol${this.tab.active ? ' active' : ''}`;
    },
    groups() {
      let groups = {};
      let sortTypes = [
        'equipment',
        'tool',
        'loot',
      ];
      // Handle the built-in sort types.
      let sortKey = `${this.groupBy}`;
      for (let key of sortTypes) {
        groups[key] = `ARCHMAGE.INVENTORY.${key}`;
      }
      return groups;
    },
    equipmentGroups() {
      let sortTypes = [
        'equipment',
        'tool',
        'loot',
      ];

      let equipmentByGroup = this.equipment.reduce((equipmentGroup, equipment) => {
        let group = equipment.type ? equipment.type : 'equipment';

        // Create the group if it doesn't exist.
        if (!equipmentGroup[group]) {
          equipmentGroup[group] = [];
        }
        // Add the equipment and return for the next iteration.
        equipmentGroup[group].push(equipment);
        return equipmentGroup;
      }, {});

      return equipmentByGroup;
    },
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
      let equipment = this.actor.items.filter(i => i.type == 'equipment' || i.type == 'loot' || i.type == 'tool');
      if (this.searchValue) {
        equipment = equipment.filter(i => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = `${i.name}${i.data.chackra ? i.data.chackra : ''}`;

          if (i.type == 'equipment') {
            let bonuses = this.getBonuses(i);
            for (let [k,v] of Object.entries(bonuses)) {
              haystack = `${haystack}${k}${v}`;
            }
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
    this.sortBy = this.flags.sheetDisplay.inventory.sortBy.value ? this.flags.sheetDisplay.inventory.sortBy.value : 'custom';
  }
}
</script>