<template>
<div class="archmage-v2-vue flexcol">

  <!-- Top group -->
  <section class="container container--top flexcol">
    <!-- Header -->
    <archmage-actor-c-header :actor="actor"></archmage-actor-c-header>
    <!-- Attributes section -->
    <archmage-actor-c-attributes :actor="actor"></archmage-actor-c-attributes>
  </section>
  <!-- /Top group -->

  <!-- Bottom group -->
  <section class="container container--bottom flexrow">

    <!-- Left sidebar -->
    <section class="section section--sidebar flexcol">
      <archmage-actor-c-abilities :actor="actor"></archmage-actor-c-abilities>
      <archmage-actor-c-backgrounds :actor="actor"></archmage-actor-c-backgrounds>
      <archmage-actor-c-icon-relationships :actor="actor"></archmage-actor-c-icon-relationships>
      <archmage-actor-c-out :actor="actor" :owner="owner"></archmage-actor-c-out>
      <archmage-actor-c-incrementals :actor="actor"></archmage-actor-c-incrementals>
    </section>
    <!-- /Left sidebar -->

    <!-- Main content -->
    <section class="section section--main flexcol">

      <!-- Class resources -->
      <archmage-actor-c-resources :actor="actor"></archmage-actor-c-resources>
      <!-- Tabs -->
      <archmage-actor-c-tabs :actor="actor" group="primary" :tabs="tabs.primary"></archmage-actor-c-tabs>

      <!-- Tabs content -->
      <section class="section section--tabs-content flexcol">
        <!-- Details tab -->
        <archmage-actor-c-details :actor="actor" :owner="owner" :tab="tabs.primary.details"></archmage-actor-c-details>
        <!-- Powers tab -->
        <archmage-actor-c-powers :actor="actor" :tab="tabs.primary.powers"></archmage-actor-c-powers>
        <!-- Inventory tab -->
        <archmage-actor-c-inventory :actor="actor" :tab="tabs.primary.inventory"></archmage-actor-c-inventory>
        <!-- Effects tab -->
        <!-- <archmage-actor-c-effects :actor="actor" :tab="tabs.primary.effects"></archmage-actor-c-effects> -->
        <!-- Settings tab -->
        <archmage-actor-c-settings :actor="actor" :tab="tabs.primary.settings"></archmage-actor-c-settings>
      </section>
      <!-- /Tabs content -->

    </section>
    <!-- /Main content -->

  </section>
  <!-- /Bottom group -->

</div>
</template>


<script>
export default {
  props: ['actor', 'owner'],
  data: function () {
    return {
      actorData: {},
      tabs: {
        primary: {
          details: {active: false},
          powers: {active: false},
          inventory: {active: false},
          // effects: {active: false},
          settings: {icon: 'fa-cogs', hideLabel: true, active: true}
        }
      }
    }
  },
  methods: {},
  computed: {},
  watch: {
    // actor: {
    //   deep: true,
    //   handler() {
    //     console.log('Vue Sheet Updated')
    //     // This method abstracts the prepare data call that the actor class
    //     // itself would normally call.
    //     game.archmage.ActorHelpersV2.prepareData(this.actor);
    //   }
    // }
  },
  async created() {
    console.log("Creating Sheet");
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    console.log("Sheet Mounted");
  },
};
</script>
