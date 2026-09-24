<template>
  <li class="effect-row" :class="{'effect-row--disabled': effect.disabled}">
    <!-- Summary row: icon, name, stats column, controls — all vertically
         centered. The stats column stacks wrapping bonus chips over a
         full-width duration line. -->
    <div class="effect-summary">
      <img :src="effect.img ?? 'icons/svg/cowled.svg'" class="effect-icon"/>
      <a class="effect-name" :title="localize('ARCHMAGE.EFFECT.AE.toggle')" @click="toggleExpanded">
        <h3 class="effect-name-value">{{effect?.name ?? effect?.label}}</h3>
      </a>
      <div class="effect-stats">
        <div v-if="changes.length || effect.flags.archmage?.ongoingDamage" class="effect-bonuses">
          <span class="bonus" v-for="(bonus, bonusKey) in changes" :key="bonusKey">
            <span class="bonus-label"><i :class="bonus.img"></i> {{bonus.name}} </span>
            <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
            <span class="bonus-value">{{numberFormat(bonus.value, 0, false)}}</span>
          </span>
          <span class="bonus" v-if="effect.flags.archmage?.ongoingDamage">
            <span class="bonus-label"><i class="fas fa-flask-round-poison"></i> {{ongoingDamage}}</span>
          </span>
        </div>
        <div v-if="effect.flags.archmage?.duration" class="effect-duration">
          <span class="bonus">
            <span class="bonus-label"><i class="fas fa-timer"></i> {{duration}}</span>
          </span>
        </div>
      </div>
      <div v-if="editable" class="effect-controls">
        <a class="effect-control" :title="localize('ARCHMAGE.EFFECT.AE.toggle')" @click="toggleEffect"><i :class="concat('fas fa-', effect.disabled ? 'check' : 'times')"></i></a>
        <a class="effect-control" :title="localize('ARCHMAGE.EFFECT.AE.edit')" @click="editEffect"><i class="fas fa-edit"></i></a>
        <a class="effect-control" :title="localize('ARCHMAGE.EFFECT.AE.delete')" @click="deleteEffect($event.shiftKey)"><i class="fas fa-trash"></i></a>
      </div>
    </div>
    <Transition name="slide-fade">
      <div v-if="expanded && effect.description" class="effect-description" v-html="effect.description"></div>
    </Transition>
  </li>
</template>

<script setup>
/**
 * One effect row: summary line plus expandable description. Owns its own
 * interactions — toggling, editing and deleting — writing through the actor
 * document injected by the sheet, since props.actor is the context's
 * toObject() clone.
 */
import { ref, computed, inject } from 'vue';
import { concat, getActor, localize, numberFormat } from '@/methods/Helpers';
import { roundOngoingDamage } from '@src/module/active-effects/ongoing-damage.mjs';

const props = defineProps({
  effect: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  editable: {type: Boolean, default: false},
});

// Updates go through the real actor document; props.actor is a data clone.
const actorDocument = inject('actorDocument');

// This row's description starts collapsed.
const expanded = ref(false);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

const changes = computed(() => game.archmage.ArchmageUtility.getActiveEffectChanges(props.effect));

const duration = computed(() =>
  localize(CONFIG.ARCHMAGE.effectDurationTypes[props.effect.flags.archmage?.duration])
);

const ongoingDamage = computed(() => {
  const flags = props.effect.flags.archmage;
  return `${roundOngoingDamage(flags.ongoingDamage)} ongoing ${flags.ongoingDamageType} damage`;
});

// Resolve the live effect document from the actor document, falling back to
// the drag-data lookup for pack actors where injection is unavailable.
async function getEffectDoc() {
  const doc = actorDocument?.effects?.get(props.effect._id);
  if (doc) return doc;
  return (await getActor(props.actor))?.effects?.get(props.effect._id) ?? null;
}

async function toggleEffect() {
  const doc = await getEffectDoc();
  await doc?.update({disabled: !doc.disabled});
}

async function editEffect() {
  const doc = await getEffectDoc();
  doc?.sheet?.render(true);
}

async function deleteEffect(bypass = false) {
  const doc = await getEffectDoc();
  if (!doc) return;

  if (bypass) {
    await doc.delete();
    return;
  }

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: {title: localize('ARCHMAGE.CHAT.DeleteConfirmTitle')},
    content: `<p>${localize('ARCHMAGE.CHAT.DeleteConfirm')}</p>`,
    confirm: {label: localize('ARCHMAGE.CHAT.Delete')},
    cancel: {label: localize('ARCHMAGE.CHAT.Cancel')}
  });
  if (confirmed) await doc.delete();
}
</script>

<style scoped lang="scss">
  .effect-row {
    /* 1px seam between stacked rows so the page background peeks through. */
    margin: 0 0 5px 0;

    /* Disabled effects dim, matching the V2 sheet. */
    &.effect-row--disabled .effect-summary {
      opacity: 0.6;
    }
  }

  .effect-summary {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0 0.25rem;
    font-family: var(--v3-font-label);
    font-size: var(--v3-font-size-label);
    color: var(--c-white);
    text-shadow: 0 0 10px var(--c-black--50);
    background: var(--v3-effect-bg);

    a {
      color: var(--c-white);

      &:hover {
        color: var(--c-white);
        text-shadow: 0 0 10px var(--c-white);
      }
    }

    .effect-icon {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
    }

    .effect-name {
      flex: 1 1 5em;
      min-width: 0;
      cursor: pointer;

      .effect-name-value {
        margin: 0;
        font-family: var(--v3-font-display);
        font-size: var(--v3-font-size-value);
        font-weight: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    /* Stats column: wrapping bonus chips over a full-width duration line. */
    .effect-stats {
      flex: 1 1 10em;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.125rem;

      .bonus {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: auto;
        margin: 1px 2px;
        padding: 0 0.25rem;
        background: var(--v3-chip-bg);
        border-radius: 6px;
        font-size: var(--v3-font-size-title);
        white-space: nowrap;

        .bonus-label {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-right: 2px;
          text-shadow: none;

          i {
            color: var(--c-white);
          }
        }

        .bonus-mode {
          margin: 0 6px;
          font-size: 0.75em;

          i {
            color: var(--c-white);
          }
        }
      }

      /* Bonus chips, managed like the V2 sheet's .section--effects .bonus:
         spread to fill their line, content centered, spacing via margins. */
      .effect-bonuses {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;

      }

      /* Duration: the same chip treatment as the bonuses, stretched to its
         own full-width line. */
      .effect-duration {
        display: flex;
      }
    }

    .effect-controls {
      flex: 0 0 auto;
      display: flex;
      gap: 0.25rem;

      .effect-control {
        cursor: pointer;
      }
    }
  }

  .effect-description {
    padding: 0.25rem 0.5rem 0 2rem;
    font-size: var(--v3-font-size-label);
    color: var(--v3-text-muted);
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.2s ease-in-out;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-25%);
  }
</style>
