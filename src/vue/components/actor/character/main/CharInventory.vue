<template>
  <section :class="classes">
    <!-- Currency. -->
    <section class="equipment-currency flexrow" v-if="!actor.flags?.archmage?.hideCurrency">
      <div v-for="(type) in currency" :key="type" :class="concat('unit unit--currency unit--currency-', type)">
        <h2 class="unit-title">{{localize(concat('ARCHMAGE.COINS.', type))}}</h2>
        <input type="number" :name="concat('system.coins.', type, '.value')" class="currency-input" v-model="actor.system.coins[type].value" placeholder="0">
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
        <template v-for="equipment in equipmentGroups[groupKey]" :key="equipment._id">
          <ExpandableEquipment v-if="equipment.type == 'equipment'" :equipment="equipment"/>
          <ExpandableLoot v-else :equipment="equipment"/>
        </template>
      </ul>
    </section>
  </section>
</template>

<script>
import { concat, equipmentBonuses, localize } from '@/methods/Helpers';
import ExpandableEquipment from '@/components/parts/ExpandableEquipment.vue';
import ExpandableLoot from '@/components/parts/ExpandableLoot.vue';
export default {
  name: 'CharInventory',
  props: ['actor', 'tab', 'flags'],
  data() {
    return {
      equipment: [],
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        // { value: 'chakra', label: 'Chakra' } // TODO: Add this after fixing the typo in the template.
      ],
      groupBy: 'equipment',
      sortBy: 'custom',
      searchValue: null,
      currency: [
        'platinum',
        'gold',
        'silver',
        'copper'
      ]
    }
  },
  setup() {
    return {
      concat,
      localize
    }
  },
  components: {
    ExpandableEquipment,
    ExpandableLoot
  },
  computed: {
    classes() {
      return `section section--inventory flexcol`;
    },
    groups() {
      let groups = {};
      let sortTypes = [
        'equipment',
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
      let equipmentByGroup = this.equipment.reduce((equipmentGroup, equipment) => {
        let group = equipment.type ? equipment.type : 'equipment';
        // Override legacy 'tool' with 'loot'
        group = group == 'tool' ? 'loot' : group;

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
          let haystack = `${i.name}${i.system.chackra ? i.system.chackra : ''}`;

          if (i.type == 'equipment') {
            let bonuses = equipmentBonuses(i);
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
      else {
        // Custom order: honour the `sort` value that drag and drop writes.
        equipment = equipment.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      }
      this.equipment = equipment;
    },
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
    },
    'sortBy': {
      deep: false,
      handler() {
        this.getEquipment();
      }
    }
  },
  async mounted() {
    this.getEquipment();
    this.sortBy = this.flags.sheetDisplay.inventory.sortBy.value ? this.flags.sheetDisplay.inventory.sortBy.value : 'custom';
  }
}
</script>
