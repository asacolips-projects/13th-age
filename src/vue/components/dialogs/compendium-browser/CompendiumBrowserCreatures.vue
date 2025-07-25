<template>
  <section class="section section--sidebar flexcol filters">
    <!-- Sort -->
    <div class="unit unit--input">
      <label for="compendiumBrowser.sort" class="unit-title">{{ localize('ARCHMAGE.sort') }}</label>
      <select class="sort" name="compendiumBrowser.sort" v-model="sortBy">
        <option v-for="(option, index) in sortOptions" :key="index" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <!-- Level range slider. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.level">{{ localize('ARCHMAGE.level') }}</label>
      <div class="level-range flexrow">
        <div class="level-label"><span>{{ levelRange[0] }}</span><span v-if="levelRange[0] !== levelRange[1]"> - {{ levelRange[1] }}</span></div>
        <div class="level-input slider-wrapper flexrow">
          <Slider v-model="levelRange" :min="0" :max="15" :tooltips="false"/>
        </div>
      </div>
    </div>

    <!-- Name filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.name">{{ localize('ARCHMAGE.name') }}</label>
      <input type="text" name="compendiumBrowser.name" v-model="name" placeholder="Hydra"/>
    </div>

    <!-- Type filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.type">{{ localize('ARCHMAGE.type') }}</label>
      <Multiselect
        v-model="type"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureTypes"
      />
    </div>

    <!-- Strength filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.strength">{{ localize('ARCHMAGE.strength') }}</label>
      <Multiselect
        v-model="strength"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureStrengths"
      />
    </div>

    <!-- Role filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.role">{{ localize('ARCHMAGE.role') }}</label>
      <Multiselect
        v-model="role"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureRoles"
      />
    </div>

    <!-- Size filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.size">{{ localize('ARCHMAGE.size') }}</label>
      <Multiselect
        v-model="size"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureSizes"
      />
    </div>

    <!-- Source filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.source">{{ localize('ARCHMAGE.source') }}</label>
      <Multiselect
        v-model="source"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="sources"
      />
    </div>

    <!-- Location filter. -->
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.location">{{ localize('ARCHMAGE.location') }}</label>
      <Multiselect
        v-model="location"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="locationNames"
      />
    </div>

    <!-- Reset. -->
    <div class="unit unit--input flexrow">
      <button type="reset" @click="resetFilters()">{{ localize('Reset') }}</button>
    </div>

  </section>

  <div class="section section--no-overflow">
    <!-- Creatures results. -->
    <section class="section section--creatures section--main flexcol">
      <ul v-if="loaded" class="compendium-browser-results compendium-browser-creatures">
        <!-- Individual creature entries. -->
        <li v-for="(entry, entryKey) in entries" :key="entryKey" :class="`creature-summary compendium-browser-row${entryKey >= pager.lastIndex - 1 && entryKey < pager.totalRows - 1 ? ' compendium-browser-row-observe': ''} flexrow document actor`" :data-document-id="entry._id" @click="openDocument(entry.uuid)">
          <!-- Both the image and title have drag events. These are primarily separated so that -->
          <!-- if a user drags the token, it will only show the token as their drag preview. -->
          <img :src="entry.img" @dragstart="startDrag($event, entry, 'Actor')" draggable="true"/>
          <div class="flexcol creature-contents" @dragstart="startDrag($event, entry, 'Actor')" draggable="true">
            <!-- First row is the title. -->
            <div class="creature-title-wrapper">
              <strong class="creature-title"><span v-if="entry.system?.attributes?.level?.value">[{{ entry.system.attributes.level.value }}]</span> {{ entry?.name }}</strong>
            </div>
            <!-- Second row is supplemental info. -->
            <div class="grid creature-grid">
              <div class="creature-defenses" :data-tooltip="localize('ARCHMAGE.defenses')">
                <span><strong>{{ localize('ARCHMAGE.CHAT.HP') }}:</strong> {{ entry.system.attributes.hp.max }}</span>
                <span><strong>{{ localize('ARCHMAGE.ac.key') }}:</strong> {{ entry.system.attributes.ac.value }}</span>
                <span><strong>{{ localize('ARCHMAGE.pd.key') }}:</strong> {{ entry.system.attributes.pd.value }}</span>
                <span><strong>{{ localize('ARCHMAGE.md.key') }}:</strong> {{ entry.system.attributes.md.value }}</span>
              </div>
              <div class="creature-type" :data-tooltip="localize('ARCHMAGE.type')">{{ creatureType(entry) }}</div>
              <div class="creature-strength" :data-tooltip="localize('ARCHMAGE.strength')">{{ CONFIG.ARCHMAGE.creatureStrengths[entry?.system?.details?.strength?.value] }}</div>
              <div class="creature-role" :data-tooltip="localize('ARCHMAGE.role')">{{ creatureRole(entry) }}</div>
              <div class="creature-size" :data-tooltip="localize('ARCHMAGE.size')">{{ CONFIG.ARCHMAGE.creatureSizes[entry?.system?.details?.size?.value] }}</div>
              <div v-if="entry?.system?.publicationSource" class="creature-source" :data-tooltip="sourceTooltip(entry?.system?.publicationSource)">{{ entry?.system?.publicationSource }}</div>
            </div>
          </div>
        </li>
      </ul>
      <div v-else class="compendium-browser-loading"><p><i class="fas fa-circle-notch fa-spin"></i>Please wait, loading...</p></div>
    </section>
  </div>
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
  getActorModuleArt,
  openDocument,
  startDrag,
  localize
} from '@/methods/Helpers.js';

export default {
  name: 'CompendiumBrowserPowers',
  props: ['tab'],
  // Imported components that need to be available in the <template>
  components: {
    Slider,
    Multiselect,
  },
  setup() {
    return {
      // Imported methods that need to be available in the <template>
      getActorModuleArt,
      openDocument,
      startDrag,
      localize,
      // Foundry base props and methods.
      CONFIG,
      game,
    }
  },
  data() {
    return {
      // Props used for infinite scroll and pagination.
      observer: null,
      loaded: false,
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
        { value: 'type', label: game.i18n.localize('ARCHMAGE.type') },
        { value: 'role', label: game.i18n.localize('ARCHMAGE.role') },
        { value: 'size', label: game.i18n.localize('ARCHMAGE.size') },
        { value: 'strength', label: game.i18n.localize('ARCHMAGE.strength') },
      ],
      // Our list of pseudo documents returned from the compendium.
      packIndex: [],
      // Filters.
      name: '',
      levelRange: [0, 15],
      type: [],
      role: [],
      size: [],
      strength: [],
      source: [],
      location: [],
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
      this.sortBy = 'level';
      this.name = '';
      this.levelRange = [0, 15];
      this.type = [];
      this.role = [];
      this.size = [];
      this.strength = [];
    },
    /**
     * Tooltip for a publication source, which may be translated
     */
    sourceTooltip(source) {
      let localized = game.i18n.localize(`ARCHMAGE.COMPENDIUMBROWSER.sources.${source}`);
      if (localized.startsWith('ARCHMAGE')) { localized = source }
      return game.i18n.format('ARCHMAGE.COMPENDIUMBROWSER.sources.tooltipTemplate', {source: localized});
    },
    creatureRole(entry) {
      const {role, roleB} = entry?.system?.details || {};
      if (roleB?.value) {
        return `${CONFIG.ARCHMAGE.creatureRoles[role?.value]}/${CONFIG.ARCHMAGE.creatureRoles[roleB.value]}`;
      }
      return CONFIG.ARCHMAGE.creatureRoles[role?.value];
    },
    creatureType(entry) {
      const {type, typeB} = entry?.system?.details || {};
      if (typeB?.value) {
        return `${CONFIG.ARCHMAGE.creatureTypes[type?.value]}/${CONFIG.ARCHMAGE.creatureTypes[typeB.value]}`;
      }
      return CONFIG.ARCHMAGE.creatureTypes[type?.value];
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

      // Filter by level range.
      if (this.levelRange.length == 2) {
        result = result.filter(entry =>
          entry.system.attributes.level.value >= this.levelRange[0] &&
          entry.system.attributes.level.value <= this.levelRange[1]
        );
      }

      // Handle multiselect filters, which use arrays as their values.
      if (Array.isArray(this.type) && this.type.length > 0) {
        result = result.filter(entry =>
          this.type.includes(entry.system.details?.type?.value) ||
          this.type.includes(entry.system.details?.typeB?.value)
        );
      }
      if (Array.isArray(this.strength) && this.strength.length > 0) {
        result = result.filter(entry => this.strength.includes(entry.system.details?.strength?.value));
      }
      if (Array.isArray(this.role) && this.role.length > 0) {
        result = result.filter(entry =>
          this.role.includes(entry.system.details?.role?.value) ||
          this.role.includes(entry.system.details?.roleB?.value)
        );
      }
      if (Array.isArray(this.size) && this.size.length > 0) {
        result = result.filter(entry => this.size.includes(entry.system.details.size.value));
      }
      if (Array.isArray(this.source) && this.source.length > 0) {
        result = result.filter(entry => this.source.includes(entry.system.publicationSource));
      }
      if (Array.isArray(this.location) && this.location.length > 0) {
        result = result.filter(entry => this.location.includes(entry.compendiumTitle));
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
          case 'type':
            return a.system.details?.type?.value.localeCompare(b.system.details?.type?.value);
          case 'role':
            return a.system.details?.role?.value.localeCompare(b.system.details?.role?.value);
          case 'size':
            return a.system.details?.size?.value.localeCompare(b.system.details?.size?.value);
          case 'strength':
            return a.system.details?.strength?.value.localeCompare(b.system.details?.strength?.value);
        }
        return a.system.attributes.level.value - b.system.attributes.level.value;
      });

      // Return results.
      return this.pager.totalRows > 0
        ? result.slice(this.pager.firstIndex, this.pager.lastIndex)
        : result;
    },
    sources() {
      // List of publication sources from the selected entries
      const sources = new Set();
      for (const entry of this.packIndex) {
        if (entry.system.publicationSource) {
          sources.add(entry.system.publicationSource);
        }
      }
      return Array.from(sources).sort();
    },
    locationNames() {
      // List of locations from the selected entries
      const locations = new Set(this.packIndex.map(entry => entry.compendiumTitle));
      return Array.from(locations).sort();
    }
  },
  watch: {},
  // Handle created hook.
  async created() {
    console.log("Creating compendium browser creatures tab...");

    let packIds = game.packs.contents
      .filter(pack => pack.documentName === 'Actor')
      .map(pack => pack.collection);

    // If the 2e gamma module is active, remove the animal-companion pack that it replaces.
    if (game.modules.get('13th-age-core-2e-gamma')?.active) {
      const index = packIds.indexOf('archmage.animal-companions');
      if (index > -1) {
        packIds.splice(index, 1);
      }
    }

    // Load the pack index with the fields we need.
    getPackIndex(packIds, [
      'system.publicationSource',
      'system.attributes.level',
      'system.attributes.hp.max',
      'system.attributes.ac.value',
      'system.attributes.pd.value',
      'system.attributes.md.value',
      'system.details.role.value',
      'system.details.roleB.value',
      'system.details.size.value',
      'system.details.strength.value',
      'system.details.type.value',
      'system.details.typeB.value',
    ]).then(packIndex => {
      // Ensure all entries are "monster" type
      packIndex = packIndex.filter(entry => {
        return entry.type === 'npc';
      });

      // Restore the pack art.
      if (game.archmage.system?.moduleArt?.map?.size > 0) {
        for (let record of packIndex) {
          record.img = getActorModuleArt(record);
        }
      }
      this.packIndex = packIndex;
      this.loaded = true;
    });

    // Create our intersection observer for infinite scroll.
    this.observer = new IntersectionObserver(this.infiniteScroll, {
      root: this.$el,
      threshold: 0.1,
    });
  },
  // Handle mounted hook.
  async mounted() {
    console.log("Compendium browser creatures tab mounted.");

    // Note that our tab has beened opened so that it won't de-render later.
    this.tab.opened = true;

    // Adjust our observers whenever the results of the compendium browser
    // are updated.
    onUpdated(() => {
      const target = document.querySelector('.compendium-browser-creatures .compendium-browser-row-observe');
      if (target) {
        this.observer.observe(target);
      }
    });
  },
  // Handle the unmount hook.
  async beforeUnmount() {
    // Disconnect intersection observers when we unmount.
    this.observer.disconnect();
  }
}
</script>

<style lang="scss">
  // Import our component styles.
  @import "@vueform/slider/themes/default.css";
  @import "@vueform/multiselect/themes/default.css";
</style>
