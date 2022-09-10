<template>
  <section class="action">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="action-details flexcol">
      <div v-if="action.system?.hit1?.value" class="hanging-indent action-hit1"><em v-html="getLabel(action.system?.hit1?.name)"></em><span v-html="wrapRolls(action.system.hit1.value)"></span></div>
      <div v-if="action.system?.hit2?.value" class="hanging-indent action-hit2"><em v-html="getLabel(action.system?.hit2?.name)"></em><span v-html="wrapRolls(action.system.hit2.value)"></span></div>
      <div v-if="action.system?.hit3?.value" class="hanging-indent action-hit3"><em v-html="getLabel(action.system?.hit3?.name)"></em><span v-html="wrapRolls(action.system.hit3.value)"></span></div>
      <div v-if="action.system?.miss?.value" class="hanging-indent action-miss"><em>Miss:</em> <span v-html="wrapRolls(action.system.miss.value)"></span></div>
      <div v-if="action.system?.description?.value && action.type == 'action'" class="hanging-indent action-detail">
        <span class="action-detail-value" v-html="action.system.description.value"></span>
      </div>
    </section>
  </section>
</template>

<script>
import { concat, localize, wrapRolls } from '@/methods/Helpers';
export default {
  name: 'Actioin',
  props: ['action'],
  setup() {
    return {
      concat,
      localize,
      wrapRolls
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
  methods: {
    getLabel(label) {
      return label ? `${wrapRolls(label)}: ` : '';
    }
  },
  async mounted() {}
}
</script>

<style lang="scss">
.archmage-vue {
  .action {
    padding-left: 25px;
  }

  .action-detail {
    border: 1px solid $c-gray--25;
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