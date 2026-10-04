<template>
  <section class="tab-effects">
    <header class="effects-header">
      <div v-if="editable" class="effect-controls">
        <a class="effect-control" :title="localize('ARCHMAGE.EFFECT.AE.new')" @click="createEffect"><i class="fas fa-plus"></i></a>
      </div>
    </header>

    <ul v-if="effects.length" class="effects-list">
      <EffectRowV3 v-for="effect in effects" :key="effect._id" :effect="effect" :actor="actor" :editable="editable"
        :class="rowClasses(effect._id)"
        :draggable="canReorder"
        @dragstart="onRowDragStart($event, 'effects', effect._id)"
        @dragover="onRowDragOver($event, 'effects', effect._id)"
        @dragleave="onRowDragLeave($event, effect._id)"
        @drop="onRowDrop($event, 'effects', effect._id)"
        @dragend="onRowDragEnd"/>
    </ul>

    <p v-else class="effects-empty">&mdash;</p>
  </section>
</template>

<script setup>
/**
 * Effects tab: the actor's active effects with their changes, ongoing damage
 * and durations. Rows own their row-level interactions; the tab owns creating
 * new effects and drag-to-reorder, writing through the actor document
 * injected by the sheet, since props.actor is the context's toObject() clone.
 */
import { computed, inject } from 'vue';
import { getActor, localize } from '@/methods/Helpers';
import { useRowReorder } from '@/composables/useRowReorder';
import EffectRowV3 from '@/components/actor/character/v3/EffectRowV3.vue';

const props = defineProps(['actor', 'editable']);

// Updates go through the real actor document; props.actor is a data clone.
const actorDocument = inject('actorDocument');

// Display order: the effects' own sort values, which drag-and-drop here and
// on the v2 effects tab both write. The sort is stable, so ties keep the
// collection's order.
const effects = computed(() => [...(props.actor?.effects ?? [])]
  .sort((a, b) => (a.sort || 0) - (b.sort || 0)));

// Reordering is only offered when the sheet is editable and the actor isn't
// a compendium entry (where documents can't be written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

async function createEffect() {
  if (!actorDocument) return;
  await actorDocument.createEmbeddedDocuments('ActiveEffect', [{
    name: localize('ARCHMAGE.EFFECT.AE.new'),
    img: 'icons/svg/aura.svg',
    origin: actorDocument.uuid,
    disabled: false
  }]);
}

// Row reordering. The rows are the tab's own drags from the start — nothing
// else wires effect rows — so the whole lifecycle is handled here and kept
// away from the sheet's drop handling. Like the v2 effects tab, the order
// persists to the effect documents' sort values rather than a flag, so the
// two sheets agree. The list is the tab's single container, keyed 'effects'.
const SORT_SPACING = 100;

// Renumber every effect: only the sequence matters, and rewriting all of
// them keeps the result deterministic regardless of what values were
// written before. props.actor is a data clone; resolve the live document,
// with the drag-data lookup as fallback.
const saveEffectOrder = async (orderedIds) => {
  const actor = actorDocument ?? await getActor(props.actor);
  const updates = orderedIds.map((id, index) => ({_id: id, sort: (index + 1) * SORT_SPACING}));
  await actor?.updateEmbeddedDocuments('ActiveEffect', updates);
};

const {
  rowClasses, onRowDragStart, onRowDragOver, onRowDragLeave, onRowDrop, onRowDragEnd,
} = useRowReorder({
  actor: () => props.actor,
  canReorder,
  persist: saveEffectOrder,
  rows: () => effects.value,
  startDrag: (event, _containerKey, effectId) => {
    event.dataTransfer.effectAllowed = 'move';
    // Firefox needs data for the drag to start; tag the payload so nothing
    // downstream mistakes this for an item drag.
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'ArchmageEffectOrder',
      effectId
    }));
    // Don't let the sheet's drop handling see this.
    event.stopPropagation();
  },
});
</script>

<style scoped lang="scss">
  @import 'v3/drag-reorder';

  .effects-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--color-border);

    .effects-title {
      margin: 0;
      font-family: var(--v3-font-display);
      font-size: var(--font-size-12);
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
    color: var(--color-text-secondary);
  }
</style>
