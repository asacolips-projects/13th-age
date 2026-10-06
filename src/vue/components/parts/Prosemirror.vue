<template>
	<div class="prose-mirror-wrapper" v-html="editable ? field.element.outerHTML : field.enriched" />
</template>

<script setup>
defineProps(["field", "editable"]);
</script>
