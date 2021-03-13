<template>
  <section class="section section--resources flexrow flexshrink">
    <!-- Command Points -->
    <section v-if="actor.data.resources.perCombat.commandPoints.enabled" class="unit unit--command-points flexshrink">
      <h2 class="unit-title">{{localize('Command Points')}}</h2>
      <div class="resource flexrow">
        <div class="resource--left">
          <input type="text" name="data.resources.perCombat.commandPoints.current" v-model="commandPoints">
        </div>
        <div class="resource--right flexcol">
          <a class="rollable rollable--command-4" data-roll-type="command-4" data-roll-opt="d4">d4</a>
          <a class="rollable rollable--command-3" data-roll-type="command-3" data-roll-opt="d3">d3</a>
        </div>
      </div>
    </section>
    <!-- Ki -->
    <section v-if="actor.data.resources.spendable.ki.enabled" class="unit unit--has-max unit--ki flexshrink">
      <h2 class="unit-title">{{localize('Ki Points')}}</h2>
      <div class="resource flexrow">
        <input type="text" name="data.resources.spendable.ki.current" class="resource-current" v-model="ki.current">
        <span class="resource-separator">/</span>
        <input type="text" name="data.resources.spendable.ki.max" class="resource-max" v-model="ki.max">
      </div>
    </section>
    <!-- Focus -->
    <section v-if="actor.data.resources.perCombat.focus.enabled" class="unit unit--focus flexshrink">
      <h2 class="unit-title">{{localize('Focus')}}</h2>
      <div class="resource flexrow">
        <input type="checkbox" name="data.resources.perCombat.focus.current" v-model="focus">
      </div>
    </section>
    <!-- Momentum -->
    <section v-if="actor.data.resources.perCombat.momentum.enabled" class="unit unit--momentum flexshrink">
      <h2 class="unit-title">{{localize('Momentum')}}</h2>
      <div class="resource flexrow">
        <input type="checkbox" name="data.resources.perCombat.momentum.current" v-model="momentum">
      </div>
    </section>
    <!-- Disengage -->
    <section class="unit unit--disengage flexshrink">
      <h2 class="unit-title">{{localize('Disengage')}}</h2>
      <div class="resource flexcol">
        <a class="rollable rollable--disengage disengage-value" data-roll-type="disengage" :data-roll-opt="disengage.value">{{disengage.value}}+</a>
        <div class="disengage-bonus flexrow">
          <span class="disengage-label">{{localize('Bonus')}}</span>
          <input type="text" name="data.attributes.disengageBonus" class="disengage-bonus" v-model="disengage.bonus">
        </div>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: function() {
    return {
      commandPoints: 0,
      momentum: false,
      focus: false,
      ki: {
        value: 0,
        max: 0
      },
      disengage: {
        value: 11,
        bonus: 0
      }
    }
  },
  computed: {},
  methods: {
    updateResourceProps() {
      this.commandPoints = this.actor.data.resources.perCombat.commandPoints.current;
      this.momentum = this.actor.data.resources.perCombat.momentum.current;
      this.focus = this.actor.data.resources.perCombat.focus.current;
      this.ki = this.actor.data.resources.spendable.ki;
      this.disengage = {
        value: this.actor.data.attributes.disengage,
        bonus: this.actor.data.attributes.disengageBonus
      };
    }
  },
  watch: {
    'actor.data.resources': {
      deep: true,
      handler() {
        this.updateResourceProps();
      }
    },
    'actor.data.attributes': {
      deep: true,
      handler() {
        this.updateResourceProps();
      }
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.updateResourceProps();
  }
}
</script>