<template>
  <section :class="classes" data-tab="details">
    <archmage-h-editor :owner="owner" target='data.details.biography.value' button="true" editable="true" :content="actor.data.details.biography.value"></archmage-h-editor>
  </section>
</template>

<script>
export default {
  props: ['actor', 'owner', 'tab'],
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