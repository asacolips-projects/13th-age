<template>
	<div :class="'tab ' + tab.key + (tab.active ? ' active' : '') + (tab.leaving ? ' leaving' : '') + (classes ? ' ' + classes : '')" :data-group="group" :data-tab="tab.key">
		<slot />
	</div>
</template>

<script>
export default {
	name: "Tab",
	props: ["context", "actor", "tab", "group", "classes"]
};
</script>

<style lang="scss">

</style>
