<template>
  <div :class="'tab ' + tab.key + (tab.active ? ' active' : '')" :data-group="group" :data-tab="tab.key">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'Tab',
  props: ['context', 'actor', 'tab', 'group'],
  computed: {}
}
</script>

<style scoped>

</style>