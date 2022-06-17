<template>
  <div :class="'tab ' + tab.key + (tab.active ? ' active' : '')" :data-group="group" :data-tab="tab.key">
    <slot></slot>
  </div>
</template>

<script setup>
  defineProps({
    context: Object,
    actor: Object,
    tab: Object,
    group: String
  });
</script>

<style scoped>

</style>