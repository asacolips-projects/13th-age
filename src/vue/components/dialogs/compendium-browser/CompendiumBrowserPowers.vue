<template>
  <section class="section section--sidebar flexcol filters">

    <div class="unit unit--input">
      <label for="compendiumBrowser.sort" class="unit-title">Sort</label>
      <select class="sort" name="compendiumBrowser.sort" v-model="sortBy">
        <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerLevel">Level</label>
      <div class="level-range flexrow">
        <div class="level-label"><span>{{ levelRange[0] }}</span><span v-if="levelRange[0] !== levelRange[1]"> - {{ levelRange[1] }}</span></div>
        <div class="level-input slider-wrapper flexrow">
          <Slider v-model="levelRange" :min="1" :max="10" :tooltips="false"/>
        </div>
      </div>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerName">Name</label>
      <input type="text" id="compendiumBrowser.powerName" name="compendiumBrowser.powerName" v-model="name" placeholder="Fireball"/>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerSourceName">Source</label>
      <input type="text" id="compendiumBrowser.powerSourceName" name="compendiumBrowser.powerSourceName" v-model="powerSourceName" placeholder="Fighter"/>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.powerType">Type</label>
      <Multiselect
        v-model="powerType"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.powerTypes"
      />
    </div>

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

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.actionType">Action</label>
      <Multiselect
        v-model="actionType"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.actionTypes"
      />
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.trigger">Trigger</label>
      <input type="text" id="compendiumBrowser.trigger" name="compendiumBrowser.trigger" v-model="trigger" placeholder="Even hit"/>
    </div>

  </section>

  <section class="section section--no-overflow">
    <section class="section section--powers section--main flexcol">
      <ul class="compendium-browser-results compendium-browser-powers">
        <li v-for="(entry, entryKey) in entries" :key="entryKey" :class="`power-summary ${(entry.system.powerUsage.value ? entry.system.powerUsage.value : 'other')} compendium-browser-row${entryKey >= pager.lastIndex - 1 && entryKey < pager.totalRows - 1 ? ' compendium-browser-row-observe': ''} flexrow document item`" :data-document-id="entry._id" @click="openDocument(entry.uuid)" :data-tooltip="CONFIG.ARCHMAGE.powerUsages[entry.system.powerUsage.value] ?? ''" data-tooltip-direction="RIGHT">
          <img :src="entry.img" @dragstart="startDrag($event, entry)" draggable="true"/>
          <div class="flexcol power-contents" @dragstart="startDrag($event, entry)" draggable="true">
            <div class="power-title-wrapper">
              <strong class="power-title"><span v-if="entry?.system?.powerLevel?.value">[{{ entry.system.powerLevel.value }}]</span> {{ entry?.name }}</strong>
              <strong class="power-source" v-if="entry.system.powerSourceName.value">{{ entry.system.powerSourceName.value }}</strong>
            </div>
            <div class="grid power-grid">
              <div v-if="entry.system.trigger.value" class="power-trigger"><strong>Trigger:</strong> {{ entry.system.trigger.value }}</div>
              <div class="power-feat-pips" data-tooltip="Feats" v-if="hasFeats(entry)">
                <ul class="feat-pips">
                  <li v-for="(feat, tier) in filterFeats(entry.system.feats)" :key="tier" :class="`feat-pip active`"></li>
                </ul>
              </div>
              <div class="power-recharge" data-tooltip="Recharge" v-if="entry.system.recharge.value && entry.system.powerUsage.value == 'recharge'">{{Number(entry.system.recharge.value) || 16}}+</div>
              <div class="power-action" data-tooltip="Action Type" v-if="entry.system.actionType.value">{{getActionShort(entry.system.actionType.value)}}</div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
import { getPackIndex } from '@/methods/Helpers.js';
import { onUpdated } from 'vue';

export default {
  name: 'CompendiumBrowserPowers',
  props: ['tab'],
  components: {
    Slider,
    Multiselect
  },
  setup() {
    return {
      // Foundry base props and methods.
      CONFIG,
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
        lastIndex: 50,
        totalRows: 0,
        style: 'input'
      },
      sortBy: 'level',
      sortOptions: [
        { value: 'level', label: 'Level' },
        { value: 'name', label: 'Name' },
        { value: 'source', label: 'Source' },
        { value: 'type', label: 'Type' },
        { value: 'usage', label: 'Usage' },
        { value: 'action', label: 'Action' },
      ],
      packIndex: [],
      name: '',
      levelRange: [1, 10],
      actionType: [],
      powerType: [],
      powerSourceName: '',
      powerUsage: [],
      trigger: '',
      observer: null,
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
    infiniteScroll(entries) {
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) {
          return;
        }

        this.observer.unobserve(target);
        this.pager.lastIndex = Math.min(this.pager.lastIndex + this.pager.perPage, this.pager.totalRows);
      });
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
      let result = this.packIndex;

      if (result.length < 1) {
        this.pager.totalRows = 0;
        return [];
      }

      if (this.name && this.name.length > 0) {
        const name = this.name.toLocaleLowerCase();
        result = result.filter(entry => entry.name.toLocaleLowerCase().includes(name));
      }

      if (this.levelRange.length == 2) {
        result = result.filter(entry =>
          entry.system.powerLevel.value >= this.levelRange[0] &&
          entry.system.powerLevel.value <= this.levelRange[1]
        );
      }

      if (this.powerSourceName && this.powerSourceName.length > 0) {
        const name = this.powerSourceName.toLocaleLowerCase();
        result = result.filter(entry => entry.system.powerSourceName.value.toLocaleLowerCase().includes(name));
      }

      if (this.trigger && this.trigger.length > 0) {
        const name = this.trigger.toLocaleLowerCase();
        result = result.filter(entry => entry.system.trigger.value && entry.system.trigger.value.toLocaleLowerCase().includes(name));
      }

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
  async created() {
    console.log("Creating compendium browser powers tab...");
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

    this.observer = new IntersectionObserver(this.infiniteScroll, {
      root: this.$el,
      threshold: 0.1,
    });
  },
  async mounted() {
    console.log("Compendium browser powers tab mounted.");
    this.tab.opened = true;

    onUpdated(() => {
      console.log("Compendium browser magic items tab updated.");
      const target = document.querySelector('.compendium-browser-powers .compendium-browser-row-observe');
      if (target) {
        this.observer.observe(target);
      }
    });
  },
  async beforeUnmount() {
    this.observer.disconnect();
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