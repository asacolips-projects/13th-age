<template>
  <div :class="concat('archmage-v2-vue flexcol ', nightmode)">

    <!-- Top group -->
    <section class="container container--top flexcol">
      <!-- Header -->
      <NpcHeader :actor="actor"/>
      <!-- Attributes section -->
      <NpcAttributes :actor="actor"/>
      <!-- Tabs -->
      <Tabs :actor="actor" group="primary" :tabs="tabs.primary" :flags="flags"/>
      <!-- <CharAttributes :actor="actor"/> -->
    </section>
    <!-- /Top group -->

    <!-- Bottom group -->
    <section class="container container--bottom flexcol">

      <!-- Main content -->
      <section class="section section--main flexcol">

        <!-- Class resources -->
        <!-- <CharResources :actor="actor"/> -->

        <!-- Tabs content -->
        <section class="section section--tabs-content flexcol">
          <!-- Details tab -->
          <Tab group="primary" :tab="tabs.primary.details" classes="flexcol">
            <CharDetails :actor="actor" :owner="owner" :tab="tabs.primary.details" :flags="flags"/>
          </Tab>
          <!-- Actions tab -->
          <Tab group="primary" :tab="tabs.primary.actions">
            <NpcActions :actor="actor" :tab="tabs.primary.actions" :flags="flags"/>
          </Tab>
          <!-- Effects tab -->
          <Tab group="primary" :tab="tabs.primary.effects">
            <CharEffects :actor="actor" :tab="tabs.primary.effects" :flags="flags"/>
          </Tab>
          <!-- Settings tab -->
          <!-- <Tab group="primary" :tab="tabs.primary.settings">
            <CharSettings :actor="actor" :tab="tabs.primary.settings"/>
          </Tab> -->
        </section>
        <!-- /Tabs content -->

      </section>
      <!-- /Main content -->

      <!-- Bottom content -->
      <!-- <section class="section section--bottom flexcol"> -->
        <!-- Attributes section -->
        <!-- <NpcAttributes :actor="actor"/> -->
        <!-- <CharInitiative :actor="actor"/> -->
        <!-- <CharAbilities :actor="actor"/> -->
        <!-- <CharBackgrounds :actor="actor"/> -->
        <!-- <CharIconRelationships :actor="actor"/> -->
        <!-- <CharOut :actor="actor" :owner="owner"/> -->
        <!-- <CharIncrementals :actor="actor"/> -->
      <!-- </section> -->
      <!-- /Bottom content -->

    </section>
    <!-- /Bottom group -->

  </div>
</template>


<script>

import { concat, localize } from '@/methods/Helpers';
import CharDetails from '@/components/actor/character/main/CharDetails.vue';
import CharEffects from '@/components/actor/character/main/CharEffects.vue';
import NpcHeader from '@/components/actor/npc/NpcHeader.vue';
import NpcActions from '@/components/actor/npc/NpcActions.vue';
import NpcAttributes from '@/components/actor/npc/NpcAttributes.vue';
import Tabs from '@/components/parts/Tabs.vue';
import Tab from '@/components/parts/Tab.vue';
// import {
//   Tabs,
//   Tab,
//   CharHeader,
//   CharAttributes,
//   CharInitiative,
//   CharAbilities,
//   CharBackgrounds,
//   CharIconRelationships,
//   CharOut,
//   CharIncrementals,
//   CharResources,
//   // CharDetails,
//   CharPowers,
//   CharInventory,
//   CharEffects,
//   CharSettings
// } from '@/components';

export default {
  name: 'ArchmageNpcSheet',
  props: ['context', 'actor', 'owner'],
  components: {
    NpcHeader,
    Tabs,
    Tab,
    NpcActions,
    NpcAttributes,
    // CharHeader,
    // CharAttributes,
    // CharInitiative,
    // CharAbilities,
    // CharBackgrounds,
    // CharIconRelationships,
    // CharOut,
    // CharIncrementals,
    // CharResources,
    CharDetails,
    // CharPowers,
    // CharInventory,
    CharEffects,
    // CharSettings,
  },
  setup() {
    return {
      concat
    }
  },
  data() {
    return {
      actorData: {},
      tabs: {
        primary: {
          details: {
            key: 'details',
            label: localize('ARCHMAGE.details'),
            active: false
          },
          actions: {
            key: 'actions',
            label: localize('ARCHMAGE.actions'),
            active: true
          },
          effects: {
            key: 'effects',
            label: localize('ARCHMAGE.effects'),
            active: false
          },
          settings: {
            key: 'settings',
            label: localize('ARCHMAGE.settings'),
            active: false,
            icon: 'fa-cogs',
            hideLabel: true
          }
        }
      }
    }
  },
  methods: {},
  computed: {
    nightmode() {
      let flags = this.actor.flags ? this.actor.flags.archmage : null;
      return flags && flags.nightmode ? 'nightmode' : '';
    },
    flags() {
      let flags = this.actor.flags ? this.actor.flags.archmage : {};
      let baseFlags = {
        'sheetDisplay': {
          'powers': {
            'groupBy': {'value': 'powerType'},
            'sortBy': {'value': 'custom'}
          },
          'inventory': {
            'sortBy': {'value': 'custom'}
          },
          'tabs': {
            'primary': {'value': 'powers'}
          },
        }
      }
      return mergeObject(baseFlags, flags);
    }
  },
  watch: {},
  async created() {
    console.log("Creating Sheet");
  },
  async mounted() {
    console.log("Sheet Mounted");
  },
};
</script>

<style lang="scss" scoped>
.section--bottom {
  flex: 0 auto;
}
</style>

<style lang="scss">
.archmage-v2.npc-sheet {
  .section--tabs {
    nav.tabs {
      margin-top: 0;
    }
  }
}
</style>