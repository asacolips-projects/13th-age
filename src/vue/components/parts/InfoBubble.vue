<template>
  <span class="info-bubble" :data-tooltip="tooltip" :data-direction="direction ?? 'DOWN'">
    <span><i class="fa-regular fa-info-circle"></i></span>
  </span>
</template>

<script setup>
  const props = defineProps(['tooltip', 'direction'])
</script>