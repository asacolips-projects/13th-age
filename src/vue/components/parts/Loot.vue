<template>
  <section class="equipment">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="equipment-details flexcol">
      <div class="equipment-detail">
        <Suspense>
          <Enriched tag="span" :text="equipment.system.description.value" :diceFormulaMode="diceFormulaMode" />
        </Suspense>
      </div>
    </section>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Enriched from '@/components/parts/Enriched.vue';
export default {
  name: 'Loot',
  props: ['equipment'],
  components: {Enriched},
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
    diceFormulaMode() {
      return this.equipment?.actor?.flags?.archmage?.diceFormulaMode ?? 'short';
    },
  },
  methods: {},
  async mounted() {}
}
</script>
