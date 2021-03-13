<template>
  <section :class="classes" data-tab="effects">
    <h2>Effects</h2>
  </section>
</template>

<script>
export default {
  props: ['actor', 'active'],
  data: () => ({}),
  computed: {
    classes() {
      return `section section--effects flexcol${this.active ? ' active' : ''}`;
    }
  },
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>