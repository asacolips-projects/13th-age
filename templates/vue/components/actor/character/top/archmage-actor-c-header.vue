<template>
  <!-- HEADER -->
  <header class="header character-header flexrow">
    <!-- Name -->
    <div class="unit unit--abs-label unit--name">
      <label for="name">{{localize("Name")}}</label>
      <input type="text" name="name" class="input-secondary" v-model="actor.name">
    </div>
    <!-- Race -->
    <div class="unit unit--abs-label unit--race">
      <label for="data.details.race.value">{{localize("Race")}}</label>
      <input type="text" name="data.details.race.value" class="input-secondary" v-model="actor.data.details.race.value">
    </div>
    <!-- Class -->
    <div class="unit unit--abs-label unit--class">
      <label for="data.details.class.value">{{localize("Class")}}</label>
      <input type="text" name="data.details.class.value" class="input-secondary" v-model="actor.data.details.class.value">
    </div>
    <!-- Level -->
    <div class="unit unit--abs-label unit--level">
      <label for="data.attributes.level.value">{{localize("Level")}}</label>
      <input type="number" name="data.attributes.level.value" class="input-secondary" v-model="actor.data.attributes.level.value" min="0">
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
    this.level = this.actor.data.attributes.level;
  }
}
</script>