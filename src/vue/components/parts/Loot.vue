<template>
  <section class="equipment">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="equipment-details flexcol">
      <div class="equipment-detail">
        <span class="equipment-detail-value" v-html="equipment.data.description.value"></span>
      </div>
    </section>
  </section>
</template>

<script>
import { concat, localize } from '/src/vue/methods/Helpers';
export default {
  name: 'Loot',
  props: ['equipment'],
  setup() {
    return {
      concat,
      localize
    }
  },
  data() {
    return {}
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
  },
  methods: {},
  async mounted() {}
}
</script>