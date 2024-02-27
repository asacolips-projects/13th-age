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
    <section class="section section--main flexcol">
      <ul class="compendium-browser-results">
        <li v-for="(entry, entryKey) in entries" :key="entryKey" class="compendium-browser-row flexrow document actor" :data-document-id="entry._id" @click="openDocument(entry.uuid)">
          <img :src="getActorModuleArt(entry)" @dragstart="startDrag($event, entry)" draggable="true"/>
          <div class="grid grid-4col" @dragstart="startDrag($event, entry)" draggable="true">
            <strong class="grid-span-4">{{ entry?.name }}</strong>
            <div>Level {{ entry?.system?.attributes?.level?.value }}</div>
            <div>{{ CONFIG.ARCHMAGE.creatureTypes[entry?.system?.details?.type?.value] }}</div>
            <div>{{ CONFIG.ARCHMAGE.creatureRoles[entry?.system?.details?.role?.value] }}</div>
            <div>{{ CONFIG.ARCHMAGE.creatureSizes[entry?.system?.details?.size?.value] }}</div>
          </div>
        </li>
      </ul>
    </section>
    <Pager v-if="pager.totalRows > 0" :pagerOptions="pager"/>
  </div>
</template>

<script>
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
import Pager from '@/components/parts/Pager.vue';
import { getPackIndex, getActorModuleArt } from '@/methods/Helpers.js';

export default {
  name: 'CompendiumBrowserPowers',
  props: [],
  components: {
    Slider,
    Multiselect,
    Pager
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
        lastIndex: 0,
        totalRows: 0,
        style: 'input'
      },
      packIndex: [],
      name: '',
      levelRange: [1, 15],
      type: [],
      role: [],
      size: [],
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
    }
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
      'system.details.role.value',
      'system.details.size.value',
      'system.details.type.value'
    ]).then(packIndex => this.packIndex = packIndex);
  },
  async mounted() {
    console.log("Compendium browser creatures tab mounted.");
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