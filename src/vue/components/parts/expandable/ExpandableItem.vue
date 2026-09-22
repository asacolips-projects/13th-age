<template>
  <li :class="concat('item ', baseClass, '-item ', baseClass, '-item--', item._id)" :data-item-id="item._id" data-document-class="Item" data-draggable="true" draggable="true">
    <!-- Clickable summary header. -->
    <slot name="summary" :active="active" :toggle="toggle"/>
    <!-- Expanded content. -->
    <div :class="concat(baseClass, '-content', (active ? ' active' : ''))">
      <Transition name="slide-fade">
        <slot name="content" :active="active"/>
      </Transition>
    </div>
  </li>
</template>

<script setup>
/**
 * One expandable item row: a clickable summary line and the item's full
 * details, which slide open beneath it. Owns its own expanded/collapsed
 * state, keyed to the item by the caller's v-for key.
 *
 * The summary line and the expanded body are provided through slots since
 * they differ per listing. `baseClass` names the item kind so the row gets
 * the matching wrapper classes, e.g. `power` -> `power-item--<id>` and
 * `power-content`.
 */
import { ref } from 'vue';
import { concat } from '@/methods/Helpers';

defineProps({
  item: {type: Object, required: true},
  baseClass: {type: String, required: true},
});

const active = ref(false);

const toggle = () => {
  active.value = !active.value;
};
</script>

<style scoped lang="scss">
// The row wrapper keeps a positioning context for the summary's hover
// title and tooltip, and the content pane clips the slide-fade transition.
// The kind-specific classes are built from the baseClass prop, whose two
// values in use are 'power' and 'equipment'.
.power-item,
.equipment-item {
  position: relative;
}

.power-content,
.equipment-content {
  overflow: hidden;
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
