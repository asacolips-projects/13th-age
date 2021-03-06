<template>
  <!-- HEADER -->
  <header class="header character-header flexrow">
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
</template>

<script>
export default {
  props: ['actor'],
  data: () => ({
    race: "",
    actorClass: "",
    level: 1
  }),
  computed: {},
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.race = this.getSafeValue(this.actor.data.details.race, "");
    this.actorClass = this.getSafeValue(this.actor.data.details.class, "");
    this.level = this.getSafeValue(this.actor.data.attributes.level, 1);
  }
}
</script>