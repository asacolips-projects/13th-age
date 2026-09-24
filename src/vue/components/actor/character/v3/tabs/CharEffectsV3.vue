<template>
  <section class="tab-effects">
    <header class="effects-header">
      <div v-if="editable" class="effect-controls">
        <a class="effect-control" :title="localize('ARCHMAGE.EFFECT.AE.new')" @click="createEffect"><i class="fas fa-plus"></i></a>
      </div>
    </header>

    <ul v-if="effects.length" class="effects-list">
      <EffectRowV3 v-for="effect in effects" :key="effect._id" :effect="effect" :actor="actor" :editable="editable"/>
    </ul>

    <p v-else class="effects-empty">&mdash;</p>
  </section>
</template>

<script setup>
/**
 * Effects tab: the actor's active effects with their changes, ongoing damage
 * and durations. Rows own their row-level interactions; the tab owns creating
 * new effects, writing through the actor document injected by the sheet,
 * since props.actor is the context's toObject() clone.
 */
import { computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import EffectRowV3 from '@/components/actor/character/v3/EffectRowV3.vue';

const props = defineProps(['actor', 'editable']);

// Updates go through the real actor document; props.actor is a data clone.
const actorDocument = inject('actorDocument');

const effects = computed(() => props.actor?.effects ?? []);

async function createEffect() {
  if (!actorDocument) return;
  await actorDocument.createEmbeddedDocuments('ActiveEffect', [{
    name: localize('ARCHMAGE.EFFECT.AE.new'),
    img: 'icons/svg/aura.svg',
    origin: actorDocument.uuid,
    disabled: false
  }]);
}
</script>

<style scoped lang="scss">
  .effects-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--v3-border);

    .effects-title {
      margin: 0;
      font-family: var(--v3-font-display);
      font-size: var(--v3-font-size-title);
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .effect-controls {
      display: flex;
      gap: 0.25rem;

      .effect-control {
        cursor: pointer;

        &:hover {
          text-shadow: 0 0 5px var(--v3-hover-glow);
        }
      }
    }
  }

  .effects-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .effects-empty {
    margin: 0;
    font-style: italic;
    color: var(--v3-text-muted);
  }
</style>
