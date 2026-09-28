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

    <!-- Incremental advances: (WIP) -->
    <section class="progression-section">
      <h4 class="progression-section-title unit-title">
        <span class="section-label">{{ localize('ARCHMAGE.incrementalAdvances') }}</span>
      </h4>
      <p class="placeholder">&mdash;</p>
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
import { inject } from 'vue';
import { localize, tooltip } from '@/methods/Helpers';

defineProps(['actor', 'editable']);

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
</style>
