<template>
  <section class="action">
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="action-details flexcol">
      <div v-if="action.system?.hit1?.value" class="hanging-indent action-hit1"><em v-if="enrichedActions.hit1.name" v-html="enrichedActions.hit1.name"></em><span v-html="enrichedActions.hit1.value"></span></div>
      <div v-if="action.system?.hit2?.value" class="hanging-indent action-hit2"><em v-if="enrichedActions.hit2.name" v-html="enrichedActions.hit2.name"></em><span v-html="enrichedActions.hit2.value"></span></div>
      <div v-if="action.system?.hit3?.value" class="hanging-indent action-hit3"><em v-if="enrichedActions.hit3.name" v-html="enrichedActions.hit3.name"></em><span v-html="enrichedActions.hit3.value"></span></div>
      <div v-if="action.system?.miss?.value" class="hanging-indent action-miss"><em>{{localize('ARCHMAGE.miss')}}:</em> <span v-html="enrichedActions.miss.value"></span></div>
      <div v-if="action.system?.description?.value && action.type == 'action'" class="hanging-indent action-detail">
        <span class="action-detail-value" v-html="enrichedActions.description.value"></span>
      </div>
    </section>
  </section>
</template>

<script>
import { concat, localize, wrapRolls } from '@/methods/Helpers';
export default {
  name: 'Action',
  props: ['action'],
  setup() {
    return {
      concat,
      localize,
      wrapRolls,
    }
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
  methods: {
    getLabel(label) {
      return label ? `${wrapRolls(label)}: ` : '';
    }
  },
  async mounted() {
    const fields = {
      'hit1': ['name', 'value'],
      'hit2': ['name', 'value'],
      'hit3': ['name', 'value'],
      'miss': ['value'],
      'description': ['value'],
    };

    // @todo this isn't quite working yet.
    for (let [field, fieldProps] of Object.entries(fields)) {
      this.enrichedActions[field] = {};
      for (let fieldProp of fieldProps) {
        wrapRolls(this.action.system[field][fieldProp]).then(enrichedAction => {
          this.enrichedActions[field][fieldProp] = enrichedAction;
          console.log(this.enrichedActions);
        });
      }
    }
  }
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