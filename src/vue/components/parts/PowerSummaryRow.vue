<template>
  <component :is="tag" :class="classes">
    <!-- Portrait, which rolls the power. -->
    <slot name="image">
      <Rollable v-if="image" name="item" :hide-icon="true" type="item" :opt="power._id">
        <img :src="power.img" class="power-image"/>
      </Rollable>
    </slot>
    <!-- Name, which expands the power. -->
    <slot name="name">
      <a class="power-name" :data-item-id="power._id" @click="$emit('toggle', power._id)">
        <h3 class="power-title unit-subtitle"><span v-if="power.system.powerLevel?.value">[{{power.system.powerLevel.value}}] </span>{{power.name}}</h3>
      </a>
    </slot>
    <!-- Whichever cells the caller wants after the name. -->
    <slot/>
    <!-- Trigger text. The stylesheet reveals this on hover. -->
    <div v-if="showTriggerTooltip" class="power-trigger power-trigger-tooltip">
      <strong>{{localize('ARCHMAGE.CHAT.trigger')}}:</strong> {{power.system.trigger.value}}
    </div>
  </component>
</template>

<script setup>
/**
 * One row of a power listing: its colour, its portrait and its name.
 *
 * Used by the powers tab, the triggers tab, the compendium browser and the item
 * sheet's preview, which each add their own trailing cells through the default
 * slot but agree on what a power row is and how it's coloured.
 */
import { computed } from 'vue';
import Rollable from '@/components/parts/Rollable.vue';
import { localize, powerAvailabilityClass, powerUsageClass } from '@/methods/Helpers';

const props = defineProps({
  power: {type: Object, required: true},
  // Needed to colour cyclic powers, which follow the escalation die.
  actor: {type: [Object, Boolean], default: null},
  // For callers holding the escalation die without an actor to read it from.
  escalationDie: {type: Number, default: null},
  // Element to render as. The compendium browser's rows are list items.
  tag: {type: String, default: 'div'},
  // The grid the cells lay out on. The triggers tab uses its own.
  gridClass: {type: String, default: 'grid power-grid'},
  // Any further classes the caller needs on the row.
  rowClass: {type: String, default: ''},
  // Whether to show the power's portrait.
  image: {type: Boolean, default: true},
  // Whether the power's body is expanded below the row.
  active: {type: Boolean, default: false},
  // Whether a power's trigger is shown as a tooltip on the row. Listings that
  // give the trigger a cell of its own turn this off.
  trigger: {type: Boolean, default: true},
});

defineEmits(['toggle']);

const showTriggerTooltip = computed(() => props.trigger && !!props.power.system.trigger?.value);

const classes = computed(() => [
  'power-summary',
  props.gridClass,
  powerUsageClass(props.power, props.actor, {escalationDie: props.escalationDie}),
  powerAvailabilityClass(props.power),
  showTriggerTooltip.value ? 'power-summary--trigger' : '',
  props.active ? 'active' : '',
  props.rowClass,
].filter(Boolean).join(' '));
</script>
