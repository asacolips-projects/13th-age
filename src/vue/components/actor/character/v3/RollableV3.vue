<template>
  <a class="rollable" :class="modifiers"><slot></slot></a>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Modifier hook, e.g. 'save' or 'recovery' (renders .rollable--save).
  name: { type: String, default: '' },
  // Suppress the die icon when the link shows other visual content.
  hideIcon: { type: Boolean, default: false }
});

const modifiers = computed(() => [
  props.name ? `rollable--${props.name}` : '',
  props.hideIcon ? 'hide-icon' : ''
]);
</script>

<!-- Local styles: the shared V2 rollable styles are nested under .archmage-v2
     in the SCSS bundle, which the V3 sheet root (.archmage-v3-vue) doesn't
     have, so the die icon and hover behavior live here. -->
<style scoped lang="scss">
.rollable {
  position: relative;
  transition: all ease-in-out 0.1s;
  cursor: pointer;

  &::before {
    @include fa-icon;
    content: fa-content($fa-var-dice-d20);
    margin-right: $padding-sm;
    color: $c-blue;
  }

  &:hover {
    color: $c-blue;
    text-shadow: 0 0 5px $c-blue--50;
  }

  &.hide-icon::before {
    display: none;
  }
}
</style>
