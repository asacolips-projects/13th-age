<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <section class="container container--top">
      <Tabs group="primary" :tabs="tabs.primary" :flags="flags"/>
    </section>

    <!-- @todo this class is duplicated in the tabs, figure out a better layout fix. -->
    <section class="container container--bottom">

      <Tab group="primary" :tab="tabs.primary.creatures" classes="container container--bottom flexrow">
        <CompendiumBrowserCreatures />
      </Tab>

      <Tab group="primary" :tab="tabs.primary.powers" classes="container container--bottom flexrow">
        <CompendiumBrowserPowers />
      </Tab>

      <Tab group="primary" :tab="tabs.primary.items" classes="container container--bottom flexrow">
        <CompendiumBrowserItems />
      </Tab>

    </section>
  </div>
</template>

<script>
import Tabs from '@/components/parts/Tabs.vue';
import Tab from '@/components/parts/Tab.vue';
import CompendiumBrowserPowers from '@/components/dialogs/compendium-browser/CompendiumBrowserPowers.vue';
import CompendiumBrowserCreatures from '@/components/dialogs/compendium-browser/CompendiumBrowserCreatures.vue';
import CompendiumBrowserItems from '@/components/dialogs/compendium-browser/CompendiumBrowserItems.vue';

export default {
  name: 'ArchmageCompendiumBrowser',
  props: [`context`],
  components: {
    Tabs,
    Tab,
    CompendiumBrowserPowers,
    CompendiumBrowserCreatures,
    CompendiumBrowserItems
  },
  setup() {
    return {
      CONFIG,
      game
    }
  },
  data() {
    return {
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