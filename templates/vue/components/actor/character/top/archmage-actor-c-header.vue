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
      <label for="data.data.details.race.value">{{localize("ARCHMAGE.race")}}</label>
      <input type="text" name="data.details.race.value" class="input-secondary" v-model="actor.data.data.details.race.value">
    </div>
    <!-- Class -->
    <div class="unit unit--abs-label unit--class">
      <label for="data.data.details.class.value">{{localize("ARCHMAGE.class")}}</label>
      <input type="text" name="data.details.class.value" class="input-secondary" v-model="actor.data.data.details.class.value">
    </div>
    <!-- Level -->
    <div class="unit unit--abs-label unit--level">
      <label for="data.data.attributes.level.value">{{localize("ARCHMAGE.level")}}</label>
      <input type="number" name="data.attributes.level.value" class="input-secondary" v-model="actor.data.data.attributes.level.value" min="0">
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
    this.level = this.actor.data.data.attributes.level;
  }
}
</script>