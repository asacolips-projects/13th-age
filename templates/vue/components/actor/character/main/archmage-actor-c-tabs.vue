<template>
  <section class="section section--tabs flexshrink">
    <nav :class="concat('sheet-tabs tabs tabs--', group)" :data-group="group">
      <a v-for="item in tabs" :key="concat('tab-', group, '-', item)" :data-tab="item">{{localize(concat('ARCHMAGE.', item))}}</a>
    </nav>
  </section>
</template>

<script>
export default {
  props: ['actor', 'group', 'tabs'],
  data: function () {
    return {
      group: 'primary',
      tabs: []
    }
  },
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