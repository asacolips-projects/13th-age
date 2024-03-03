<template>
  <section class="section section--sidebar flexcol filters">
    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.name">Name</label>
      <input type="text" id="compendiumBrowser.name" name="compendiumBrowser.name" v-model="name"/>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.level">Level</label>
      <div class="level-range flexrow">
        <div class="level-label"><span>{{ levelRange[0] }}</span><span v-if="levelRange[0] !== levelRange[1]"> - {{ levelRange[1] }}</span></div>
        <div class="level-input slider-wrapper flexrow">
          <Slider v-model="levelRange" :min="1" :max="15" :tooltips="false"/>
        </div>
      </div>
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.type">Type</label>
      <Multiselect
        v-model="type"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureTypes"
      />
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.role">Role</label>
      <Multiselect
        v-model="role"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureRoles"
      />
    </div>

    <div class="unit unit--input">
      <label class="unit-title" for="compendiumBrowser.size">Size</label>
      <Multiselect
        v-model="size"
        mode="tags"
        :searchable="false"
        :create-option="false"
        :options="CONFIG.ARCHMAGE.creatureSizes"
      />
    </div>
  </section>

  <div class="section section--no-overflow">
    <section class="section section--creatures section--main flexcol">
      <ul class="compendium-browser-results compendium-browser-creatures">
        <li v-for="(entry, entryKey) in entries" :key="entryKey" :class="`creature-summary compendium-browser-row${entryKey >= pager.lastIndex - 1 && entryKey < pager.totalRows - 1 ? ' compendium-browser-row-observe': ''} flexrow document actor`" :data-document-id="entry._id" @click="openDocument(entry.uuid)">
          <img :src="getActorModuleArt(entry)" @dragstart="startDrag($event, entry)" draggable="true"/>
          <div class="flexcol creature-contents" @dragstart="startDrag($event, entry)" draggable="true">
            <div class="creature-title-wrapper">
              <strong class="creature-title"><span v-if="entry.system?.attributes?.level?.value">[{{ entry.system.attributes.level.value }}]</span> {{ entry?.name }}</strong>
            </div>
            <div class="grid creature-grid">
              <div class="creature-defenses" data-tooltip="Defenses">
                <span><strong>HP:</strong> {{ entry.system.attributes.hp.max }}</span>
                <span><strong>AC:</strong> {{ entry.system.attributes.ac.value }}</span>
                <span><strong>PD:</strong> {{ entry.system.attributes.pd.value }}</span>
                <span><strong>MD:</strong> {{ entry.system.attributes.md.value }}</span>
              </div>
              <div class="creature-type" data-tooltip="Type">{{ CONFIG.ARCHMAGE.creatureTypes[entry?.system?.details?.type?.value] }}</div>
              <div class="creature-role" data-tooltip="Role">{{ CONFIG.ARCHMAGE.creatureRoles[entry?.system?.details?.role?.value] }}</div>
              <div class="creature-size" data-tooltip="Size">{{ CONFIG.ARCHMAGE.creatureSizes[entry?.system?.details?.size?.value] }}</div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
import { getPackIndex, getActorModuleArt } from '@/methods/Helpers.js';
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
      getActorModuleArt
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
      packIndex: [],
      name: '',
      levelRange: [1, 15],
      type: [],
      role: [],
      size: [],
      observer: null,
    }
  },
  methods: {
    openDocument(uuid) {
      getDocumentClass('Actor').fromDropData({
        type: 'Actor',
        uuid: uuid
      }).then(document => {
        document.sheet.render(true);
      });
    },
    startDrag(event, entry) {
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'Actor',
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
          entry.system.attributes.level.value >= this.levelRange[0] &&
          entry.system.attributes.level.value <= this.levelRange[1]
        );
      }

      if (Array.isArray(this.type) && this.type.length > 0) {
        result = result.filter(entry => this.type.includes(entry.system.details.type.value));
      }

      if (Array.isArray(this.role) && this.role.length > 0) {
        result = result.filter(entry => this.role.includes(entry.system.details.role.value));
      }

      if (Array.isArray(this.size) && this.size.length > 0) {
        result = result.filter(entry => this.size.includes(entry.system.details.size.value));
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
      })

      // Return results.
      return this.pager.totalRows > 0
        ? result.slice(this.pager.firstIndex, this.pager.lastIndex)
        : result;
    },
  },
  watch: {},
  async created() {
    console.log("Creating compendium browser creatures tab...");
    getPackIndex([
      'archmage.srd-Monsters',
      'archmage.animal-companions',
      'archmage.necromancer-summons',
    ], [
      'system.attributes.level',
      'system.attributes.hp.max',
      'system.attributes.ac.value',
      'system.attributes.pd.value',
      'system.attributes.md.value',
      'system.details.role.value',
      'system.details.size.value',
      'system.details.type.value'
    ]).then(packIndex => this.packIndex = packIndex);

    this.observer = new IntersectionObserver(this.infiniteScroll, {
      root: this.$el,
      threshold: 0.5,
    });
  },
  async mounted() {
    console.log("Compendium browser creatures tab mounted.");
    this.tab.opened = true;

    onUpdated(() => {
      console.log("Compendium browser creatures tab updated.");
      const target = document.querySelector('.compendium-browser-creatures .compendium-browser-row-observe');
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