<template>
  <section class="section section--sidebar flexcol filters">

    <!-- Sort. -->
    <div class="unit unit--input">
      <label for="compendiumBrowser.sort" class="unit-title">Sort</label>
      <select class="sort" name="compendiumBrowser.sort" v-model="sortBy">
        <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <!-- Name filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.itemName">Name</label>
      <input type="text" id="compendiumBrowser.itemName" name="compendiumBrowser.itemName" v-model="name" placeholder="Sword"/>
    </div>

    <!-- Chakra filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.chakra">Chakra</label>
      <Multiselect
        v-model="chakra"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="chakraSlots"
      />
    </div>

    <!-- Bonuses filter. -->
    <div class="unit unit--input">
      <h2 class="unit-title" for="compendiumBrowser.bonuses">Bonus</h2>
      <Multiselect
        v-model="bonuses"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="bonusOptions"
      />
    </div>

    <!-- Recharge filter. -->
    <div class="unit unit--input">
      <h2 class="unit-title" for="compendiumBrowser.recharge">Recharge</h2>
      <Multiselect
        v-model="recharge"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="rechargeOptions"
      />
    </div>

    <!-- Usage filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerUsage">Usage</label>
      <Multiselect
        v-model="powerUsage"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.powerUsages"
      />
    </div>

    <!-- Reset. -->
    <div class="unit unit--input flexrow">
      <button type="reset" @click="resetFilters()">Reset</button>
    </div>

  </section>

  <section class="section section--no-overflow">
    <!-- Items results. -->
    <section class="section section--main section--inventory flexcol">
      <ul class="compendium-browser-results compendium-browser-items">
        <!-- Individual items entries. -->
        <li v-for="(equipment, equipmentKey) in entries" :key="equipmentKey" :class="`equipment-summary equipment compendium-browser-row${equipmentKey >= pager.lastIndex - 1 && equipmentKey < pager.totalRows - 1 ? ' compendium-browser-row-observe': ''} flexrow document item equipment-item`" :data-document-id="equipment._id" @click="openDocument(equipment.uuid, 'Item')">
          <!-- Both the image and title have drag events. These are primarily separated so that -->
          <!-- if a user drags the token, it will only show the token as their drag preview. -->
          <img :src="equipment.img" class="equipment-image" @dragstart="startDrag($event, equipment, 'Item')" draggable="true"/>
          <div class="flexcol equipment-contents" @dragstart="startDrag($event, equipment, 'Item')" draggable="true">
            <!-- First row is the title. -->
            <div class="equipment-title-wrapper">
              <strong class="equipment-title unit-subtitle">{{equipment.name}}</strong>
            </div>
            <!-- Second row is supplemental info. -->
            <div class="grid equipment-grid">
              <div class="equipment-bonus flexrow" data-tooltip="Bonuses" data-tooltip-direction="RIGHT" v-if="equipment.system.attributes">
                <span class="bonus" v-for="(bonus, bonusProp) in getBonuses(equipment)" :key="bonusProp">
                  <span class="bonus-label">{{localizeEquipmentBonus(bonusProp)}} </span>
                  <span class="bonus-value">{{numberFormat(bonus, 0, true)}}</span>
                </span>
              </div>
              <div class="equipment-usage" v-if="equipment.system?.powerUsage?.value" data-tooltip="Usage">{{ CONFIG.ARCHMAGE.powerUsages[equipment.system?.powerUsage?.value ?? ''] ?? '' }}</div>
              <div class="equipment-chakra" data-tooltip="Chakra" v-if="equipment.system.chackra">{{localize(`ARCHMAGE.CHAKRA.${equipment.system.chackra}Label`)}}</div>
              <div class="equipment-recharge" data-tooltip="Recharge">{{ `${equipment.system?.recharge?.value > 0 ? Number(equipment.system.recharge.value) + '+' : ''}`}}</div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
// onUpdated() is used for the infinite scroll intersection observer.
import { onUpdated } from 'vue';
// External components.
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
// Helper methods.
import {
  getPackIndex,
  localize,
  localizeEquipmentBonus,
  numberFormat,
  openDocument,
  startDrag
} from '@/methods/Helpers.js';

export default {
  name: 'CompendiumBrowserItems',
  props: ['tab'],
  // Imported components that need to be available in the <template>
  components: {
    Slider,
    Multiselect
  },
  setup() {
    return {
      // Imported methods that need to be available in the <template>
      localize,
      localizeEquipmentBonus,
      numberFormat,
      openDocument,
      startDrag,
      // Foundry base props and methods.
      CONFIG,
      foundry,
      game,
      getDocumentClass
    }
  },
  data() {
    return {
      // Props used for infinite scroll and pagination.
      observer: null,
      pager: {
        perPage: 50,
        firstIndex: 0,
        lastIndex: 50,
        totalRows: 0,
      },
      // Sorting.
      sortBy: 'name',
      sortOptions: [
        { value: 'name', label: 'Name' },
        { value: 'chakra', label: 'Chakra / Bonus' },
        { value: 'recharge', label: 'Recharge' },
        { value: 'usage', label: 'Usage' },
      ],
      // Our list of pseudo documents returned from the compendium.
      packIndex: [],
      // Filters.
      name: '',
      chakra: [],
      recharge: [],
      bonuses: [],
      powerUsage: [],
    }
  },
  methods: {
    /**
     * Callback for the infinite scroll IntersectionObserver.
     *
     * @param {Array} List of IntersectionObserverEntry objects.
     */
     infiniteScroll(entries) {
      // Iterate over our possible elements.
      entries.forEach(({target, isIntersecting}) => {
        // If the element isn't visible, do nothing.
        if (!isIntersecting) {
          return;
        }

        // Otherwise, remove the observer and update our pager properties.
        // We need to increase the lastIndex for our filter by an amount
        // equal to our number of entries per page.
        this.observer.unobserve(target);
        this.pager.lastIndex = Math.min(
          this.pager.lastIndex + this.pager.perPage,
          this.pager.totalRows
        );
      });
    },
    /**
     * Click event to reset our filters.
     */
     resetFilters() {
      this.sortBy = 'name';
      this.name = '';
      this.chakra = [];
      this.recharge = [];
      this.bonuses = [];
      this.powerUsage = [];
    },
    getBonuses(equipment) {
      let bonuses = {};
      for (let [prop, value] of Object.entries(equipment.system.attributes)) {
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
  },
  computed: {
    bonusOptions() {
      return [
        {
          value: 'melee',
          dataProp: 'system.attributes.attack.melee.bonus',
          label: 'Melee',
        },
        {
          value: 'ranged',
          dataProp: 'system.attributes.attack.ranged.bonus',
          label: 'Ranged',
        },
        {
          value: 'divine',
          dataProp: 'system.attributes.attack.divine.bonus',
          label: 'Divine',
        },
        {
          value: 'arcane',
          dataProp: 'system.attributes.attack.arcane.bonus',
          label: 'Arcane',
        },
        {
          value: 'ac',
          dataProp: 'system.attributes.ac.bonus',
          label: 'AC',
        },
        {
          value: 'md',
          dataProp: 'system.attributes.md.bonus',
          label: 'PD',
        },
        {
          value: 'pd',
          dataProp: 'system.attributes.pd.bonus',
          label: 'MD',
        },
        {
          value: 'hp',
          dataProp: 'system.attributes.hp.bonus',
          label: 'HP',
        },
        {
          value: 'recoveries',
          dataProp: 'system.attributes.recoveries.bonus',
          label: 'Recoveries',
        },
        {
          value: 'save',
          dataProp: 'system.attributes.save.bonus',
          label: 'Save',
        },
        {
          value: 'disengage',
          dataProp: 'system.attributes.disengage.bonus',
          label: 'Disengage',
        },
      ];
    },
    rechargeOptions() {
      return [
        {
          value: 6,
          label: 'Easy (6+)',
          next: 10,
        },
        {
          value: 11,
          label: 'Normal (11+)',
          next: 15,
        },
        {
          value: 16,
          label: 'Hard (16+)',
          next: 20,
        }
      ]
    },
    chakraSlots() {
      const result = {};
      for (let [k,v] of Object.entries(CONFIG.ARCHMAGE.chakraSlots)) {
        result[k] = this.game.i18n.localize(`${v}Label`);
      }
      return result;
    },
    nightmode() {
      return game.settings.get("archmage", "nightmode") ? 'nightmode' : '';
    },
    entries() {
      // Build our results array. Exit early if the length is 0.
      let result = this.packIndex;
      if (result.length < 1) {
        this.pager.totalRows = 0;
        return [];
      }

      // Filter by name.
      if (this.name && this.name.length > 0) {
        const name = this.name.toLocaleLowerCase();
        result = result.filter(entry => entry.name.toLocaleLowerCase().includes(name));
      }

      // Handle multiselect filters, which use arrays as their values.
      if (Array.isArray(this.chakra) && this.chakra.length > 0) {
        // @todo chakra is misspelled in our data model. We need to fix that :(
        result = result.filter(entry => this.chakra.includes(entry.system?.chackra));
      }
      if (Array.isArray(this.powerUsage) && this.powerUsage.length > 0) {
        result = result.filter(entry => this.powerUsage.includes(entry.system?.powerUsage?.value ?? 'other'));
      }

      // Recharge.
      if (Array.isArray(this.recharge) && this.recharge.length > 0) {
        result = result.filter(entry => {
          let allowEntry = false;
          for (let rechargeOption of this.rechargeOptions) {
            if (this.recharge.includes(rechargeOption.value)) {
              const rechargeEntry = parseInt(entry.system?.recharge?.value ?? 0);
              if (rechargeEntry >= rechargeOption.value && rechargeEntry <= rechargeOption.next) {
                allowEntry = true;
                break;
              }
            }
          }
          return allowEntry;
        });
      }

      // Bonus options.
      if (Array.isArray(this.bonuses) && this.bonuses.length > 0) {
        result = result.filter(entry => {
          let allowEntry = false;
          for (let bonusOption of this.bonusOptions) {
            if (this.bonuses.includes(bonusOption.value)) {
              const prop = this.foundry.utils.getProperty(entry, bonusOption.dataProp);
              if (Number.isNumeric(prop) && prop !== 0) {
                allowEntry = true;
                break;
              }
            }
          }
          return allowEntry;
        });
      }

      // Reflow pager.
      if (result.length > this.pager.perPage) {
        this.pager.totalRows = result.length;
        if (this.pager.lastIndex == 0) {
          this.pager.lastIndex = this.pager.perPage - 1;
        }
      }
      else {
        this.pager.totalRows = 0;
      }

      // Sort.
      result = result.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      // Sort.
      result = result.sort((a, b) => {
        switch (this.sortBy) {
          case 'chakra':
            return (a.system?.chackra ?? '').localeCompare((b.system?.chackra ?? ''));
          case 'usage':
            return (a.system?.powerUsage?.value ?? '').localeCompare((b.system?.powerUsage?.value ?? ''));
          case 'recharge':
            return (a.system?.recharge?.value ?? 0) - (b.system?.recharge?.value ?? 0);
        }
        return a.name.localeCompare(b.name);
      });

      // Return results.
      return this.pager.totalRows > 0
        ? result.slice(this.pager.firstIndex, this.pager.lastIndex)
        : result;
    },
  },
  watch: {},
  // Handle created hook.
  async created() {
    console.log("Creating compendium browser magic items tab...");

    // Load the pack index with the fields we need.
    getPackIndex([
      'archmage.srd-magic-items-armors',
      'archmage.srd-magic-items-arrows',
      'archmage.srd-magic-items-belts',
      'archmage.srd-magic-items-books',
      'archmage.srd-magic-items-boots',
      'archmage.srd-magic-items-chuul-symbiotes',
      'archmage.srd-magic-items-cloaks',
      'archmage.srd-magic-items-consumables',
      'archmage.srd-magic-items-cursed',
      'archmage.srd-magic-items-gloves',
      'archmage.srd-magic-items-helmets',
      'archmage.srd-magic-items-necklaces',
      'archmage.srd-magic-items-rings',
      'archmage.srd-magic-items-shields',
      'archmage.srd-magic-items-staffs',
      'archmage.srd-magic-items-symbols',
      'archmage.srd-magic-items-wands',
      'archmage.srd-magic-items-weapons',
      'archmage.srd-magic-items-wondrous-items',
    ], [
      'system.chackra',
      'system.recharge.value',
      'system.powerUsage.value',
      'system.attributes.attack',
      'system.attributes.ac',
      'system.attributes.md',
      'system.attributes.pd',
      'system.attributes.hp',
      'system.attributes.recoveries',
      'system.attributes.save',
      'system.attributes.disengage',
    ]).then(packIndex => this.packIndex = packIndex);

    // Create our intersection observer for infinite scroll.
    this.observer = new IntersectionObserver(this.infiniteScroll, {
      root: this.$el,
      threshold: 0.5,
    });
  },
  // Handle mounted hook.
  async mounted() {
    console.log("Compendium browser magic items tab mounted.");

    // Note that our tab has beened opened so that it won't de-render later.
    this.tab.opened = true;

    // Adjust our observers whenever the results of the compendium browser
    // are updated.
    onUpdated(() => {
      const target = document.querySelector('.compendium-browser-items .compendium-browser-row-observe');
      if (target) {
        this.observer.observe(target);
      }
    });
  },
  // Handle the unmount hook.
  async beforeUnmount() {
    // Handle the unmount hook.
    this.observer.disconnect();
  }
}
</script>

<style lang="scss">
  @import "@vueform/slider/themes/default.css";
  @import "@vueform/multiselect/themes/default.css";
</style>