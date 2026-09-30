<template>
  <section class="tab-catalog">
    <!-- Sorts and filters. -->
    <header class="catalog-filters flexrow">
      <div class="group-catalog">
        <label for="catalog-group">{{localize('ARCHMAGE.groupBy')}}</label>
        <select name="catalog-group" v-model="groupBy">
          <option v-for="option in groupOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.GROUPS.', option.value))}}</option>
        </select>
      </div>
      <div class="sort-catalog">
        <label for="catalog-sort">{{localize('ARCHMAGE.sort')}}</label>
        <select name="catalog-sort" v-model="sortBy">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{localize(concat('ARCHMAGE.SORTS.', option.value))}}</option>
        </select>
      </div>
      <div class="filter-search-catalog">
        <label for="catalog-filter">{{localize('ARCHMAGE.filter')}}</label>
        <input type="text" name="catalog-filter" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
      </div>
      <div class="import-catalog" v-if="canImport">
        <button type="button" class="catalog-import" :title="localize('ARCHMAGE.import')" @click="importPowers"><i class="fas fa-atlas"></i> {{localize('ARCHMAGE.import')}}</button>
      </div>
    </header>

    <section v-for="section in catalogSections" :key="section.key" class="catalog-group"
      :class="groupClasses(section.key)"
      @dragover="onGroupDragOver($event, section.key)"
      @dragleave="onGroupDragLeave($event, section.key)"
      @drop="onGroupDrop($event, section.key)">
      <h4 class="catalog-group-title unit-title"
        :draggable="canReorderGroups"
        @dragstart="onGroupDragStart($event, section.key)"
        @dragend="onGroupDragEnd">
        <i v-if="canReorderGroups" class="fas fa-grip-lines group-grip" :title="localize('ARCHMAGE.dragToReorderGroup')"></i>
        <span class="group-title-label">{{ localize(section.labelKey) }}</span>
        <a v-if="editable" class="group-add" :title="addTitle(section)" @click.stop="createGroupItem(section)"><i class="fas fa-plus"></i></a>
      </h4>
      <ul class="catalog-list flexcol">
        <template v-for="item in section.members" :key="item._id">
          <ExpandablePower v-if="section.kind === 'power'" :power="item" :actor="actor" :context="context"/>
          <ExpandableEquipment v-else-if="section.kind === 'equipment'" :equipment="item" :actor="actor" :context="context"/>
          <ExpandableLoot v-else :equipment="item" :actor="actor" :context="context"/>
        </template>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { concat, getActor, localize } from '@/methods/Helpers';
import ExpandablePower from '@/components/actor/character/v3/parts/expandable/ExpandablePower.vue';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';
import ExpandableLoot from '@/components/actor/character/v3/parts/expandable/ExpandableLoot.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Creation writes go through the real actor document; props.actor is a clone.
const actorDocument = inject('actorDocument');

// Powers are grouped by the selected mode; equipment and loot keep their own
// sections but share the ordering with the power groups.
const GROUP_MODES = {
  powerType: 'powerTypes',
  powerUsage: 'powerUsages',
  powerSource: 'powerSources',
};

const groupOptions = [
  { value: 'powerType' },
  { value: 'powerUsage' },
  { value: 'powerSource' },
  { value: 'group' },
];
const sortOptions = [
  { value: 'name' },
  { value: 'level' },
  { value: 'custom' },
];

// Grouping and sorting are persisted to the actor flag paths the v2 sheet
// uses, so both sheets agree; the sort falls back to 'custom' like v2 does,
// since drag-to-reorder writes item sort values that only that mode honors.
const displayFlags = computed(() => props.actor?.flags?.archmage?.sheetDisplay?.powers ?? {});
const groupBy = ref(displayFlags.value.groupBy?.value ?? 'powerType');
const sortBy = ref(displayFlags.value.sortBy?.value ?? 'custom');
const searchValue = ref(null);

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering itself persists to the actor flag shared with v2 (per groupBy
// mode) so the two sheets agree.
const draggedGroup = ref(null);
const dragOverGroup = ref(null);

// Group reordering is only offered when the sheet is editable and the actor
// isn't a compendium entry (where flags can't be written).
const canReorderGroups = computed(() => props.editable === true && !props.actor?.pack);

// The import button opens the power importer for the live actor. Like the v2
// sheet, non-GM users who turned it off in the character settings don't see it.
const canImport = computed(() =>
  !(props.actor?.flags?.archmage?.hideImportPowers === true && !game.user.isGM));

const importPowers = async () => {
  const actor = await getActor(props.actor);
  await game.archmage?.ArchmagePowerImporterApplication?.open(actor);
};

// Persist display preference changes through the live actor document;
// props.actor is a data clone whose flag updates wouldn't round-trip. Writing
// only when the stored value differs avoids a re-render loop from the update.
const saveDisplayPref = async (path, value) => {
  if (!canReorderGroups.value) return;
  const actor = await getActor(props.actor);
  const current = foundry.utils.getProperty(displayFlags.value, path);
  if (actor && current !== value) {
    await actor.setFlag('archmage', `sheetDisplay.powers.${path}`, value);
  }
};

watch(groupBy, value => saveDisplayPref('groupBy.value', value));
watch(sortBy, value => saveDisplayPref('sortBy.value', value));

const byName = (a, b) => a.name.localeCompare(b.name);
const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);

const TIER_ORDER = { adventurer: 0, champion: 1, epic: 2 };
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

const byLevel = (a, b) => {
  // Powers sort by level, equipment by tier, loot has no level so it falls
  // back to name.
  if (a.type === 'equipment') return byTier(a, b);
  if (['loot', 'tool'].includes(a.type)) return byName(a, b);
  return Number(a.system?.powerLevel?.value ?? 0) - Number(b.system?.powerLevel?.value ?? 0);
};

const sortFns = { name: byName, level: byLevel, custom: byCustom };

const matchesSearch = (item) => {
  const needle = (searchValue.value ?? '').trim().toLowerCase();
  if (!needle) return true;
  return (item.name ?? '').toLowerCase().includes(needle);
};

const catalogItems = (types) => (props.actor?.items ?? [])
  .filter(i => types.includes(i.type))
  .filter(matchesSearch)
  .sort(sortFns[sortBy.value] ?? byName);

const powers = computed(() => catalogItems(['power']));
const equipment = computed(() => catalogItems(['equipment']));
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const loot = computed(() => catalogItems(['loot', 'tool']));

/**
 * Clean a free-text group name for usage as a group key.
 */
const cleanGroupKey = (string) => string ? string.toLowerCase().replace(/[^a-zA-Z\d]/g, '') : '';

/**
 * Read an item's value for a built-in grouping mode, with fallbacks matching
 * the powers tab.
 */
const groupValue = (item, mode) => {
  let value = item.system?.[mode]?.value || 'other';
  // Override legacy 'maneuver' with 'flexible'.
  return value === 'maneuver' ? 'flexible' : value;
};

/**
 * Saved group order for the current groupBy mode. Each mode keeps its own
 * order so switching grouping doesn't clobber the others.
 */
const savedGroupOrder = computed(() => {
  const stored = props.actor?.flags?.archmage?.sheetDisplay?.powers?.groupOrder?.[groupBy.value];
  return Array.isArray(stored) ? stored : [];
});

/**
 * Apply the saved group order to a list of groups, with any group the saved
 * order doesn't know about appended in its natural spot.
 */
const orderedGroups = (groups) => {
  const order = savedGroupOrder.value;
  if (!order.length) return groups;
  const byKey = new Map(groups.map(g => [g.key, g]));
  return order.filter(key => byKey.has(key)).map(key => byKey.get(key))
    .concat(groups.filter(g => !order.includes(g.key)));
};

/**
 * Power groups for the current groupBy mode, in natural order: canonical
 * config order for built-in modes, first-appearance order for custom groups.
 * Groups are always shown, empty or not, so their "+" button has a home.
 * Each group is {key, labelKey, raw, kind, members}.
 */
const powerGroups = computed(() => {
  const items = powers.value;
  const configKey = GROUP_MODES[groupBy.value];

  if (configKey) {
    const mode = groupBy.value;
    const groups = [];
    for (const key of Object.keys(CONFIG.ARCHMAGE[configKey])) {
      const members = items.filter(i => groupValue(i, mode) === key);
      // powerType labels are pluralized keys, e.g. ARCHMAGE.talents.
      const labelKey = configKey === 'powerTypes' ? concat('ARCHMAGE.', key, 's') : concat('ARCHMAGE.', key);
      groups.push({ key, labelKey, kind: 'power', members });
    }
    return groups;
  }

  // Custom groups come from the item's free-text group field; ungrouped
  // powers collect under the default group, which is always shown so its
  // "+" can create the first power in an empty catalog. `raw` keeps the
  // group's display name for pre-filling new items.
  const groups = [];
  const byKey = new Map();
  for (const item of items) {
    const raw = item.system?.group?.value;
    const key = raw ? cleanGroupKey(raw) : 'power';
    if (!byKey.has(key)) {
      const group = { key, labelKey: raw || 'ARCHMAGE.power', raw: raw || '', kind: 'power', members: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).members.push(item);
  }
  if (!byKey.has('power')) {
    groups.push({ key: 'power', labelKey: 'ARCHMAGE.power', raw: '', kind: 'power', members: [] });
  }
  return groups;
});

// Keys for the inventory sections. The 'inventory-' prefix can't collide with
// a custom power group, whose key is a stripped copy of its free-text name.
const INVENTORY_SECTIONS = [
  { key: 'inventory-equipment', labelKey: 'ARCHMAGE.INVENTORY.equipment', kind: 'equipment', items: equipment },
  { key: 'inventory-loot', labelKey: 'ARCHMAGE.INVENTORY.loot', kind: 'loot', items: loot },
];

/**
 * Every catalog section in display order: the power groups for the current
 * groupBy mode, then the equipment and loot sections. Sections always show,
 * even when empty, so their "+" buttons can fill them.
 */
const catalogSections = computed(() => orderedGroups([
  ...powerGroups.value,
  ...INVENTORY_SECTIONS
    .map(({ key, labelKey, kind, items }) => ({ key, labelKey, kind, members: items.value })),
]));

/**
 * Classes for a group section, including drag feedback.
 */
const groupClasses = (groupKey) => ({
  'catalog-group--dragging': draggedGroup.value === groupKey,
  'catalog-group--drop-target': dragOverGroup.value === groupKey,
});

const onGroupDragStart = (event, groupKey) => {
  if (!canReorderGroups.value) return;
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
  const order = catalogSections.value.map(g => g.key).filter(key => key !== source);
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
  if (!canReorderGroups.value) return;
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  const actor = await getActor(props.actor);
  await actor?.setFlag('archmage', `sheetDisplay.powers.groupOrder.${groupBy.value}`, order);
};

/**
 * Title for a section's "+" button.
 */
const addTitle = (section) => game.i18n.format('ARCHMAGE.addToGroup', {
  group: localize(section.labelKey)
});

/**
 * Item data for a section's "+" button, pre-filled so the new item lands in
 * the group it was added from: built-in group modes set the mode's system
 * field (e.g. system.powerUsage.value), custom groups set the free-text group
 * (the default group leaves it empty), inventory sections just use their type.
 */
const groupCreateData = (section) => {
  if (section.kind !== 'power') return { type: section.kind, system: {} };
  if (groupBy.value === 'group') {
    return { type: 'power', system: section.raw ? { group: { value: section.raw } } : {} };
  }
  return { type: 'power', system: { [groupBy.value]: { value: section.key } } };
};

/**
 * Create a new item from a section's "+" button, named and imaged like the
 * v2 sheet's add buttons.
 */
const createGroupItem = async (section) => {
  if (!actorDocument) return;
  const { type, system } = groupCreateData(section);
  await actorDocument.createEmbeddedDocuments('Item', [{
    name: game.archmage.ArchmageUtility.formatNewItemName(type),
    type,
    img: CONFIG.ARCHMAGE.defaultTokens[type] ?? CONFIG.DEFAULT_TOKEN,
    system
  }]);
};
</script>

<style scoped lang="scss">
  .catalog-filters {
    font-family: $font-stack-label;
    font-size: $font-tiny;
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed $ct-border;

    > div {
      flex: 0 auto;

      + div {
        padding-left: $padding-sm;
        margin-left: $padding-sm;
      }

      &.filter-search-catalog {
        flex: 1;
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="text"] {
      font-size: $font-tiny;
      font-family: $font-stack-label;
      text-align: left;
      font-weight: normal;
    }
  }

  // Import button, aligned to the control row (no label above it).
  .import-catalog {
    align-self: flex-end;

    button {
      height: var(--input-height);
      font-size: var(--v3-font-size-tiny);
      border-radius: 3px;
      background: transparent;
    }
  }

  .catalog-group {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .catalog-group-title {
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;

    .group-title-label {
      flex: 1;
      text-align: left;
    }

    .group-add {
      cursor: pointer;
      font-size: var(--v3-font-size-xxs);

      &:hover {
        text-shadow: 0 0 5px var(--v3-hover-glow);
      }
    }

    // Group reordering affordances.
    &[draggable="true"] {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    &:hover .group-grip {
      opacity: 1;
    }
  }

  .group-grip {
    font-size: var(--v3-font-size-xxs);
    margin-right: $padding-sm;
    opacity: 0.35;
  }

  .catalog-group--dragging {
    opacity: 0.5;
  }

  .catalog-group--drop-target > .catalog-group-title {
    outline: 2px dashed;
    outline-offset: 2px;
    margin-left: 4px;
  }

  .catalog-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
