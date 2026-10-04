<template>
  <li :class="concat('item ', kindClass, '-item ', kindClass, '-item--', item._id)" :data-item-id="item._id" data-document-class="Item" data-draggable="true" draggable="true">
    <!-- Clickable summary header, laid out on the columns this listing passes in. -->
    <PowerSummaryRow v-if="isPower" :power="item" :actor="actor" :active="active" :trigger="trigger"
      :style="{ gridTemplateColumns: columns }" @toggle="toggle">
      <!-- The portrait, which activates the power; .stop keeps the click from
           also reaching the sheet's delegated roll listener. -->
      <template #image>
        <RollableV3 :overlay="true" @click.stop="activateItem">
          <img :src="item.img" class="power-image"/>
        </RollableV3>
      </template>
      <!-- The header cells after the name, defaulting to the catalog row's
           feat letters, action, recharge, uses and controls. -->
      <slot name="cells" :toggle="toggle">
        <!-- The feat tiers as display-only letters: bright when taken, dim
             when not. A feat's taken state is toggled from its row in the
             expanded details. -->
        <div class="power-feat-pips" v-if="hasFeats(item)" :data-tooltip="localize('ARCHMAGE.feats')">
          <ul class="feat-letters">
            <li v-for="{key, letter, taken} in featLetters(item)" :key="key"
              :class="{active: taken}">{{letter}}</li>
          </ul>
        </div>
        <div class="power-action" v-if="item.system.actionType.value">{{getActionShort(item.system.actionType.value)}}</div>
        <div class="power-recharge" v-if="item.system.recharge.value && ['recharge', 'recharge-desperate'].includes(item.system.powerUsage.value)">
          <Rollable name="recharge" type="recharge" :opt="item._id">{{Number(item.system.recharge.value) || 16}}+</Rollable>
        </div>
        <div class="power-uses">
          <span v-if="item.system.quantity.value !== null" class="power-uses-primary" :data-item-id="item._id" :data-quantity="item.system.quantity.value"
            @click.stop="changeQuantity(actor, item._id)" @contextmenu.stop.prevent="changeQuantity(actor, item._id, false)">{{item.system.quantity.value}}</span>
          <template v-if="hasSecondaryUsage(item)">
            <span v-if="item.system.quantity.value !== null" class="power-uses-separator">-</span>
            <span class="power-uses-secondary" :data-item-id="item._id" :data-quantity="item.system.quantitySecondary.value"
              @click.stop="changeQuantity(actor, item._id, true, true)" @contextmenu.stop.prevent="changeQuantity(actor, item._id, false, true)">{{item.system.quantitySecondary.value}}</span>
          </template>
        </div>
        <div class="item-controls">
          <a class="item-control item-edit" :data-item-id="item._id" @click.stop="editItem(actor, item._id)"><i class="fas fa-edit"></i></a>
          <a class="item-control item-delete" :data-item-id="item._id" @click.stop="deleteItem(actor, item._id, $event.shiftKey)"><i class="fas fa-trash"></i></a>
        </div>
      </slot>
    </PowerSummaryRow>
    <!-- Equipment and loot share their summary row: whichever cells the item
         has data for, the active pip exclusive to equipment items. -->
    <EquipmentSummaryRow v-else :equipment="item" :actor="actor" @toggle="toggle"/>
    <!-- Expanded content. -->
    <div :class="concat(kindClass, '-content', (active ? ' active' : ''))">
      <Transition name="slide-fade">
        <PowerDetailsV3 v-if="active && isPower" :power="item" :actor="actor" :context="context" :show-feats="showFeats"/>
        <EquipmentDetailsV3 v-else-if="active && item.type === 'equipment'" :equipment="item" :actor="actor" :context="context"/>
        <LootDetailsV3 v-else-if="active" :equipment="item" :actor="actor" :context="context"/>
      </Transition>
    </div>
  </li>
</template>

<script setup>
/**
 * One expandable item row: a clickable summary line and the item's full
 * details, which slide open beneath it. Owns its own expanded/collapsed
 * state, keyed to the item by the caller's v-for key, and covers every item
 * kind the listings show: powers, equipment, loot (and legacy tools), laid
 * out per kind from the item's type — the catalog grid with feat letters,
 * action, recharge, uses and controls for powers, the inventory grid for the
 * rest — and expanding to the kind's V3 read view.
 *
 * The row owns its own interactions — activating, editing, deleting and
 * spending uses (the equipment pip's toggle lives in its summary row) —
 * resolving the actor document from the actor data the sheet passes down, so
 * listings need only hand the item in.
 * A listing differs only in the columns its header shows: those come in
 * through `columns`, and further header cells through the `cells` slot (the
 * triggers tab's trigger text).
 *
 * `baseClass` names the item kind so the row gets the matching wrapper
 * classes, e.g. `trigger` -> `trigger-item--<id>` and `trigger-content`. It
 * defaults from the item's type, whose wrapper classes the styles enumerate.
 */
import { computed, inject, ref } from 'vue';
import { changeQuantity, concat, deleteItem, editItem, filterFeats, getActionShort, hasFeats, hasSecondaryUsage, localize, TIERS } from '@/methods/Helpers';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';
import Rollable from '@/components/parts/Rollable.vue';
import EquipmentSummaryRow from './EquipmentSummaryRow.vue';
import EquipmentDetailsV3 from './EquipmentDetailsV3.vue';
import LootDetailsV3 from './LootDetailsV3.vue';
import PowerDetailsV3 from './PowerDetailsV3.vue';
import RollableV3 from '../RollableV3.vue';

const props = defineProps({
  item: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  context: {type: Object, default: null},
  // Names the item kind for the wrapper classes. Defaults from the item's
  // type: powers read as `power`, the other kinds share the equipment
  // row's classes.
  baseClass: {type: String, default: null},
  // The summary's grid-template-columns, the one thing that differs between
  // the power listings. Equipment rows lay out on their own grid.
  columns: {type: String, default: '32px auto 36px 44px 60px 44px 64px'},
  // Whether the trigger reads as a hover tooltip; listings that give the
  // trigger a cell of its own turn this off.
  trigger: {type: Boolean, default: true},
  // The feats section at the bottom of the expanded power details; the
  // loadout tab renders the feats as rows of their own beneath the power's
  // row instead.
  showFeats: {type: Boolean, default: true},
});

const isPower = computed(() => props.item.type === 'power');

const kindClass = computed(() =>
  props.baseClass ?? (isPower.value ? 'power' : 'equipment'));

const active = ref(false);

const toggle = () => {
  active.value = !active.value;
};

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument', null);

/**
 * Activate the item: its roll() runs the usage dialog, spends uses and
 * resources, and posts the card to chat.
 */
function activateItem() {
  actorDocument?.items?.get(props.item._id)?.roll();
}

/**
 * Each of the power's feats as its tier letter plus its taken state, in tier
 * order: A for adventurer, C for champion, E for epic, Z for zenith.
 */
function featLetters(power) {
  return Object.entries(filterFeats(power.system.feats))
    .map(([key, feat]) => ({
      key,
      letter: TIERS.find(tier => tier.key === feat.tier?.value)?.letter ?? '',
      taken: feat.isActive?.value ?? false,
    }));
}
</script>

<style scoped lang="scss">
// The row wrapper keeps a positioning context for the summary's hover
// title and tooltip, and the content pane clips the slide-fade transition.
// The kind-specific classes are built from the `baseClass` prop, whose
// values in use are 'power', 'equipment' and 'trigger'; the tab-side styles
// reach the rows through these same classes.
.power-item,
.equipment-item,
.feat-item,
.trigger-item {
  position: relative;
}

.power-content,
.equipment-content,
.feat-content,
.trigger-content {
  overflow: hidden;
}

// The power summary row's shared grid: typography, the cell centring, the
// portrait's size and the standard cells' column assignments. The column
// template itself arrives inline from the `columns` prop, since that is what
// differs between listings. The name cell is PowerSummaryRow's, hence
// :deep() there; the other cells are slotted, from here or the caller, and
// carry the scope that defined them.
.power-grid {
  gap: 2px;
  font-size: var(--font-size-12);
  font-family: var(--v3-font-label);
  text-align: center;

  > :deep(*) {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  :deep(.power-name) {
    grid-column-start: 2;
    text-align: left;
    justify-content: flex-start;
  }

  // The portrait, kept inside the standard 32px column.
  .power-image {
    width: var(--font-size-28);
    height: var(--font-size-28);
    object-fit: cover;
    border-radius: 0.25rem;
  }

  .power-feat-pips { grid-column-start: 3; }
  .power-action { grid-column-start: 4; }
  .power-recharge { grid-column-start: 5; }
  .power-uses { grid-column-start: 6; }
  .item-controls { grid-column-start: 7; }
  .item-control { width: 28px; }
}

// The feat tier letters: one glyph per feat, bright when taken, dim
// otherwise, in the spirit of the V2 sheet's feat pips.
.feat-letters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style-type: none;

  li {
    font-family: var(--v3-font-label);
    text-transform: uppercase;
    opacity: 0.35;

    &.active {
      opacity: 1;
    }
  }
}

// The uses column holds one counter per pool, separated by a dash.
.power-uses {
  gap: 1px;

  .power-uses-separator {
    opacity: 0.6;
  }
}

// Left-click spends a use, right-click restores one.
.power-uses-primary,
.power-uses-secondary {
  cursor: pointer;
}

.item-control {
  cursor: pointer;
}
</style>

<style>
/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.slide-fade-enter-active {
  transition: all 0.2s ease-in-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-60%);
}
</style>
