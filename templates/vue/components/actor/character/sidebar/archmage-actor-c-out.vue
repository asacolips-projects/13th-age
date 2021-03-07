<template>
  <section class="section section--out flexcol">
    <h2 class="unit-title">{{localize('Backgrounds')}}</h2>
    <div class="out">{{actor.data.out.value}}</div>
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