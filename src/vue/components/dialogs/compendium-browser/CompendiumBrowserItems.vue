<template>
  <section class="section section--sidebar flexcol filters">
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.itemName">Name</label>
      <input type="text" id="compendiumBrowser.itemName" name="compendiumBrowser.itemName" v-model="name"/>
    </div>

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

    <div class="unit unit--input">
      <h2 class="unit-title" for="compendiumBrowser.bonuses">Recharge</h2>
      <label><input type="checkbox" v-model="recharge">Has recharge</label>
    </div>

    <div class="unit unit--input">
      <h2 class="unit-title" for="compendiumBrowser.bonuses">Bonus</h2>
      <label v-for="(bonusName, bonusKey) in bonusOptions" :key="bonusKey"><input type="checkbox" v-model="bonuses[bonusKey]">{{ bonusName.label }}</label>
    </div>

  </section>

  <section class="section section--no-overflow">
    <section class="section section--main section--inventory flexcol">
      <ul class="compendium-browser-results">
        <li v-for="(equipment, equipmentKey) in entries" :key="equipmentKey" class="compendium-browser-row flexrow document item equipment-item" :data-document-id="equipment._id" @click="openDocument(equipment.uuid)">
          <div class="equipment-summary grid equipment-grid equipment" @dragstart="startDrag($event, equipment)" draggable="true">
            <img :src="equipment.img" class="equipment-image"/>
            <h3 class="equipment-title unit-subtitle">{{equipment.name}}</h3>
            <div class="equipment-bonus flexrow" v-if="equipment.system.attributes">
              <span class="bonus" v-for="(bonus, bonusProp) in getBonuses(equipment)" :key="bonusProp">
                <span class="bonus-label">{{localizeEquipmentBonus(bonusProp)}} </span>
                <span class="bonus-value">{{numberFormat(bonus, 0, true)}}</span>
              </span>
            </div>
            <div class="equipment-chakra" v-if="equipment.system.chackra">{{localize(`ARCHMAGE.CHAKRA.${equipment.system.chackra}Label`)}}</div>
            <div class="equipment-recharge">{{ `${equipment.system?.recharge?.value > 0 ? Number(equipment.system.recharge.value) + '+' : ''}`}}</div>
          </div>
        </li>
      </ul>
    </section>
    <Pager v-if="pager.totalRows > 0" :pagerOptions="pager"/>
  </section>
</template>

<script>
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
import Pager from '@/components/parts/Pager.vue';
import { getPackIndex, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers.js';

export default {
  name: 'CompendiumBrowserItems',
  props: [],
  components: {
    Slider,
    Multiselect,
    Pager
  },
  setup() {
    return {
      localize,
      localizeEquipmentBonus,
      numberFormat,
      // Foundry base props and methods.
      CONFIG,
      foundry,
      game,
      getDocumentClass
    }
  },
  data() {
    return {
      pager: {
        perPage: 50,
        pages: 0,
        current: 1,
        firstIndex: 0,
        lastIndex: 0,
        totalRows: 0,
        style: 'input'
      },
      packIndex: [],
      name: '',
      chakra: [],
      recharge: false,
      bonuses: {
        melee: false,
        ranged: false,
        divine: false,
        arcane: false,
        ac: false,
        md: false,
        pd: false,
        hp: false,
        recoveries: false,
        save: false,
        disengage: false,
      }
    }
  },
  methods: {
    openDocument(uuid) {
      getDocumentClass('Item').fromDropData({
        type: 'Item',
        uuid: uuid
      }).then(document => {
        document.sheet.render(true);
      });
    },
    startDrag(event, entry) {
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'Item',
        uuid: entry.uuid
      }));
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
      return {
        melee: {
          dataProp: 'system.attributes.attack.melee.bonus',
          label: 'Melee',
        },
        ranged: {
          dataProp: 'system.attributes.attack.ranged.bonus',
          label: 'Ranged',
        },
        divine: {
          dataProp: 'system.attributes.attack.divine.bonus',
          label: 'Divine',
        },
        arcane: {
          dataProp: 'system.attributes.attack.arcane.bonus',
          label: 'Arcane',
        },
        ac: {
          dataProp: 'system.attributes.ac.bonus',
          label: 'AC',
        },
        md: {
          dataProp: 'system.attributes.md.bonus',
          label: 'PD',
        },
        pd: {
          dataProp: 'system.attributes.pd.bonus',
          label: 'MD',
        },
        hp: {
          dataProp: 'system.attributes.hp.bonus',
          label: 'HP',
        },
        recoveries: {
          dataProp: 'system.attributes.recoveries.bonus',
          label: 'Recoveries',
        },
        save: {
          dataProp: 'system.attributes.save.bonus',
          label: 'Save',
        },
        disengage: {
          dataProp: 'system.attributes.disengage.bonus',
          label: 'Disengage',
        },
      }
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
      let result = this.packIndex;

      if (result.length < 1) {
        this.pager.totalRows = 0;
        return [];
      }

      if (this.name && this.name.length > 0) {
        const name = this.name.toLocaleLowerCase();
        result = result.filter(entry => entry.name.toLocaleLowerCase().includes(name));
      }

      if (Array.isArray(this.chakra) && this.chakra.length > 0) {
        // @todo chakra is misspelled in our data model. We need to fix that :(
        result = result.filter(entry => this.chakra.includes(entry.system.chackra));
      }

      if (this.recharge) {
        result = result.filter(entry => entry.system?.recharge?.value && parseInt(entry.system.recharge.value) > 0);
      }

      // Handle bonuse filters.
      let needsBonusFilter = false;
      for (let bonus of Object.values(this.bonuses)) {
        if (bonus) {
          needsBonusFilter = true;
          break;
        }
      }
      if (needsBonusFilter) {
        result = result.filter(entry => {
          let allowEntry = false;
          for (let [k, v] of Object.entries(this.bonusOptions)) {
            if (this.bonuses[k]) {
              const prop = this.foundry.utils.getProperty(entry, this.bonusOptions[k].dataProp);
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
      }
      else {
        this.pager.totalRows = 0;
      }

      // Sort.
      result = result.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      // Return results.
      return this.pager.totalRows > 0
        ? result.slice(this.pager.firstIndex, this.pager.lastIndex)
        : result;
    },
  },
  watch: {},
  async created() {
    console.log("Creating compendium browser magic items tab...");
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
      'system.attributes.attack',
      'system.attributes.ac',
      'system.attributes.md',
      'system.attributes.pd',
      'system.attributes.hp',
      'system.attributes.recoveries',
      'system.attributes.save',
      'system.attributes.disengage',
    ]).then(packIndex => this.packIndex = packIndex);
  },
  async mounted() {
    console.log("Compendium browser magic items tab mounted.");
  }
}
</script>

<style lang="scss">
  @import "@vueform/slider/themes/default.css";
  @import "@vueform/multiselect/themes/default.css";

  .multiselect {
    width: 227px;
  }
</style>