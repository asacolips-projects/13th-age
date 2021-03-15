<template>
  <section :class="classes" data-tab="inventory">
    <h2>Inventory</h2>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab'],
  data: function() {
    return {
      equipment: [],
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        { value: 'chakra', label: 'Chakra' }
      ],
      sortBy: 'custom',
      searchValue: null,
      activePowers: {}
    }
  },
  computed: {
    classes() {
      return `section section--inventory flexcol${this.tab.active ? ' active' : ''}`;
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