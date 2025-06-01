<template>
  <div class="prose-mirror-wrapper" v-html="editable ? field.element.outerHTML : field.enriched"></div>
</template>

<script setup>
const props = defineProps(['field', 'editable']);
</script>