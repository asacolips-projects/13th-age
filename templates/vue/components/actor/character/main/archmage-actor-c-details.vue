<template>
  <section :class="classes" data-tab="details">
    <div class="editor-content" v-html="actor.data.details.biography.value"></div>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab'],
  data: () => ({}),
  computed: {
    classes() {
      return `section section--details flexcol${this.tab.active ? ' active' : ''}`;
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