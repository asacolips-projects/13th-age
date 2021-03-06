<template>
<div>

  <!-- HEADER -->
  <header class="character-header flexrow">
    <!-- Name -->
    <div class="unit unit--abs-label unit--name">
      <label for="name">{{localize("Name")}}</label>
      <input type="text" name="name" class="input-secondary" v-model="actor.name" >
    </div>
    <!-- Race -->
    <div class="unit unit--abs-label unit--race">
      <label for="data.details.race.value">{{localize("Race")}}</label>
      <input type="text" name="data.details.race.value" class="input-secondary" v-model="race">
    </div>
    <!-- Class -->
    <div class="unit unit--abs-label unit--class">
      <label for="data.details.class.value">{{localize("Class")}}</label>
      <input type="text" name="data.details.class.value" class="input-secondary" v-model="actorClass">
    </div>
    <!-- Level -->
    <div class="unit unit--level flexrow">
      <label for="data.attributes.level.value">{{localize("Level")}}</label>
      <vue-numeric-input name="data.attributes.level.value" v-model="level" controls-type="updown"></vue-numeric-input>
    </div>
  </header>

  <!-- Attributes section -->
  <section class="section section--attributes flexrow">

  </section>

  <!-- Left sidebar -->
  <section class="section section--sidebar flexcol">

  </section>

  <!-- Main content -->
  <section class="section section--main flexcol">

    <!-- Class resources -->
    <section class="section section--resources flexrow">

    </section>

    <!-- Tabs -->
    <nav class="section section--tabs flexrow">

    </nav>

    <!-- Tabs content -->
    <section class="section section--tabs-content flexcol">

      <!-- Details tab -->
      <section class="section section--details flexcol">

      </section>

      <!-- Powers tab -->
      <section class="section section--powers flexcol">

      </section>

      <!-- Inventory tab -->
      <section class="section section--inventory flexcol">

      </section>

      <!-- Effects tab -->
      <section class="section section--effects flexcol">

      </section>

    </section>
  </section>

</div>
</template>


<script>
export default {
  props: [ "actor" ],
  data: () => ({
    race: "",
    actorClass: "",
    level: 1
  }),
  methods: {
    getSafeValue(property, defaultValue) {
      if (property) return property.value;
      return defaultValue;
    },
    localize(key) {
      return game.i18n.localize(key);
    }
  },
  computed: {
  },
  watch: {
  },
  async created() {
    console.log("Creating Sheet");
  },
  async mounted() {
    console.log("Sheet Mounted");
    console.log(this.actor);

    this.race = this.getSafeValue(this.actor.data.details.race, "");
    this.actorClass = this.getSafeValue(this.actor.data.details.class, "");
    this.level = this.getSafeValue(this.actor.data.attributes.level, 1);
  },
};
</script>
