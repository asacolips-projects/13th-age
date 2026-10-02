<template>
  <ExpandableItem :item="power" :base-class="baseClass">
    <template #summary="{active, toggle}">
      <!-- Clickable power header, laid out on the columns this listing passes in. -->
      <PowerSummaryRow :power="power" :actor="actor" :active="active" :trigger="trigger"
        :style="{ gridTemplateColumns: columns }" @toggle="toggle">
        <!-- The portrait, which activates the power; .stop keeps the click from
             also reaching the sheet's delegated roll listener. -->
        <template #image>
          <RollableV3 :overlay="true" @click.stop="activatePower">
            <img :src="power.img" class="power-image"/>
          </RollableV3>
        </template>
        <!-- The header cells after the name, defaulting to the catalog row's
             feat pips, action, recharge, uses and controls. -->
        <slot name="cells" :toggle="toggle">
          <!-- The feat tiers as display-only letters: bright when taken, dim
               when not. A feat's taken state is toggled from its row in the
               expanded details. -->
          <div class="power-feat-pips" v-if="hasFeats(power)" :data-tooltip="localize('ARCHMAGE.feats')">
            <ul class="feat-letters">
              <li v-for="{key, letter, active} in featLetters(power)" :key="key"
                :class="{active}">{{letter}}</li>
            </ul>
          </div>
          <div class="power-action" v-if="power.system.actionType.value">{{getActionShort(power.system.actionType.value)}}</div>
          <div class="power-recharge" v-if="power.system.recharge.value && ['recharge', 'recharge-desperate'].includes(power.system.powerUsage.value)">
            <Rollable name="recharge" type="recharge" :opt="power._id">{{Number(power.system.recharge.value) || 16}}+</Rollable>
          </div>
          <div class="power-uses">
            <span v-if="power.system.quantity.value !== null" class="power-uses-primary" :data-item-id="power._id" :data-quantity="power.system.quantity.value"
              @click.stop="changeQuantity(actor, power._id)" @contextmenu.stop.prevent="changeQuantity(actor, power._id, false)">{{power.system.quantity.value}}</span>
            <template v-if="hasSecondaryUsage(power)">
              <span v-if="power.system.quantity.value !== null" class="power-uses-separator">-</span>
              <span class="power-uses-secondary" :data-item-id="power._id" :data-quantity="power.system.quantitySecondary.value"
                @click.stop="changeQuantity(actor, power._id, true, true)" @contextmenu.stop.prevent="changeQuantity(actor, power._id, false, true)">{{power.system.quantitySecondary.value}}</span>
            </template>
          </div>
          <div class="item-controls">
            <a class="item-control item-edit" :data-item-id="power._id" @click.stop="editItem(actor, power._id)"><i class="fas fa-edit"></i></a>
            <a class="item-control item-delete" :data-item-id="power._id" @click.stop="deleteItem(actor, power._id, $event.shiftKey)"><i class="fas fa-trash"></i></a>
          </div>
        </slot>
      </PowerSummaryRow>
    </template>
    <!-- Expanded power details, defaulting to the full item view. -->
    <template #content="{active}">
      <slot name="details" :active="active">
        <Power v-if="active" :power="power" :actor="actor" :context="context"/>
      </slot>
    </template>
  </ExpandableItem>
</template>

<script setup>
/**
 * The common power-row anatomy behind the listings that share it: an
 * ExpandableItem whose summary is a PowerSummaryRow — portrait, name, then
 * the header cells — and whose expanded body is the power's details.
 *
 * Everything about the row's layout, sizing and roll wiring is standardised
 * here. A listing differs only in the columns its header shows: those come
 * in through `columns`, the cells through the `cells` slot (defaulting to
 * the catalog row's) and the expanded body through the `details` slot
 * (defaulting to the full item view).
 */
import { inject } from 'vue';
import { changeQuantity, deleteItem, editItem, filterFeats, getActionShort, hasFeats, hasSecondaryUsage, localize, TIERS } from '@/methods/Helpers';
import ExpandableItem from './ExpandableItem.vue';
import Power from '@/components/parts/Power.vue';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';
import Rollable from '@/components/parts/Rollable.vue';
import RollableV3 from '@/components/actor/character/v3/RollableV3.vue';

const props = defineProps({
  power: {type: Object, required: true},
  actor: {type: [Object, Boolean], default: null},
  context: {type: Object, default: null},
  // Names the item kind for ExpandableItem's wrapper classes.
  baseClass: {type: String, default: 'power'},
  // The header's grid-template-columns, the one thing that differs between
  // listings.
  columns: {type: String, required: true},
  // Whether the trigger reads as a hover tooltip; listings that give the
  // trigger a cell of its own turn this off.
  trigger: {type: Boolean, default: true},
});

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument', null);

/**
 * Each of the power's feats as its tier letter plus its taken state, in tier
 * order: A for adventurer, C for champion, E for epic, Z for zenith.
 */
function featLetters(power) {
  return Object.entries(filterFeats(power.system.feats))
    .map(([key, feat]) => ({
      key,
      letter: TIERS.find(tier => tier.key === feat.tier?.value)?.letter ?? '',
      active: feat.isActive?.value ?? false,
    }));
}

/**
 * Activate the power: its roll() runs the usage dialog, spends uses and
 * resources, and posts the card to chat.
 */
function activatePower() {
  actorDocument?.items?.get(props.power._id)?.roll();
}
</script>

<style scoped lang="scss">
// The summary row's shared grid: typography, the cell centring, the
// portrait's size and the standard cells' column assignments. The column
// template itself arrives inline from the `columns` prop, since that is what
// differs between listings. The name cell is PowerSummaryRow's, hence :deep()
// there; the other cells are slotted, from here or the caller, and carry the
// scope that defined them.
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
    width: 25px;
    height: 25px;
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
    font-family: $font-stack-label;
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

// The expanded power details. Power.vue ships no styles of its own: the V2
// sheet dresses it through .archmage-v2.sheet .power in the SCSS bundle
// (components/character/_powers.scss), which the V3 sheet root never matches.
// Mirror those rules here so the expanded body reads as it does on the V2
// sheet, right down to the base typography the V2 root supplies there. The
// .power root is slot content rendered from this component, so it carries
// this scope; everything inside belongs to Power.vue, hence :deep() below.
.power {
  font-family: $font-stack-base;
  font-size: var(--font-size-14);
  line-height: 1.3;
  padding: 0 0 $padding-md 0;

  // The quick facts line, its entries separated by middots.
  :deep(.power-subheader) {
    justify-content: flex-start;

    > * {
      flex: 0 1 auto;
      padding-right: 12px;
      position: relative;

      + * {
        &::before {
          display: block;
          content: '·';
          position: absolute;
          top: 0;
          bottom: 0;
          left: -8px;
          margin: auto;
        }
      }
    }
  }

  :deep(.power-details),
  :deep(.power-feats) {
    p {
      margin: 0;

      + p {
        margin-top: $padding-md;
      }
    }
  }

  :deep(.power-header),
  :deep(.power-details) {
    margin: $padding-sm $padding-md;
  }

  :deep(.power-detail-label) {
    margin-right: $padding-sm;
  }

  :deep(.power-detail-value),
  :deep(.power-detail-content) {
    > * {
      padding-left: $padding-md;
    }

    > ul {
      padding: 0 0 0 1.5em;
      margin-left: 1em;
    }

    > .expression {
      padding-left: 0;
    }
  }

  :deep(.feat-uses) {
    flex: 0 0 32px;
  }

  :deep(.power-detail--description) {
    margin: $padding-md 0;

    .power-detail-value {
      > * {
        padding-left: 0;
      }
    }
  }

  // Untaken feats read muted; taken ones at full strength.
  :deep(.power-feat) {
    background: $c-feat;
    margin-bottom: 2px;
    opacity: 0.25;
    padding: $padding-sm $padding-md;

    &.active {
      opacity: 1;
    }
  }
}
</style>
