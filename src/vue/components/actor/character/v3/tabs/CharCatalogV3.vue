<template>
  <section class="tab-catalog">
    <!-- Sorts and filters. -->
    <SortFilterBarV3 id="catalog" :sort-options="sortOptions" v-model:sort="sortBy" v-model:search="searchValue">
      <div class="group-catalog">
        <label for="catalog-group">{{localize('ARCHMAGE.groupBy')}}</label>
        <select name="catalog-group" v-model="groupBy">
          <option v-for="option in groupOptions" :key="option.value" :value="option.value">{{localize(`ARCHMAGE.GROUPS.${option.value}`)}}</option>
        </select>
      </div>
      <div class="import-catalog" v-if="canImport">
        <button type="button" class="catalog-import" :class="{ 'catalog-import--pulse': isEmptyCharacter }" :disabled="missingKinClass" :data-tooltip="importTooltip" @click="importPowers"><i class="fas fa-atlas"></i> {{localize('ARCHMAGE.import')}}</button>
      </div>
    </SortFilterBarV3>

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
          <label :for="concat('catalog-coin-', type)">{{localize(`ARCHMAGE.COINS.${type}`)}}</label>
          <input type="number" :id="concat('catalog-coin-', type)" :name="concat('system.coins.', type, '.value')" v-model="coins[type].value" placeholder="0">
        </div>
      </div>
      <ul v-else class="catalog-list flexcol">
        <ExpandableRowV3 v-for="item in section.members" :key="item._id" :item="item" :actor="actor" :context="context"/>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue';
import { byLevel as byPowerLevel, byName, cleanFilterKey, concat, equipmentBonuses, getActor, isSecondEdition, localize, orderedGroups, saveSheetDisplayPref, TIER_ORDER } from '@/methods/Helpers';
import { useGroupReorder } from '@/composables/useGroupReorder';
import { useSearchFilter } from '@/composables/useSearchFilter';
import SortFilterBarV3 from '@/components/actor/character/v3/parts/SortFilterBarV3.vue';
import ExpandableRowV3 from '@/components/actor/character/v3/parts/ExpandableRowV3.vue';

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

// Searchable text for an item: what the v2 inventory tab matches (name,
// chakra, equipment's bonus keys and values) plus the fields only the
// expanded row shows — every type's description, a power's custom group and
// its feats' text.
const { searchValue, matchesSearch } = useSearchFilter(item => {
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
  return text;
});

// Group reordering is only offered when the sheet is editable and the actor
// isn't a compendium entry (where flags can't be written).
const canReorderGroups = computed(() => props.editable === true && !props.actor?.pack);

// Group reordering, mirroring the v2 powers tab. The drag state is transient;
// the ordering itself persists to the actor flag shared with v2 (per groupBy
// mode) so the two sheets agree.
const {
  savedGroupOrder,
  groupClasses, onGroupDragStart, onGroupDragOver, onGroupDragLeave, onGroupDrop, onGroupDragEnd,
} = useGroupReorder({
  actor: () => props.actor,
  canReorder: canReorderGroups,
  flagPath: () => `sheetDisplay.powers.groupOrder.${groupBy.value}`,
  getSections: () => catalogSections.value,
  classPrefix: 'catalog-group',
});

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
  isSecondEdition() ? localize('ARCHMAGE.kin') : localize('ARCHMAGE.race'));

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
  await game.archmage?.ArchmagePowerImporterApplication?.show(actor);
};

watch(groupBy, value => {
  if (!canReorderGroups.value) return;
  saveSheetDisplayPref(props.actor, 'sheetDisplay.powers.groupBy.value', value);
});
watch(sortBy, value => {
  if (!canReorderGroups.value) return;
  saveSheetDisplayPref(props.actor, 'sheetDisplay.powers.sortBy.value', value);
});

const byCustom = (a, b) => (a.sort || 0) - (b.sort || 0);

const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

const byLevel = (a, b) => {
  // Powers sort by level, equipment by tier, loot has no level so it falls
  // back to name.
  if (a.type === 'equipment') return byTier(a, b);
  if (['loot', 'tool'].includes(a.type)) return byName(a, b);
  return byPowerLevel(a, b);
};

const sortFns = { name: byName, level: byLevel, custom: byCustom };

const catalogItems = (types) => (props.actor?.items ?? [])
  .filter(i => types.includes(i.type))
  .filter(matchesSearch)
  .sort(sortFns[sortBy.value] ?? byName);

const powers = computed(() => catalogItems(['power']));
const equipment = computed(() => catalogItems(['equipment']));
// Legacy 'tool' items are catalogued as loot, matching the inventory tab.
const loot = computed(() => catalogItems(['loot', 'tool']));

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
      const labelKey = configKey === 'powerTypes' ? `ARCHMAGE.${key}s` : `ARCHMAGE.${key}`;
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
    const key = raw ? cleanFilterKey(raw) : 'power';
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
  return orderedGroups(visible, savedGroupOrder.value);
});

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
  // The group-by control slotted into the shared sort/filter bar: styled
  // like the bar's own controls, whose scoped rules don't reach slot content.
  .group-catalog {
    flex: 0 auto;

    label {
      display: block;
      width: 100%;
      font-weight: bold;
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

  // Import button, slotted into the shared sort/filter bar and aligned to
  // the control row (no label above it).
  .import-catalog {
    flex: 0 auto;
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
