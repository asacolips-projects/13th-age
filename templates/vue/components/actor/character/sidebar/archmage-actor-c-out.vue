<template>
  <section class="section section--out flexcol">
    <h2 class="unit-title">{{localize('One Unique Thing')}}</h2>
    <div class="out">
      <archmage-h-editor :owner="owner" target='data.out.value' button="true" editable="true" :content="actor.data.out.value"/>
    </div>
  </section>
</template>

<script>
export default {
  props: ['actor', 'owner'],
  data: () => ({}),
  computed: {},
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
  }
}
</script>