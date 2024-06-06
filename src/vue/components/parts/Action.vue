<template>
  <section class="action">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <Suspense>
      <section class="action-details flexcol">
        <div v-if="action.system?.hit1?.value" class="hanging-indent action-hit1">
          <Enriched tag="em" :text="action.system?.hit1?.name + ':'"/>
          <Enriched tag="span" :text="action.system.hit1.value"/>
        </div>
        <div v-if="action.system?.hit2?.value" class="hanging-indent action-hit2">
          <Enriched tag="em" :text="action.system?.hit2?.name + ':'"/>
          <Enriched tag="span" :text="action.system.hit2.value"/>
        </div>
        <div v-if="action.system?.hit3?.value" class="hanging-indent action-hit3">
          <Enriched tag="em" :text="action.system?.hit3?.name + ':'"/>
          <Enriched tag="span" :text="action.system.hit3.value"/>
        </div>
        <div v-if="action.system?.miss?.value" class="hanging-indent action-miss">
          <em>{{localize('ARCHMAGE.miss')}}:</em>
          <Enriched tag="span" :text="action.system.miss.value"/>
        </div>
        <div v-if="action.system?.description?.value && action.type == 'action'" class="hanging-indent action-detail">
          <Enriched tag="span" class="action-detail-value" :text="action.system.description.value"/>
        </div>
      </section>
    </Suspense>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Enriched from '@/components/parts/Enriched.vue';
export default {
  name: 'Action',
  props: ['action'],
  setup() {
    return {
      concat,
      localize,
    }
  },
  components: {
    Enriched,
  },
  data() {
    return {
      enrichedActions: {}
    }
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

<style lang="scss">
.archmage-vue {
  .action {
    padding-left: 25px;
  }

  .action-detail {
    border: 1px solid $c-black--25;
    border-radius: 4px;
    background: rgba($c-black, 0.05);
    margin-bottom: $padding-md;
  }

  .nightmode {
    .action-detail {
      background: rgba($c-white, 0.05);
    }
  }

  .action-detail-value {
    display: block;
    padding: 0 4px 0 8px;
  }
}
</style>