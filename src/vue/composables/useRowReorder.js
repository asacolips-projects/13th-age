import { computed, ref } from 'vue';
import { saveSheetDisplayPref } from '@/methods/Helpers';

// Shared drag-feedback classes for reorderable rows, styled by the v3
// drag-reorder SCSS partial: the dragged row dims, the hovered row shows an
// insertion edge on the side the drop would land.

/**
 * Drag-to-reorder for the v3 tabs' item rows, shared by the action plan,
 * loadout and effects tabs. The rows are the same draggable item rows the
 * sheet wires up for item drags, so their dragstart is left alone — arming
 * the item payload lets a drag out of the tab (to the hotbar, canvas or
 * another sheet) behave as usual — and only the drop is intercepted here.
 * Tabs whose rows are their own drags from the start (the effects tab) arm a
 * payload through `startDrag` instead.
 *
 * The order persists to the actor flag path given, keeping every other
 * group's entries and appending the reordered group's slice; a tab persisting
 * through something else (the effects tab writes the documents' sort values)
 * passes `persist` instead and reads no flag.
 *
 * @param {object} options
 * @param {Function} options.actor Accessor for the sheet's actor data (the
 *   context clone the saved order is read from and the live document is
 *   resolved from).
 * @param {object} options.canReorder Computed: whether reordering is offered
 *   (the sheet is editable and the actor isn't a compendium entry).
 * @param {object} [options.canStart] Computed: whether a drag may begin;
 *   defaults to canReorder. The action plan pauses reordering while a text
 *   filter hides rows, since a drop on the filtered view would rebuild the
 *   saved order from a partial list.
 * @param {string|null} [options.flagPath] The actor flag path the order
 *   persists to, e.g. 'sheetDisplay.actionPlan.rowOrder'. Null when persist
 *   is used.
 * @param {Function} [options.getRows] Accessor for a container's displayed
 *   rows, each with an `_id`: getRows(containerKey). Multi-list tabs only.
 * @param {Function} [options.rows] Accessor for every displayed row;
 *   single-list tabs (the effects tab) use this instead of getRows.
 * @param {Function} [options.persist] async (order) => void, replacing the
 *   flag write.
 * @param {Function} [options.startDrag] Hook for rows the tab wires up for
 *   drags itself: (event, containerKey, rowId), called once the drag state is
 *   recorded, to arm the payload and claim the drag.
 *
 * @returns {object} The drag state and event handlers to wire the rows up
 *   with.
 */
export function useRowReorder({
  actor,
  canReorder,
  canStart = null,
  flagPath = null,
  getRows = null,
  rows = null,
  persist = null,
  startDrag = null,
}) {
  const draggedRow = ref(null);
  const draggedContainer = ref(null);
  const dragOverRow = ref(null);
  const dropAfter = ref(false);

  // The saved order, when the rows persist to a flag.
  const savedRowOrder = computed(() => {
    if (!flagPath) return [];
    const stored = foundry.utils.getProperty(actor()?.flags?.archmage ?? {}, flagPath);
    return Array.isArray(stored) ? stored : [];
  });

  /**
   * Classes for an item row, including drag feedback.
   */
  const rowClasses = (rowId) => ({
    'v3-row--dragging': draggedRow.value === rowId,
    'v3-row--drop-above': dragOverRow.value === rowId && !dropAfter.value,
    'v3-row--drop-below': dragOverRow.value === rowId && dropAfter.value,
  });

  const onRowDragStart = (event, containerKey, rowId) => {
    if (!(canStart ?? canReorder).value) return;
    draggedRow.value = rowId;
    draggedContainer.value = containerKey;
    if (startDrag) startDrag(event, containerKey, rowId);
  };

  const onRowDragOver = (event, containerKey, rowId, forceAfter = false) => {
    if (!draggedRow.value) return;
    // A row drag stays ours end to end: keep it away from the sheet's item
    // sorting even over another group's rows, where the drop would be a no-op.
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (draggedContainer.value !== containerKey || rowId === draggedRow.value) return;
    if (forceAfter) {
      // The drop always lands after the target, e.g. the loadout's feat
      // block, which sits below its power row.
      dropAfter.value = true;
    }
    else {
      const rect = event.currentTarget.getBoundingClientRect();
      dropAfter.value = (event.clientY - rect.top) >= (rect.height / 2);
    }
    dragOverRow.value = rowId;
  };

  const onRowDragLeave = (event, rowId) => {
    if (dragOverRow.value !== rowId) return;
    // dragleave also fires when moving between the row's children, so only
    // clear the indicator once the cursor has actually left the row.
    if (event.currentTarget.contains(event.relatedTarget)) return;
    dragOverRow.value = null;
  };

  const onRowDrop = async (event, containerKey, targetId, forceAfter = null) => {
    if (!draggedRow.value) return;
    // A row is being reordered, so keep this away from item sorting.
    event.preventDefault();
    event.stopPropagation();

    const sourceId = draggedRow.value;
    const sourceContainer = draggedContainer.value;
    const after = forceAfter ?? dropAfter.value;
    clearRowDrag();
    // Cross-group drops do nothing: which group a row belongs to follows the
    // item's own data, which the tab doesn't edit. Single-list tabs pass the
    // same container key throughout, so the check passes trivially.
    if (sourceContainer !== containerKey || sourceId === targetId) return;

    await insertRow(containerKey, sourceId, targetId, after);
  };

  const onRowDragEnd = () => clearRowDrag();

  const clearRowDrag = () => {
    draggedRow.value = null;
    draggedContainer.value = null;
    dragOverRow.value = null;
    dropAfter.value = false;
  };

  /**
   * Rebuild a container's order from what's currently displayed, inserting
   * above or below the target based on where the cursor was released.
   */
  const insertRow = async (containerKey, sourceId, targetId, after) => {
    const displayed = displayedRows(containerKey);
    const rowIds = displayed.map(row => row._id);
    const order = rowIds.filter(id => id !== sourceId);
    const index = order.indexOf(targetId);
    if (index < 0) return;
    order.splice(after ? index + 1 : index, 0, sourceId);

    // Keep every other group's entries (pruning deleted items) and append this
    // group's slice: position within the flat array only matters relative to
    // an item's own group, since the order is applied per group. Tabs that
    // persist through something other than the flat flag read no saved order,
    // so nothing precedes the reordered slice.
    const containerIds = new Set(rowIds);
    const itemIds = new Set((actor()?.items ?? []).map(item => item._id));
    const rest = savedRowOrder.value.filter(id => !containerIds.has(id) && itemIds.has(id));
    await saveRowOrder([...rest, ...order]);
  };

  const saveRowOrder = async (order) => {
    if (!canReorder.value) return;
    if (persist) {
      await persist(order);
      return;
    }
    await saveSheetDisplayPref(actor(), flagPath, order);
  };

  const displayedRows = (containerKey) => getRows
    ? getRows(containerKey)
    : (rows?.() ?? []);

  return {
    draggedRow,
    draggedContainer,
    dragOverRow,
    dropAfter,
    savedRowOrder,
    rowClasses,
    onRowDragStart,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
    onRowDragEnd,
    clearRowDrag,
    insertRow,
    saveRowOrder,
  };
}
