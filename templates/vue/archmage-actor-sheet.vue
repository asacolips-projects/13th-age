<template>
<div>

  <!-- HEADER -->
  <header class="sheet-header">
    <h1 class="charname">
      <input name="name" type="text" v-model="actor.name" placeholder="Character Name" />
    </h1>

    <div class="charlevel">
      <div class="level">
        <label>Level</label>
        <vue-numeric-input name="data.attributes.level.value" v-model="level" controls-type="updown"></vue-numeric-input>
      </div>
    </div>
  </header>

</div>
</template>


<script>
export default {
  props: [ "actor" ],
  data: () => ({
    level: 1
  }),
  methods: {
    getSafeValue(property, defaultValue) {
      if (property) return property.value;
      return defaultValue;
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

    this.level = this.getSafeValue(this.actor.data.attributes.level, 1);
  },
};
</script>
