<template>
  <section class="action">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="action-details flexcol">
      <div class="action-detail">
        <!-- <span class="action-detail-value" v-html="action.data.description.value"></span> -->
      </div>
      <div v-if="action.data.miss.value" class="action-miss">Miss: {{action.data.miss.value}}</div>
    </section>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
export default {
  name: 'Actioin',
  props: ['action'],
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

<style lang="scss" scoped>

</style>