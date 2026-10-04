import { computed, ref } from 'vue';
import { saveSheetDisplayPref } from '@/methods/Helpers';

/**
 * Drag-to-reorder for the v3 tabs' group sections, shared by the action plan
 * and catalog tabs: each section's title drags, the sections highlight as
 * drop targets, and the drop rebuilds the display order around the release
 * point. The drag state is transient; the ordering persists to the actor
 * flag path given.
 *
 * The section styles key off the classPrefix, e.g. 'plan-group' makes
 * `plan-group--dragging` / `plan-group--drop-target`.
 *
 * @param {object} options
 * @param {Function} options.actor Accessor for the sheet's actor data (the
 *   context clone the flag is read from and the live document is resolved
 *   from).
 * @param {object} options.canReorder Computed: whether reordering is offered
 *   (the sheet is editable and the actor isn't a compendium entry).
 * @param {object} [options.canStart] Computed: whether a drag may begin;
 *   defaults to canReorder. The action plan pauses reordering while a text
 *   filter hides rows, since a drop on the filtered view would rebuild the
 *   saved order from a partial list.
 * @param {Function} options.getSections Accessor for the sections currently
 *   displayed, in display order, each with a `key`.
 * @param {string|Function} options.flagPath The actor flag path the order
 *   persists to; a function for paths that vary, e.g. per grouping mode.
 * @param {string} options.classPrefix CSS class prefix for the drag-feedback
 *   classes.
 *
 * @returns {object} The drag state and event handlers to wire the sections up
 *   with.
 */
export function useGroupReorder({ actor, canReorder, canStart = null, getSections, flagPath, classPrefix }) {
  const draggedGroup = ref(null);
  const dragOverGroup = ref(null);

  // The saved order, when one has been stored for the flag path; per-mode
  // paths (the catalog's) re-read as the mode changes.
  const savedGroupOrder = computed(() => {
    const path = typeof flagPath === 'function' ? flagPath() : flagPath;
    const stored = foundry.utils.getProperty(actor()?.flags?.archmage ?? {}, path);
    return Array.isArray(stored) ? stored : [];
  });

  /**
   * Classes for a group section, including drag feedback.
   */
  const groupClasses = (groupKey) => ({
    [`${classPrefix}--dragging`]: draggedGroup.value === groupKey,
    [`${classPrefix}--drop-target`]: dragOverGroup.value === groupKey,
  });

  const onGroupDragStart = (event, groupKey) => {
    if (!(canStart ?? canReorder).value) return;
    draggedGroup.value = groupKey;
    event.dataTransfer.effectAllowed = 'move';
    // Tag the payload so nothing downstream mistakes this for an item drag.
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'ArchmagePowerGroup',
      groupKey
    }));
    // Don't let the sheet's item drag handling see this.
    event.stopPropagation();
  };

  const onGroupDragOver = (event, groupKey) => {
    if (!draggedGroup.value) return;
    event.preventDefault();
    event.stopPropagation();
    dragOverGroup.value = groupKey === draggedGroup.value ? null : groupKey;
  };

  const onGroupDragLeave = (event, groupKey) => {
    if (dragOverGroup.value !== groupKey) return;
    // dragleave also fires when moving between children of the section, so
    // only clear the highlight once the cursor has actually left it.
    if (event.currentTarget.contains(event.relatedTarget)) return;
    dragOverGroup.value = null;
  };

  const onGroupDrop = async (event, groupKey) => {
    if (!draggedGroup.value) return;
    // A group is being reordered, so keep this away from item sorting.
    event.preventDefault();
    event.stopPropagation();

    const source = draggedGroup.value;
    draggedGroup.value = null;
    dragOverGroup.value = null;
    if (source === groupKey) return;

    // Rebuild the full order from what's currently displayed, dropping above
    // or below the target based on where the cursor was released.
    const order = getSections().map(g => g.key).filter(key => key !== source);
    const index = order.indexOf(groupKey);
    if (index < 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const before = (event.clientY - rect.top) < (rect.height / 2);
    order.splice(before ? index : index + 1, 0, source);

    await saveGroupOrder(order);
  };

  const onGroupDragEnd = () => {
    draggedGroup.value = null;
    dragOverGroup.value = null;
  };

  const saveGroupOrder = async (order) => {
    if (!canReorder.value) return;
    const path = typeof flagPath === 'function' ? flagPath() : flagPath;
    await saveSheetDisplayPref(actor(), path, order);
  };

  return {
    draggedGroup,
    dragOverGroup,
    savedGroupOrder,
    groupClasses,
    onGroupDragStart,
    onGroupDragOver,
    onGroupDragLeave,
    onGroupDrop,
    onGroupDragEnd,
  };
}
