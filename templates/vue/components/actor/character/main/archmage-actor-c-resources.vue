<template>
  <section class="section section--resources flexrow flexshrink" :data-resource-count="resourceCount" :data-custom-count="customResourceCount">
    <!-- Command Points -->
    <section v-if="actor.data.resources.perCombat.commandPoints.enabled" class="unit unit--command-points">
      <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints')}}</h2>
      <div class="resource flexrow">
        <div class="resource--left">
          <input type="number" name="data.resources.perCombat.commandPoints.current" v-model="commandPoints">
        </div>
        <div class="resource--right flexcol">
          <!-- TODO: Add support for epic feat to bump to d6. -->
          <a class="rollable rollable--command rollable--command-4" data-roll-type="command" data-roll-opt="d4">d4</a>
          <a class="rollable rollable--command rollable--command-3" data-roll-type="command" data-roll-opt="d3">d3</a>
        </div>
      </div>
    </section>
    <!-- Ki -->
    <section v-if="actor.data.resources.spendable.ki.enabled" class="unit unit--has-max unit--ki">
      <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.ki')}}</h2>
      <archmage-h-progress name="ki" :current="actor.data.resources.spendable.ki.current" :max="actor.data.resources.spendable.ki.max"/>
      <div class="resource flexrow">
        <input type="number" name="data.resources.spendable.ki.current" class="resource-current" v-model="ki.current">
        <span class="resource-separator">/</span>
        <input type="number" name="data.resources.spendable.ki.max" class="resource-max" v-model="ki.max">
      </div>
    </section>
    <!-- Focus -->
    <section v-if="actor.data.resources.perCombat.focus.enabled" class="unit unit--focus">
      <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.focus')}}</h2>
      <div class="resource flexrow">
        <input type="checkbox" name="data.resources.perCombat.focus.current" v-model="focus">
      </div>
    </section>
    <!-- Momentum -->
    <section v-if="actor.data.resources.perCombat.momentum.enabled" class="unit unit--momentum">
      <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.momentum')}}</h2>
      <div class="resource flexrow">
        <input type="checkbox" name="data.resources.perCombat.momentum.current" v-model="momentum">
      </div>
    </section>
    <!-- Disengage -->
    <section class="unit unit--disengage">
      <h2 class="unit-title">{{localize('ARCHMAGE.SAVE.disengage')}}</h2>
      <div class="resource flexcol">
        <a class="rollable rollable--disengage disengage-value" data-roll-type="save" data-roll-opt="disengage">{{disengage.value}}+</a>
        <div class="disengage-bonus flexrow">
          <span class="disengage-label">{{localize('ARCHMAGE.bonus')}}</span>
          <input type="number" name="data.attributes.disengageBonus" class="disengage-bonus" v-model="disengage.bonus">
        </div>
      </div>
    </section>
    <!-- Rests -->
    <section class="unit unit--rest">
      <h2 class="unit-title">{{localize('ARCHMAGE.CHAT.Rests')}}</h2>
      <div class="resource flexcol">
        <button type="button" class="rest rest--quick" data-rest-type="quick"><i class="fas fa-campground"></i> {{localize('ARCHMAGE.CHAT.QuickRest')}}</button>
        <button type="button" class="rest rest--full" data-rest-type="full"><i class="fas fa-bed"></i> {{localize('ARCHMAGE.CHAT.FullHeal')}}</button>
      </div>
    </section>
    <div class="resource-divider" v-if="(resourceCount > 1 && customResourceCount > 0) || customResourceCount > 1"></div>
    <!-- Custom Resouces -->
    <section v-for="(resource, index) in customResources" :key="index" class="unit unit--custom">
      <input type="text" :name="concat('data.resources.spendable.', index, '.label')" class="resource-title-input" v-model="resource.label"/>
      <archmage-h-progress :name="index" :current="resource.current" :max="resource.max"/>
      <div class="resource flexrow">
        <input type="number" :name="concat('data.resources.spendable.', index, '.current')" class="resource-current" v-model="resource.current">
        <span class="resource-separator">/</span>
        <input type="number" :name="concat('data.resources.spendable.', index, '.max')" class="resource-max" v-model="resource.max">
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
  computed: {
    customResources() {
      let resources = {};
      for (let [k,v] of Object.entries(this.actor.data.resources.spendable)) {
        if (k.includes('custom') && v.enabled) resources[k] = v;
      }
      return resources;
    },
    resourceCount() {
      let count = 0;
      if (this.actor.data.resources.perCombat.commandPoints.enabled) count++;
      if (this.actor.data.resources.spendable.ki.enabled) count++;
      if (this.actor.data.resources.perCombat.focus.enabled) count++;
      if (this.actor.data.resources.perCombat.momentum.enabled) count++;
      return count;
    },
    customResourceCount() {
      let arr = Object.keys(this.customResources);
      return arr && arr.length ? arr.length : 0;
    }
  },
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