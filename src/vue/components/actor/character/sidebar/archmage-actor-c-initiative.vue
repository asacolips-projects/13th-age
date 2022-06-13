<template>
  <section class="section section--initiative flexcol">
    <a class="rollable rollable--init" data-roll-type="init">{{numberFormat(actor.data.attributes.init.mod, 0, true)}} {{localize('ARCHMAGE.initiative')}}</a>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data() {
    return {}
  },
  computed: {},
  methods: {},
  watch: {},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>