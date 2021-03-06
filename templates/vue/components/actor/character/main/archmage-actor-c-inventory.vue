<template>
  <section class="section section--inventory flexcol">
    <h2>Inventory</h2>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: () => ({}),
  computed: {},
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>