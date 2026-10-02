<template>
  <section class="tab-progression">
    <!-- Rests: the per-battle quick rest and the full heal-up, both gated by
         the same confirmation dialog the V2 sheet uses; shift-click skips it. -->
    <section class="progression-section">
      <h4 class="progression-section-title unit-title">
        <span class="section-label">{{ localize('ARCHMAGE.CHAT.Rests') }}</span>
      </h4>
      <div class="rest-buttons">
        <button type="button" class="rest rest--quick"
          @click="rest('quick', $event.shiftKey)"
          :data-tooltip="tooltip('pcRestQuick')">
          <i class="fas fa-campground"></i> {{ localize('ARCHMAGE.CHAT.QuickRest') }}
        </button>
        <button type="button" class="rest rest--full"
          @click="rest('full', $event.shiftKey)"
          :data-tooltip="tooltip('pcRestFull')">
          <i class="fas fa-bed"></i> {{ localize('ARCHMAGE.CHAT.FullHeal') }}
        </button>
      </div>
    </section>

    <!-- Incremental advances: one chip per advance, ordered by edition. Each
         is a plain boolean at system.incrementals; the per-character hide
         flag is owned by the settings app, so the section just renders away. -->
    <section class="progression-section" v-if="!actor.flags.archmage?.hideIncrementals">
      <h4 class="progression-section-title unit-title">
        <span class="section-label">{{ localize('ARCHMAGE.incrementalAdvances') }}</span>
      </h4>
      <ul class="incremental-grid">
        <li v-for="inc in incrementals" :key="inc.key" class="incremental"
          :class="{'incremental--taken': inc.checked}">
          <label>
            <input type="checkbox" :checked="inc.checked" :disabled="!editable"
              @change="toggleIncremental(inc)">
            <span>{{ localize(inc.labelKey) }}</span>
          </label>
          <p class="incremental-hint">{{ localize(inc.hintKey) }}</p>
        </li>
      </ul>
    </section>

    <!-- Level-up: (WIP) -->
    <section class="progression-section">
      <h4 class="progression-section-title unit-title">
        <span class="section-label">{{ localize('ARCHMAGE.levelUp') }}</span>
      </h4>
      <p class="placeholder">&mdash;</p>
    </section>
  </section>
</template>

<script setup>
/**
 * Progression tab: rests, incremental advances and level-ups in three
 * sections. The rest buttons drive the same actor methods as the V2
 * resources strip, with the confirmation dialog ported over.
 */
import { computed, inject } from 'vue';
import { localize, tooltip } from '@/methods/Helpers';

const props = defineProps(['actor', 'editable']);

// Updates from view mode (toggles) go through the real actor document;
// props.actor is the context's toObject() clone.
const actorDocument = inject('actorDocument');

/**
 * Take a quick rest or full heal-up. Shift-click bypasses the confirmation,
 * matching the V2 sheet's _onRest.
 *
 * @param {string} type   'quick' or 'full'.
 * @param {boolean} bypass   Skip the confirmation dialog.
 */
async function rest(type, bypass = false) {
  if (!actorDocument) return;
  if (type !== 'quick' && type !== 'full') return;

  if (!bypass) {
    const [title, body] = type === 'quick'
      ? ['ARCHMAGE.CHAT.QuickRest', 'ARCHMAGE.CHAT.QuickRestBody']
      : ['ARCHMAGE.CHAT.FullHeal', 'ARCHMAGE.CHAT.FullHealBody'];
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {title: localize(title)},
      content: `<p>${localize(body)}</p>`,
      confirm: {label: localize('ARCHMAGE.CHAT.Rest')},
      cancel: {label: localize('ARCHMAGE.CHAT.Cancel')}
    });
    if (!confirmed) return;
  }

  await (type === 'quick' ? actorDocument.restQuick() : actorDocument.restFull());
}

// Incremental advance order differs by edition, mirroring the V2 sidebar
// list. The ability score bonus has a separate 2e hint since the wording
// changed between editions.
const INCREMENTALS_1E = ['abilityScoreBonus', 'skills', 'extraMagicItem', 'feat', 'talent',
  'hp', 'iconRelationshipPoint', 'powerSpell1', 'powerSpell2', 'powerSpell3', 'powerSpell4'];
const INCREMENTALS_2E = ['abilityScoreBonus', 'classFeature', 'feat', 'hp', 'extraMagicItem',
  'md', 'pd', 'powerSpell1', 'skillInitiative', 'talent', 'abilMultiplier'];

// Chips for the current edition, with the state read off the actor clone.
// The power/spell advances are interchangeable, so checked ones stay visible
// while unchecked ones collapse into a single "next slot" that advances each
// time one is taken.
const incrementals = computed(() => {
  const secondEdition = game.settings.get('archmage', 'secondEdition') === true;
  const keys = secondEdition ? INCREMENTALS_2E : INCREMENTALS_1E;
  const taken = props.actor?.system?.incrementals ?? {};
  const chips = keys.map(key => ({
    key,
    checked: taken[key] === true,
    labelKey: `ARCHMAGE.INCREMENTALS.${key}Name`,
    hintKey: `ARCHMAGE.INCREMENTALS.${secondEdition && key === 'abilityScoreBonus' ? 'abilityScoreBonus2e' : key}Hint`
  }));
  let nextPowerRevealed = false;
  return chips.filter(chip => {
    if (!chip.key.startsWith('powerSpell')) return true;
    if (chip.checked) return true;
    if (nextPowerRevealed) return false;
    nextPowerRevealed = true;
    return true;
  });
});

// Toggles go through the real actor document; props.actor is a data clone
// whose updates wouldn't round-trip.
function toggleIncremental(inc) {
  actorDocument?.update({[`system.incrementals.${inc.key}`]: !inc.checked});
}
</script>

<style scoped lang="scss">
  .progression-section {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .progression-section-title {
    margin: 0 0 0.25rem;
  }

  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--v3-text-muted);
  }

  // The two rest buttons sit side by side, each half the row; Foundry's
  // native button styling does the visual work.
  .rest-buttons {
    display: flex;
    align-items: stretch;
    gap: 0.375rem;

    .rest {
      flex: 1 1 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
    }
  }

  // One chip per advance in a fixed two-column grid; the hint text sits
  // under the toggle row inside the chip so the advance descriptions are
  // visible without hunting for tooltips. Taken advances get the positive
  // accent so progress reads at a glance.
  .incremental-grid {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
  }

  .incremental {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;

    &:hover {
      box-shadow: 0 0 0 1px var(--v3-hover-glow);
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: var(--v3-font-size-xxs);
      cursor: pointer;
    }

    input[type='checkbox'] {
      flex: 0 0 auto;
      margin: 0;
    }

    span {
      min-width: 0;
    }

    .incremental-hint {
      margin: 0.125rem 0 0;
      padding-left: 1.5rem; // line up under the label, clear of the checkbox
      font-size: var(--v3-font-size-xxs);
      color: var(--v3-text-muted);
      cursor: default;
    }

    &.incremental--taken {
      border-color: var(--button-border-color);

      label span {
        color: var(--button-border-color);
      }
    }

    // Locked out of edit mode: keep the chips readable but obviously inert.
    &:has(input:disabled) {
      cursor: default;
      opacity: 0.6;

      &:hover {
        box-shadow: none;
      }

      label {
        cursor: default;
      }
    }
  }
</style>
