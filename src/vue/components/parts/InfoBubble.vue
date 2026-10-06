<template>
	<span class="info-bubble" :data-tooltip="tooltip" :data-direction="direction ?? 'DOWN'">
		<span><i class="fa-regular fa-info-circle" /></span>
	</span>
</template>

<script setup>
defineProps(["tooltip", "direction"]);
</script>
