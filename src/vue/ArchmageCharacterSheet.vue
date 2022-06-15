<template>
  <div :class="concat('archmage-v2-vue flexcol ', nightmode)">

    <!-- Top group -->
    <section class="container container--top flexcol">
      <!-- Header -->
      <CharHeader :actor="actor"/>
      <!-- Attributes section -->
      <CharAttributes :actor="actor"/>
    </section>
    <!-- /Top group -->

    <!-- Bottom group -->
    <section class="container container--bottom flexrow">

      <!-- Left sidebar -->
      <section class="section section--sidebar flexcol">
        <CharInitiative :actor="actor"/>
        <CharAbilities :actor="actor"/>
        <CharBackgrounds :actor="actor"/>
        <CharIconRelationships :actor="actor"/>
        <CharOut :actor="actor" :owner="owner"/>
        <CharIncrementals :actor="actor"/>
      </section>
      <!-- /Left sidebar -->

      <!-- Main content -->
      <section class="section section--main flexcol">

        <!-- Class resources -->
        <CharResources :actor="actor"/>
        <!-- Tabs -->
        <Tabs :actor="actor" group="primary" :tabs="tabs.primary" :flags="flags"/>

        <!-- Tabs content -->
        <section class="section section--tabs-content flexcol">
          <!-- Details tab -->
          <!-- <archmage-actor-c-details :actor="actor" :owner="owner" :tab="tabs.primary.details" :flags="flags"></archmage-actor-c-details> -->
          <!-- Powers tab -->
          <CharPowers :actor="actor" :tab="tabs.primary.powers" :flags="flags"/>
          <!-- Inventory tab -->
          <!-- <archmage-actor-c-inventory :actor="actor" :tab="tabs.primary.inventory" :flags="flags"></archmage-actor-c-inventory> -->
          <!-- Effects tab -->
          <!-- <archmage-actor-c-effects :actor="actor" :tab="tabs.primary.effects" :flags="flags"></archmage-actor-c-effects> -->
          <!-- Settings tab -->
          <!-- <archmage-actor-c-settings :actor="actor" :tab="tabs.primary.settings"></archmage-actor-c-settings> -->
        </section>
        <!-- /Tabs content -->

      </section>
      <!-- /Main content -->

    </section>
    <!-- /Bottom group -->

  </div>
</template>


<script>

import { concat, localize } from './methods/Helpers';
import { default as Tabs } from './components/parts/Tabs.vue';
import {
  // Top
  CharHeader, CharAttributes,
  // Sidebar
  CharInitiative, CharAbilities, CharBackgrounds, CharIconRelationships, CharOut, CharIncrementals,
  // Main
  CharResources, CharPowers
  // CharDetails, CharEffects, CharInventory, CharSettings, CharTabs
} from './components/actor/character/index.js';

export default {
  name: 'ArchmageCharacterSheet',
  props: ['context', 'actor', 'owner'],
  components: {
    Tabs,
    CharHeader,
    CharAttributes,
    CharInitiative,
    CharAbilities,
    CharBackgrounds,
    CharIconRelationships,
    CharOut,
    CharIncrementals,
    CharResources,
    CharPowers
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
            label: localize('ARCHMAGE.details'),
            active: false
          },
          powers: {
            label: localize('ARCHMAGE.powers'),
            active: true
          },
          inventory: {
            label: localize('ARCHMAGE.inventory'),
            active: false
          },
          effects: {
            label: localize('ARCHMAGE.effects'),
            active: false
          },
          settings: {
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
