<template>
  <section :class="classes">
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
              <div class="bonus" v-for="(bonus, bonusKey) in getChanges(effect)" :key="bonusKey">
                <span class="bonus-label">{{bonus.label}} </span>
                <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
                <span class="bonus-value">{{numberFormat(bonus.value, 0, false)}}</span>
              </div>
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
import { concat, localize, numberFormat } from '@/methods/Helpers';
import { reactive, computed, toRefs } from 'vue';
// This component includes an example of using the composition API
// https://www.vuemastery.com/pdf/Vue-3-Cheat-Sheet.pdf
// https://vuejs.org/api/composition-api-setup.html
export default {
  name: 'CharEffects',
  props: ['actor', 'tab', 'flags'],
  setup() {
    // Equivalent to data: and computed:
    const componentData = reactive({
      effects: [],
      classes: computed(() => `section section--effects flexcol`)
    });
    // Define methods.
    function getEffects() {
      let effects = this.actor.effects;
      this.effects = effects;
    };
    function cleanLabel(label) {
      // TODO: Localize
      return label
          .replace("data.attributes", "")
          .replace("system.attributes", "")
          .replace("attack", "Attack")
          .replace("arcane", "Arcane")
          .replace("divine", "Divine")
          .replace("ranged", "Ranged")
          .replace("melee", "Melee")
          .replace("bonus", "Bonus")
          .replace("md", "Mental Defense")
          .replace("pd", "Physical Defense")
          .replace("hp", "Health")
          .replace("save", "Save Bonus")
          .replace("disengage", "Disengage Bonus")
          .replace("recoveries", "Recoveries")
          .replace("value", "")
          .replaceAll(".", " ")
          .replace("ac ", "Armor Class");
    };
    function getChanges(effect) {
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
            label: this.cleanLabel(c.key),
            mode: modes[c.mode],
            value: c.value
          });
        }
      })
      return changes;
    }

    // Return our custom data, methods, and any imported methods.
    return {
      ...toRefs(componentData),
      concat,
      localize,
      numberFormat,
      getEffects,
      getChanges,
      cleanLabel
    }
  },
  watch: {
    'actor.effects': {
      deep: true,
      handler() {
        this.getEffects()
      }
    }
  },
  watch: {
    'actor.effects': {
      deep: true,
      handler() {
        this.getEffects()
      }
    }
  },
  // Execute getEffects as soon as we're mounted.
  async mounted() {
    this.getEffects();
  }
}
</script>
