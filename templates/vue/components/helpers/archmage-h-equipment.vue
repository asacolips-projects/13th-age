<template>
  <section class="equipment">
    <!-- Bonuses -->
    <section class="equipment-bonuses flexcol">
      <div class="equipment-detail" v-for="(bonus, index) in bonuses" :key="index">
        <strong class="equipment-detail-label">{{localize(concat('ARCHMAGE.ITEM.', index, 'Bonus'))}}: </strong><span class="equipment-detail-value">{{bonus}}</span>
      </div>
    </section>
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="equipment-details flexcol">
      <div class="equipment-detail">
        <span class="equipment-detail-value" v-html="equipment.data.description.value"></span>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: ['equipment', 'bonuses'],
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