<template>
  <section :class="classes" data-tab="effects">
    <section class="effects-group">
      <div class="effects-group-header">
        <div class="effects-header-title grid effects-grid">
          <h2 class="effects-group-title unit-title">{{localize('Effects')}}</h2>
          <div class="item-controls effect-controls">
            <a class="effect-control" data-action="create" :title="localize('Create Effect')"><i class="fas fa-plus"></i></a>
          </div>
        </div>
      </div>
      <ul class="effects-group-content flexcol">
        <li v-for="(effect, effectKey) in effects" :key="effectKey" :class="concat('item effects-item', (effect.disabled ? ' effects-disabled' : ''))" :data-effect-id="effect._id" data-draggable="true" draggable="true">
          <div class="effects-summary grid effects-grid effects">
            <div class="effects-icon">
              <img :src="effect.icon" class="effects-image"/>
            </div>
            <a class="effects-name" :data-effects-id="effect._id">
              <h3 class="effects-title unit-subtitle">{{effect.label}}</h3>
            </a>
            <div class="effects-bonus flexrow">
              <span class="bonus" v-for="(bonus, bonusKey) in getChanges(effect)" :key="bonusKey">
                <span class="bonus-label">{{bonus.label}} </span>
                <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
                <span class="bonus-value">{{numberFormat(bonus.value, 0, false)}}</span>
              </span>
            </div>
            <div class="item-controls effect-controls">
              <a class="effect-control" :data-item-id="effect._id" data-action="toggle" :title="localize('Toggle Effect')"><i :class="concat('fas fa-', effect.disabled ? 'check' : 'times')"></i></a>
              <a class="effect-control" :data-item-id="effect._id" data-action="edit" :title="localize('Edit Effect')"><i class="fas fa-edit"></i></a>
              <a class="effect-control" :data-item-id="effect._id" data-action="delete" :title="localize('Edit Effect')"><i class="fas fa-trash"></i></a>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab', 'flags'],
  data: function() {
    return {
      effects: []
    }
  },
  computed: {
    classes() {
      return `section section--effects flexcol${this.tab.active ? ' active' : ''}`;
    }
  },
  methods: {
    getEffects() {
      // TODO: Expand this with filtering/grouping.
      let effects = this.actor.effects;
      this.effects = effects;
    },
    getChanges(effect) {
      let changes = [];
      let modes = [
        'question',
        'times',
        'plus',
        'angle-double-down',
        'angle-double-up',
        'undo'
      ]
      effect.changes.forEach(c => {
        if (c.key && c.value) {
          changes.push({
            label: c.key,
            mode: modes[c.mode],
            value: c.value
          });
        }
      })

      return changes;
    }
  },
  watch: {
    'actor.effects': {
      deep: true,
      handler() {
        this.getEffects();
      }
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {
    this.getEffects();
  }
}
</script>