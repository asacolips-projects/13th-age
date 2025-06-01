<template>
  <section :class="classes">
    <section class="effects-group">
      <div class="effects-group-header">
        <div class="effects-header-title grid effects-grid">
          <h2 class="effects-group-title unit-title">{{localize('ARCHMAGE.effects')}}</h2>
          <div class="item-controls effect-controls">
            <a class="effect-control" data-action="create" :title="localize('ARCHMAGE.EFFECT.AE.new')"><i class="fas fa-plus"></i></a>
          </div>
        </div>
      </div>
      <ul class="effects-group-content flexcol">
        <li v-for="(effect, effectKey) in effects" :key="effectKey"
          :class="concat('item effect effects-item ', concat('effect-', effect._id), (effect.disabled ? ' effects-disabled' : ''))"
          :data-effect-id="effect._id"
          :data-parent-id="actor._id"
          data-document-class="ActiveEffect"
          data-drag="true"
          data-draggable="true"
          draggable="true">
          <div class="effects-summary grid effects-grid effects">
            <div class="effects-icon">
              <img :src="effect.img ?? 'icons/svg/cowled.svg'" class="effects-image"/>
            </div>
            <a class="effects-name" v-on:click="toggleEffect" :data-effects-id="effect._id">
              <h3 class="effects-title unit-subtitle">{{effect?.name ?? effect?.label}}</h3>
            </a>
            <div class="effects-bonus flexrow">
              <div class="bonus" v-for="(bonus, bonusKey) in getChanges(effect)" :key="bonusKey">
                <span class="bonus-label"><i :class="bonus.icon"></i> {{bonus.name}} </span>
                <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
                <span class="bonus-value">{{numberFormat(bonus.value, 0, false)}}</span>
              </div>
              <div class="bonus" v-if="effect.flags.archmage?.ongoingDamage">
                <span class="bonus-label"><i class="fas fa-flask-round-poison"></i> {{getOngoingDamage(effect)}}</span>
              </div>
              <div class="bonus" v-if="effect.flags.archmage?.duration">
                <span class="bonus-label"><i class="fas fa-timer"></i> {{getDuration(effect)}}</span>
              </div>
            </div>
            <div class="item-controls effect-controls">
              <a class="effect-control" :data-item-id="effect._id" data-action="toggle" :title="localize('ARCHMAGE.EFFECT.AE.toggle')"><i :class="concat('fas fa-', effect.disabled ? 'check' : 'times')"></i></a>
              <a class="effect-control" :data-item-id="effect._id" data-action="edit" :title="localize('ARCHMAGE.EFFECT.AE.edit')"><i class="fas fa-edit"></i></a>
              <a class="effect-control" :data-item-id="effect._id" data-action="delete" :title="localize('ARCHMAGE.EFFECT.AE.delete')"><i class="fas fa-trash"></i></a>
            </div>
          </div>
          <div v-if="effect.description" class="effect-detail effect-detail--description">
            <Transition name="slide-fade">
              <div v-if="activeEffects[effect._id]" class="effect-detail-value" v-html="effect.description"></div>
            </Transition>
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
  props: ['actor'],
  setup() {
    // Equivalent to data: and computed:
    const componentData = reactive({
      effects: [],
      activeEffects: {},
      classes: computed(() => `section section--effects flexcol`)
    });
    // Define methods.
    function getEffects() {
      let effects = this.actor.effects;
      this.effects = effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    };
    function getChanges(effect) {
      let changes = [];
      let modes = [
        'question',
        'times',
        'plus',
        "minus",
        'angle-double-down',
        'angle-double-up',
        'undo'
      ]
      effect.changes.forEach(c => {
        if (c.key && c.value) {
          const label = game.archmage.ArchmageUtility.cleanActiveEffectLabel(c.key);
          let change = {
            name: label,
            img: game.archmage.ArchmageUtility.getActiveEffectLabelIcon(label),
            mode: modes[c.mode],
            value: c.value
          };
          if (change.mode === "plus" && change.value < 0) {
            change.mode = "minus";
            change.value = Math.abs(change.value);
          }
          changes.push(change);
        }
      })
      return changes;
    }

    function getDuration(effect) {
      return game.i18n.localize(CONFIG.ARCHMAGE.effectDurationTypes[effect.flags.archmage.duration]);
    }

    function getOngoingDamage(effect) {
      return `${effect.flags.archmage.ongoingDamage} ongoing ${effect.flags.archmage.ongoingDamageType} damage`;
    }

    // Return our custom data, methods, and any imported methods.
    return {
      ...toRefs(componentData),
      concat,
      localize,
      numberFormat,
      getEffects,
      getChanges,
      getDuration,
      getOngoingDamage
    }
  },
  methods: {
    /**
     * Toggle effect display (click event).
     */
    toggleEffect(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.effectsId;
      if (id) {
        // Toggle the state if the effect is currently being tracked.
        if (this.activeEffects[id] !== undefined) {
          this.activeEffects[id] = !this.activeEffects[id];
        }
        // Otherwise, assume it should be open since this was click event.
        else {
          this.activeEffects[id] = true;
        }
      }
      const element = this.$el.querySelector(`.effect-${id} > .effect-detail--description`);
    }
  },
  // watch: {
  //   'actor.effects': {
  //     deep: true,
  //     handler() {
  //       this.getEffects()
  //     }
  //   }
  // },
  // Execute getEffects as soon as we're mounted.
  async mounted() {
    this.getEffects();
  }
}
</script>

<style>
/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.slide-fade-enter-active {
  transition: all 0.2s ease-in-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-60%);
}
</style>