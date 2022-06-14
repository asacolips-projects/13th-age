<template>
  <div :class="concat('archmage-v2-vue flexcol ', nightmode)">

    <!-- Top group -->
    <section class="container container--top flexcol">
      <!-- Header -->
      <CharHeader :actor="actor"></CharHeader>
      <!-- Attributes section -->
      <CharAttributes :actor="actor"></CharAttributes>
    </section>
    <!-- /Top group -->

    <!-- Bottom group -->
    <section class="container container--bottom flexrow">

      <!-- Left sidebar -->
      <section class="section section--sidebar flexcol">
        <CharInitiative :actor="actor"></CharInitiative>
        <CharAbilities :actor="actor"></CharAbilities>
        <CharBackgrounds :actor="actor"></CharBackgrounds>
        <CharIconRelationships :actor="actor"></CharIconRelationships>
        <!-- <archmage-actor-c-out :actor="actor" :owner="owner"></archmage-actor-c-out> -->
        <!-- <archmage-actor-c-incrementals :actor="actor"></archmage-actor-c-incrementals> -->
      </section>
      <!-- /Left sidebar -->

      <!-- Main content -->
      <section class="section section--main flexcol">

        <!-- Class resources -->
        <!-- <archmage-actor-c-resources :actor="actor"></archmage-actor-c-resources> -->
        <!-- Tabs -->
        <!-- <archmage-actor-c-tabs :actor="actor" group="primary" :tabs="tabs.primary" :flags="flags"></archmage-actor-c-tabs> -->

        <!-- Tabs content -->
        <section class="section section--tabs-content flexcol">
          <!-- Details tab -->
          <!-- <archmage-actor-c-details :actor="actor" :owner="owner" :tab="tabs.primary.details" :flags="flags"></archmage-actor-c-details> -->
          <!-- Powers tab -->
          <!-- <archmage-actor-c-powers :actor="actor" :tab="tabs.primary.powers" :flags="flags"></archmage-actor-c-powers> -->
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

import { concat } from './methods/Helpers';
import {
  // Top
  CharHeader, CharAttributes,
  // Sidebar
  CharInitiative, CharAbilities, CharBackgrounds, CharIconRelationships
  // Main
  // CharDetails, CharEffects, CharInventory, CharPowers, CharResources, CharSettings, CharTabs
} from './components/actor/character/index.js';

export default {
  name: 'ArchmageCharacterSheet',
  props: ['context', 'actor', 'owner'],
  components: {
    CharHeader,
    CharAttributes,
    CharInitiative,
    CharAbilities,
    CharBackgrounds,
    CharIconRelationships
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
          details: {active: false},
          powers: {active: true},
          inventory: {active: false},
          effects: {active: false},
          settings: {active: false, icon: 'fa-cogs', hideLabel: true}
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
