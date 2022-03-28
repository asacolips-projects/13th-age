<template>
  <!-- HEADER -->
  <header class="header character-header grid grid-4col">
    <!-- Name -->
    <div class="unit unit--abs-label unit--name">
      <label for="name">{{localize("ARCHMAGE.name")}}</label>
      <input type="text" name="name" class="input-secondary" v-model="actor.name">
    </div>
    <!-- Race -->
    <div class="unit unit--abs-label unit--race">
      <label for="system.details.race.value">{{localize("ARCHMAGE.race")}}</label>
      <input type="text" name="system.details.race.value" class="input-secondary" v-model="actor.system.details.race.value">
    </div>
    <!-- Class -->
    <div class="unit unit--abs-label unit--class">
      <label for="system.details.class.value">{{localize("ARCHMAGE.class")}}</label>
      <input type="text" name="system.details.class.value" class="input-secondary" v-model="actor.system.details.class.value">
    </div>
    <!-- Level -->
    <div class="unit unit--abs-label unit--level">
      <label for="system.attributes.level.value">{{localize("ARCHMAGE.level")}}</label>
      <input type="number" name="system.attributes.level.value" class="input-secondary" v-model="actor.system.attributes.level.value" min="0">
    </div>
  </header>
</template>

<script>
export default {
  props: ['actor'],
  data: function() {
    return {
      level: {}
    }
  },
  computed: {},
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.level = this.actor.system.attributes.level;
  }
}
</script>