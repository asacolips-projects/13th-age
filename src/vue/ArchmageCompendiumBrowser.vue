<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <section class="container container--top flexcol">
      <h1>Compendium Browser</h1>
    </section>
  </div>
</template>

<script>

export default {
  name: 'ArchmageCompendiumBrowser',
  props: [`context`],
  components: {},
  setup() {
    return {}
  },
  data() {
    return {}
  },
  methods: {},
  computed: {
    nightmode() {
      return game.settings.get("archmage", "nightmode") ? 'nightmode' : '';
    },
  },
  watch: {},
  async created() {
    console.log("Creating compendium browser...");
  },
  async mounted() {
    console.log("Compendium browser mounted.");
  }
}
</script>

<style lang="scss">
</style>