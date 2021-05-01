<template>
  <section class="equipment">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="equipment-details flexcol">
      <div class="equipment-detail">
        <span class="equipment-detail-value" v-html="equipment.data.data.description.value"></span>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: ['equipment'],
  data: () => ({}),
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
  },
  methods: {},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>