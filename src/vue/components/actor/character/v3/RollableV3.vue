<template>
  <a class="rollable" :class="modifiers"><slot></slot></a>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Modifier hook, e.g. 'save' or 'recovery' (renders .rollable--save).
  name: { type: String, default: '' },
  // Suppress the die icon when the link shows other visual content.
  hideIcon: { type: Boolean, default: false },
  // Centre the die icon over the slotted image; the two crossfade on hover.
  overlay: { type: Boolean, default: false }
});

const modifiers = computed(() => [
  props.name ? `rollable--${props.name}` : '',
  props.hideIcon ? 'hide-icon' : '',
  props.overlay ? 'overlay' : ''
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
    color: var(--v3-rollable);
  }

  &:hover {
    color: var(--v3-rollable);
    text-shadow: 0 0 5px var(--v3-rollable-glow);
  }

  &.hide-icon::before {
    display: none;
  }

  // Overlay mode: the die icon is centred over the slotted image and the two
  // crossfade on hover, the V2 .power-summary .rollable--item treatment. The
  // image is slotted content, hence :deep().
  &.overlay {
    color: var(--c-white);

    &::before {
      margin: auto;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      line-height: 1;
      // Four-fifths of the portrait, the ratio the V2 power rows use.
      font-size: $font-md;
      width: $font-md;
      height: $font-md;
      display: block;
      opacity: 0;
      transition: all ease-in-out 0.25s;
    }

    :deep(img) {
      transition: all ease-in-out 0.25s;
    }

    &:hover {
      color: var(--c-white);
      text-shadow: 0 0 10px var(--c-white);

      &::before {
        opacity: 1;
      }

      :deep(img) {
        opacity: 0;
      }
    }
  }
}
</style>
