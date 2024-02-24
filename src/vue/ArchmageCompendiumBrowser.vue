<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <section class="container container--top">
      <Tabs group="primary" :tabs="tabs.primary" :flags="flags"/>
    </section>

    <!-- @todo this class is duplicated in the tabs, figure out a better layout fix. -->
    <section class="container container--bottom">

      <Tab group="primary" :tab="tabs.primary.creatures" classes="container container--bottom flexrow">
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

        <section class="section section--main flexcol">
          <ul class="compendium-browser-results">
            <li v-for="(entry, entryKey) in entries" :key="entryKey" class="compendium-browser-row flexrow document actor" :data-document-id="entry._id" @click="openDocument(entry._id)">
              <img :src="entry.img" @dragstart="startDrag($event, entry)" draggable="true"/>
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
      </Tab>

      <Tab group="primary" :tab="tabs.primary.powers" classes="container container--bottom flexrow">
        <h2>Powers Tab</h2>
      </Tab>

      <Tab group="primary" :tab="tabs.primary.items" classes="container container--bottom flexrow">
        <h2>Magic Items Tab</h2>
      </Tab>

    </section>
  </div>
</template>

<script>
import Slider from '@vueform/slider';
import Multiselect from '@vueform/multiselect';
import Tabs from '@/components/parts/Tabs.vue';
import Tab from '@/components/parts/Tab.vue';

export default {
  name: 'ArchmageCompendiumBrowser',
  props: [`context`],
  components: {
    Slider,
    Multiselect,
    Tabs,
    Tab
  },
  setup() {
    return {
      CONFIG,
      game
    }
  },
  data() {
    return {
      name: '',
      levelRange: [1, 15],
      type: [],
      role: [],
      size: [],
      tabs: {
        primary: {
          creatures: {
            key: 'creatures',
            label: 'Creatures',
            active: true
          },
          powers: {
            key: 'powers',
            label: 'Powers & Spells',
            active: false
          },
          items: {
            key: 'items',
            label: 'Magic Items',
            active: false
          }
        }
      }
    }
  },
  methods: {
    openDocument(id) {
      let pack = game.packs.get('archmage.srd-Monsters');
      pack.getDocument(id).then(document => {
        document.sheet.render(true);
        console.log(document);
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
      let result = this.context.srdMonsters.contents;

      if (this.name && this.name.length > 0) {
        console.log('Name filter');
        const name = this.name.toLocaleLowerCase();
        result = result.filter(entry => entry.name.toLocaleLowerCase().includes(name));
      }

      if (this.levelRange.length == 2) {
        console.log('Level filter');
        result = result.filter(entry =>
          entry.system.attributes.level.value >= this.levelRange[0] &&
          entry.system.attributes.level.value <= this.levelRange[1]
        );
      }

      if (Array.isArray(this.type) && this.type.length > 0) {
        console.log('Type filter');
        result = result.filter(entry => this.type.includes(entry.system.details.type.value));
      }

      if (Array.isArray(this.role) && this.role.length > 0) {
        console.log('Role filter');
        result = result.filter(entry => this.role.includes(entry.system.details.role.value));
      }

      if (Array.isArray(this.size) && this.size.length > 0) {
        console.log('Size filter');
        result = result.filter(entry => this.size.includes(entry.system.details.size.value));
      }

      return result.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      // @todo do we need to make a pager for performance?
      // }).slice(0, 25);
    },
    flags() {
      let flags = {};
      let baseFlags = {
        'sheetDisplay': {
          'tabs': {
            'primary': {'value': 'creatures'}
          },
        }
      }
      return foundry.utils.mergeObject(baseFlags, flags);
    }
  },
  watch: {},
  async created() {
    console.log("Creating compendium browser...");
  },
  async mounted() {
    console.log("Compendium browser mounted.");
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