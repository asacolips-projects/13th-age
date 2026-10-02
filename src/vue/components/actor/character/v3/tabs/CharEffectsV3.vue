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
        @dragstart="onEffectDragStart($event, effect._id)"
        @dragover="onEffectDragOver($event, effect._id)"
        @dragleave="onEffectDragLeave($event, effect._id)"
        @drop="onEffectDrop($event, effect._id)"
        @dragend="onEffectDragEnd"/>
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
import { computed, inject, ref } from 'vue';
import { getActor, localize } from '@/methods/Helpers';
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
// two sheets agree.
const draggedEffect = ref(null);
const dragOverEffect = ref(null);
const dropAfter = ref(false);

// Spacing between written sort values, so a later single-effect insert has
// room before the next renumber.
const SORT_SPACING = 100;

/**
 * Classes for an effect row, including drag feedback.
 */
const rowClasses = (effectId) => ({
  'effect-row--dragging': draggedEffect.value === effectId,
  'effect-row--drop-above': dragOverEffect.value === effectId && !dropAfter.value,
  'effect-row--drop-below': dragOverEffect.value === effectId && dropAfter.value,
});

const onEffectDragStart = (event, effectId) => {
  if (!canReorder.value) return;
  draggedEffect.value = effectId;
  event.dataTransfer.effectAllowed = 'move';
  // Firefox needs data for the drag to start; tag the payload so nothing
  // downstream mistakes this for an item drag.
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'ArchmageEffectOrder',
    effectId
  }));
  // Don't let the sheet's drop handling see this.
  event.stopPropagation();
};

const onEffectDragOver = (event, effectId) => {
  if (!draggedEffect.value) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  if (effectId === draggedEffect.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  dropAfter.value = (event.clientY - rect.top) >= (rect.height / 2);
  dragOverEffect.value = effectId;
};

const onEffectDragLeave = (event, effectId) => {
  if (dragOverEffect.value !== effectId) return;
  // dragleave also fires when moving between the row's children, so only
  // clear the indicator once the cursor has actually left the row.
  if (event.currentTarget.contains(event.relatedTarget)) return;
  dragOverEffect.value = null;
};

const onEffectDrop = async (event, targetId) => {
  if (!draggedEffect.value) return;
  // A row is being reordered, so keep this away from item sorting.
  event.preventDefault();
  event.stopPropagation();

  const sourceId = draggedEffect.value;
  const after = dropAfter.value;
  clearEffectDrag();
  if (sourceId === targetId) return;

  // Rebuild the full order from what's currently displayed, inserting above
  // or below the target based on where the cursor was released.
  const ids = effects.value.map(effect => effect._id).filter(id => id !== sourceId);
  const index = ids.indexOf(targetId);
  if (index < 0) return;
  ids.splice(after ? index + 1 : index, 0, sourceId);

  await saveEffectOrder(ids);
};

const onEffectDragEnd = () => clearEffectDrag();

const clearEffectDrag = () => {
  draggedEffect.value = null;
  dragOverEffect.value = null;
  dropAfter.value = false;
};

const saveEffectOrder = async (orderedIds) => {
  if (!canReorder.value) return;
  // Renumber every effect: only the sequence matters, and rewriting all of
  // them keeps the result deterministic regardless of what values were
  // written before. props.actor is a data clone; resolve the live document,
  // with the drag-data lookup as fallback.
  const actor = actorDocument ?? await getActor(props.actor);
  const updates = orderedIds.map((id, index) => ({_id: id, sort: (index + 1) * SORT_SPACING}));
  await actor?.updateEmbeddedDocuments('ActiveEffect', updates);
};
</script>

<style scoped lang="scss">
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
    color: var(--v3-text-muted);
  }

  // Row reordering feedback, matching the other v3 tabs: the dragged row
  // dims, the hovered row shows an insertion edge on the side the drop
  // would land.
  .effect-row--dragging {
    opacity: 0.5;
  }

  .effect-row--drop-above {
    box-shadow: inset 0 2px 0 var(--color-border);
  }

  .effect-row--drop-below {
    box-shadow: inset 0 -2px 0 var(--color-border);
  }
</style>
