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
        <div class="search-catalog-input">
          <input type="text" name="catalog-filter" v-model="searchValue" :placeholder="localize('ARCHMAGE.filterName')"/>
          <button v-if="searchValue" type="button" class="search-catalog-clear" :title="localize('ARCHMAGE.clear')" @click="clearSearch"><i class="fas fa-times"></i></button>
        </div>
      </div>
      <div class="import-catalog" v-if="canImport">
        <button type="button" class="catalog-import" :class="{ 'catalog-import--pulse': isEmptyCharacter }" :disabled="missingKinClass" :data-tooltip="importTooltip" @click="importPowers"><i class="fas fa-atlas"></i> {{localize('ARCHMAGE.import')}}</button>
      </div>
    </header>

    <!-- Sections are the reorderable groups; the currency group renders its
         coin purses in place of an item list. -->
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
        <a v-if="editable && section.kind !== 'currency'" class="group-add" :title="addTitle(section)" @click.stop="createGroupItem(section)"><i class="fas fa-plus"></i></a>
      </h4>
      <!-- Coin purses, matching the v2 inventory tab; the named inputs
           persist via the sheet's submitOnChange, like the resource units
           in the stats header. -->
      <div v-if="section.kind === 'currency'" class="catalog-currency flexrow">
        <div v-for="type in CURRENCY" :key="type" :class="concat('currency-unit currency-unit-', type)">
          <label :for="concat('catalog-coin-', type)">{{localize(concat('ARCHMAGE.COINS.', type))}}</label>
          <input type="number" :id="concat('catalog-coin-', type)" :name="concat('system.coins.', type, '.value')" v-model="coins[type].value" placeholder="0">
        </div>
      </div>
      <ul v-else class="catalog-list flexcol">
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
import { concat, equipmentBonuses, getActor, localize } from '@/methods/Helpers';
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

// The filter box's clear widget; resetting to null also hides the button.
const clearSearch = () => {
  searchValue.value = null;
};

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

// The importer builds its tabs from the character's kin and class, so with
// neither set it would just silently do nothing; the button disables itself
// with an explanatory tooltip instead.
const missingKinClass = computed(() => {
  const details = props.actor?.system?.details ?? {};
  return !details.race?.value && !details.class?.value;
});

const kinLabel = computed(() =>
  game.settings.get('archmage', 'secondEdition') === true ? localize('ARCHMAGE.kin') : localize('ARCHMAGE.race'));

const importTooltip = computed(() => missingKinClass.value
  ? game.i18n.format('ARCHMAGE.importNeedsKinClass', { kin: kinLabel.value })
  : localize('ARCHMAGE.import'));

// The button pulses while the character has no items, advertising where a
// new character's powers come from.
const isEmptyCharacter = computed(() => (props.actor?.items ?? []).length === 0);

// Coin purses edited in place, like the v2 inventory tab's currency strip;
// the character settings flag hides the whole row. The named inputs persist
// through the sheet's submitOnChange, like the stats header's resource units.
const CURRENCY = ['platinum', 'gold', 'silver', 'copper'];
const showCurrency = computed(() => props.actor?.flags?.archmage?.hideCurrency !== true);
const coins = computed(() => props.actor?.system?.coins ?? {});

// The character settings flag shared with the v2 powers tab; when set, empty
// power groups collapse instead of staying visible for their "+" button.
const hideEmptyPowerGroups = computed(() => props.actor?.flags?.archmage?.hideEmptyPowerGroups === true);

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

// Strip enriched-HTML markup so descriptions index as plain text; searching
// raw HTML would match tag names and miss matches split across tags.
const stripHtml = (text) => text.replace(/<[^>]+>/g, '');

// Searchable text for an item: what the v2 inventory tab matches (name,
// chakra, equipment's bonus keys and values) plus the fields only the
// expanded row shows — every type's description, a power's custom group and
// its feats' text.
const searchText = (item) => {
  let text = `${item.name ?? ''}${item.system?.chackra ?? ''}`;
  if (item.type === 'equipment') {
    const bonuses = equipmentBonuses(item);
    for (const [key, value] of Object.entries(bonuses)) {
      text = `${text}${key}${value}`;
    }
  }
  text += item.system?.description?.value ?? '';
  if (item.type === 'power') {
    text += item.system?.group?.value ?? '';
    for (const feat of Object.values(item.system?.feats ?? {})) {
      text += feat.description?.value ?? '';
    }
  }
  return stripHtml(text);
};

const matchesSearch = (item) => {
  // Both sides are stripped to alphanumerics like the v2 inventory filter, so
  // punctuation and spacing don't need to match exactly.
  const needle = cleanGroupKey(searchValue.value ?? '');
  if (!needle) return true;
  return cleanGroupKey(searchText(item)).includes(needle);
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
 * Empty groups are trimmed at display time when the hideEmptyPowerGroups
 * flag is set. Each group is {key, labelKey, raw, kind, members}.
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

// The currency group holds the coin purse inputs rather than items; it is
// gated by the hideCurrency flag and defaults to the end of the catalog.
const CURRENCY_SECTION = {
  key: 'inventory-currency',
  labelKey: 'ARCHMAGE.INVENTORY.currency',
  kind: 'currency',
  members: [],
};

/**
 * Every catalog section in display order: the power groups for the current
 * groupBy mode, then the equipment and loot sections, then the currency
 * group. With the hideEmptyPowerGroups flag set, empty power groups drop out
 * — except when every power group is empty, where the first one stays so its
 * "+" button still has a home — matching the v2 powers tab. Inventory
 * sections always show so their "+" buttons can fill them. Currency is a
 * draggable group like the rest, so its position persists alongside them in
 * the per-mode group order flag.
 */
const catalogSections = computed(() => {
  const sections = [
    ...powerGroups.value,
    ...INVENTORY_SECTIONS
      .map(({ key, labelKey, kind, items }) => ({ key, labelKey, kind, members: items.value })),
    ...(showCurrency.value ? [CURRENCY_SECTION] : []),
  ];
  const visible = hideEmptyPowerGroups.value
    ? sections.filter(section => section.kind !== 'power' || section.members.length > 0)
    : sections;
  if (hideEmptyPowerGroups.value && !visible.some(section => section.kind === 'power')) {
    const first = sections.find(section => section.kind === 'power');
    if (first) visible.push(first);
  }
  return orderedGroups(visible);
});

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
    font-size: var(--font-size-10);
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed var(--color-border);

    > div {
      flex: 0 auto;

      + div {
        padding-left: $padding-sm;
        margin-left: $padding-sm;
      }

      &.filter-search-catalog {
        flex: 1;

        // Clear widget sits at the input's right edge, inside it.
        .search-catalog-input {
          position: relative;

          input[type="text"] {
            width: 100%;
            padding-right: 1.5em;
          }

          .search-catalog-clear {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            cursor: pointer;
            color: inherit;
            font-size: var(--font-size-12);
            line-height: 1;

            &:hover {
              text-shadow: 0 0 5px var(--v3-hover-glow);
            }
          }
        }
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="text"] {
      font-size: var(--font-size-10);
      font-family: $font-stack-label;
      text-align: left;
      font-weight: normal;
    }
  }

  // Coin purses, styled like the filter controls (label above slim input).
  // Units share the row evenly; gold/silver/copper copy the v2 sheet's
  // denomination text colors (platinum keeps the default color there too).
  .catalog-currency {
    gap: 2em;

    > div {
      text-align: center;

      &.currency-unit-gold {
        color: #efc44a;
      }

      &.currency-unit-silver {
        color: #888;
      }

      &.currency-unit-copper {
        color: #c17a58;
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="number"] {
      font-weight: bold;
      text-align: center;
    }
  }

  // Import button, aligned to the control row (no label above it).
  .import-catalog {
    align-self: flex-end;

    button {
      height: var(--input-height);
      font-size: var(--font-size-12);
      border-radius: 3px;
      background: transparent;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      // Empty-catalog attention pulse, same accent as the identity fields'
      // (charms even while disabled — the tooltip explains why).
      &.catalog-import--pulse {
        animation: v3-empty-pulse 2s ease-in-out infinite;
      }
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
      font-size: var(--font-size-14);

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
    font-size: var(--font-size-14);
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

  /* Empty-field attention pulse (shared look with the identity fields). */
  @keyframes v3-empty-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 transparent;
    }
    50% {
      box-shadow: 0 0 0 2px var(--v3-hint);
    }
  }
</style>
