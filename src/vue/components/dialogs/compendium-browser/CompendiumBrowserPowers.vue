<template>
  <section class="section section--sidebar flexcol filters">

    <!-- Sort. -->
    <div class="unit unit--input">
      <label for="compendiumBrowser.sort" class="unit-title">{{ localize('ARCHMAGE.sort') }}</label>
      <select class="sort" name="compendiumBrowser.sort" v-model="sortBy">
        <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <!-- Level range slider. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerLevel">{{ localize('ARCHMAGE.level') }}</label>
      <div class="level-range flexrow">
        <div class="level-label"><span>{{ levelRange[0] }}</span><span v-if="levelRange[0] !== levelRange[1]"> - {{ levelRange[1] }}</span></div>
        <div class="level-input slider-wrapper flexrow">
          <Slider v-model="levelRange" :min="1" :max="10" :tooltips="false"/>
        </div>
      </div>
    </div>

    <!-- Filter name. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerName">{{ localize('ARCHMAGE.name') }}</label>
      <input type="text" name="compendiumBrowser.powerName" v-model="name" placeholder="Fireball"/>
    </div>

    <!-- Filter source. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerSourceName">{{ localize('ARCHMAGE.CHAT.powerSourceName') }}</label>
      <input type="text" name="compendiumBrowser.powerSourceName" v-model="powerSourceName" placeholder="Fighter"/>
    </div>

    <!-- Filter type. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerType">{{ localize('ARCHMAGE.type') }}</label>
      <Multiselect
        v-model="powerType"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.powerTypes"
      />
    </div>

    <!-- Filter usage. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerUsage">{{ localize('ARCHMAGE.CHAT.powerUsage') }}</label>
      <Multiselect
        v-model="powerUsage"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.powerUsages"
      />
    </div>

    <!-- Filter action. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.actionType">{{ localize('ARCHMAGE.action') }}</label>
      <Multiselect
        v-model="actionType"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.actionTypes"
      />
    </div>

    <!-- Filter trigger. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.trigger">{{ localize('ARCHMAGE.CHAT.trigger') }}</label>
      <input type="text" name="compendiumBrowser.trigger" v-model="trigger" placeholder="Even hit"/>
    </div>

    <!-- Reset. -->
    <div class="unit unit--input flexrow">
      <button type="reset" @click="resetFilters()">{{ localize('Reset') }}</button>
    </div>

  </section>

  <section class="section section--no-overflow">
    <!-- Power results. -->
    <section class="section section--powers section--main flexcol">
      <ul class="compendium-browser-results compendium-browser-powers">
        <!-- Individual powers entries. -->
        <li v-for="(entry, entryKey) in entries" :key="entryKey" :class="`power-summary ${(entry.system.powerUsage.value ? entry.system.powerUsage.value : 'other')} compendium-browser-row${entryKey >= pager.lastIndex - 1 && entryKey < pager.totalRows - 1 ? ' compendium-browser-row-observe': ''} flexrow document item`" :data-document-id="entry._id" @click="openDocument(entry.uuid, 'Item')" :data-tooltip="CONFIG.ARCHMAGE.powerUsages[entry.system.powerUsage.value] ?? ''" data-tooltip-direction="RIGHT">
          <!-- Both the image and title have drag events. These are primarily separated so that -->
          <!-- if a user drags the token, it will only show the token as their drag preview. -->
          <img :src="entry.img" @dragstart="startDrag($event, entry, 'Item')" draggable="true"/>
          <div class="flexcol power-contents" @dragstart="startDrag($event, entry, 'Item')" draggable="true">
            <!-- First row is the title and class/source. -->
            <div class="power-title-wrapper">
              <strong class="power-title"><span v-if="entry?.system?.powerLevel?.value">[{{ entry.system.powerLevel.value }}]</span> {{ entry?.name }}</strong>
              <strong class="power-source" v-if="entry.system.powerSourceName.value">{{ entry.system.powerSourceName.value }}</strong>
            </div>
            <!-- Second row is supplemental info. -->
            <div class="grid power-grid">
              <div v-if="entry.system.trigger.value" class="power-trigger"><strong>Trigger:</strong> {{ entry.system.trigger.value }}</div>
              <div class="power-feat-pips" :data-tooltip="localize('ARCHMAGE.feats')" v-if="hasFeats(entry)">
                <ul class="feat-pips">
                  <li v-for="(feat, tier) in filterFeats(entry.system.feats)" :key="tier" :class="`feat-pip active`"></li>
                </ul>
              </div>
              <div class="power-recharge" :data-tooltip="localize('ARCHMAGE.recharge')" v-if="entry.system.recharge.value && entry.system.powerUsage.value == 'recharge'">{{Number(entry.system.recharge.value) || 16}}+</div>
              <div class="power-action" :data-tooltip="localize('ARCHMAGE.CHAT.actionTYpe')" v-if="entry.system.actionType.value">{{getActionShort(entry.system.actionType.value)}}</div>
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
  openDocument,
  startDrag,
} from '@/methods/Helpers.js';

export default {
  name: 'CompendiumBrowserPowers',
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
      openDocument,
      startDrag,
      // Foundry base props and methods.
      CONFIG,
      game,
      getDocumentClass
    }
  },
  data() {
    return {
      // Props used for infinited scroll and pagination.
      observer: null,
      pager: {
        perPage: 50,
        firstIndex: 0,
        lastIndex: 50,
        totalRows: 0,
      },
      // Sorting.
      sortBy: 'level',
      sortOptions: [
        { value: 'level', label: game.i18n.localize('ARCHMAGE.level') },
        { value: 'name', label: game.i18n.localize('ARCHMAGE.name') },
        { value: 'source', label: game.i18n.localize('ARCHMAGE.CHAT.powerSourceName') },
        { value: 'type', label: game.i18n.localize('ARCHMAGE.type') },
        { value: 'usage', label: game.i18n.localize('ARCHMAGE.GROUPS.powerUsage') },
        { value: 'action', label: game.i18n.localize('ARCHMAGE.action') },
      ],
      // Our list of pseudo documents returned from the compendium.
      packIndex: [],
      // Filters.
      name: '',
      levelRange: [1, 10],
      actionType: [],
      powerType: [],
      powerSourceName: '',
      powerUsage: [],
      trigger: '',
    }
  },
  methods: {
    /**
     * Callback for the infinite scroll IntersectionObserver.
     *
     * @param {Array} List of IntersectionObserverEntry objects.
     */
    infiniteScroll(entries) {
      entries.forEach(({target, isIntersecting}) => {
        // If the element isn't visible, do nothing.
        if (!isIntersecting) {
          return;
        }

        // Otherwise, remove the observer and update our pager properties.
        // We need to increase the lastIndex for our filter by an amount
        // equal to our number of entries per page.
        this.observer.unobserve(target);
        this.pager.lastIndex = Math.min(this.pager.lastIndex + this.pager.perPage, this.pager.totalRows);
      });
    },
    /**
     * Click event to reset our filters.
     */
    resetFilters() {
      this.sortBy = 'level';
      this.name = '';
      this.levelRange = [1, 10];
      this.actionType = [];
      this.powerType = [];
      this.powerSourceName = '';
      this.powerUsage = [];
      this.trigger = '';
    },
    /**
     * Retrieve the abbreviated action type, such as 'STD' or 'QCK'.
     */
     getActionShort(actionType) {
      if (CONFIG.ARCHMAGE.actionTypesShort[actionType]) {
        return CONFIG.ARCHMAGE.actionTypesShort[actionType];
      }
      return CONFIG.ARCHMAGE.actionTypesShort['standard'];
    },
    /**
     * Determine if this power has one or more feats.
     */
     hasFeats(power) {
      let hasFeats = false;
      if (power && power.system && power.system.feats) {
        for (let [id, feat] of Object.entries(power.system.feats)) {
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
    filterFeats(feats) {
      if (!feats) return {};
      let res = {};
      for (let [index, feat] of Object.entries(feats)) {
        if (feat.description.value) res[index] = feat;
      }
      return res;
    },
  },
  computed: {
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

      // Filter by level.
      if (this.levelRange.length == 2) {
        result = result.filter(entry =>
          entry.system.powerLevel.value >= this.levelRange[0] &&
          entry.system.powerLevel.value <= this.levelRange[1]
        );
      }

      // Filter by power source.
      if (this.powerSourceName && this.powerSourceName.length > 0) {
        const name = this.powerSourceName.toLocaleLowerCase();
        result = result.filter(entry => entry.system.powerSourceName.value.toLocaleLowerCase().includes(name));
      }

      // Filter by triger.
      if (this.trigger && this.trigger.length > 0) {
        const name = this.trigger.toLocaleLowerCase();
        result = result.filter(entry => entry.system.trigger.value && entry.system.trigger.value.toLocaleLowerCase().includes(name));
      }

      // Handle multiselect filters, which use arrays as their values.
      if (Array.isArray(this.powerType) && this.powerType.length > 0) {
        result = result.filter(entry => this.powerType.includes(entry.system.powerType.value));
      }
      if (Array.isArray(this.powerUsage) && this.powerUsage.length > 0) {
        result = result.filter(entry => this.powerUsage.includes(entry.system.powerUsage.value));
      }
      if (Array.isArray(this.actionType) && this.actionType.length > 0) {
        result = result.filter(entry => this.actionType.includes(entry.system.actionType.value));
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
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'source':
            return a.system?.powerSourceName?.value.localeCompare(b.system?.powerSourceName?.value);
          case 'type':
            return a.system?.powerType?.value.localeCompare(b.system?.powerType?.value);
          case 'usage':
            return a.system?.powerUsage?.value.localeCompare(b.system?.powerUsage?.value);
          case 'action':
            return a.system?.actionType?.value.localeCompare(b.system?.actionType?.value);
        }
        return a.system.powerLevel.value - b.system.powerLevel.value;
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
    console.log("Creating compendium browser powers tab...");
    // Load the pack index with the fields we need.
    getPackIndex([
      'archmage.barbarian',
      'archmage.bard',
      'archmage.cleric',
      'archmage.fighter',
      'archmage.paladin',
      'archmage.ranger',
      'archmage.animal-companion',
      'archmage.rogue',
      'archmage.sorcerer',
      'archmage.wizard',
      'archmage.chaosmage',
      'archmage.commander',
      'archmage.druid',
      'archmage.monk',
      'archmage.necromancer',
      'archmage.occultist',
    ], [
      'system.powerSourceName.value',
      'system.powerType.value',
      'system.powerLevel.value',
      'system.powerUsage.value',
      'system.actionType.value',
      'system.recharge.value',
      'system.trigger.value',
      'system.feats'
    ]).then(packIndex => this.packIndex = packIndex);

    // Create our intersection observer for infinite scroll.
    this.observer = new IntersectionObserver(this.infiniteScroll, {
      root: this.$el,
      threshold: 0.1,
    });
  },
  // Handle mounted hook.
  async mounted() {
    console.log("Compendium browser powers tab mounted.");

    // Note that our tab has beened opened so that it won't de-render later.
    this.tab.opened = true;

    // Adjust our observers whenever the results of the compendium browser
    // are updated.
    onUpdated(() => {
      const target = document.querySelector('.compendium-browser-powers .compendium-browser-row-observe');
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