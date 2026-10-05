<template>
	<!-- Drops anywhere in here are handled by the sheet's _onDropChild(). -->
	<fieldset class="item-children">
		<legend>{{ localize('ARCHMAGE.ITEM.children') }}</legend>
		<p class="hint">{{ localize('ARCHMAGE.ITEM.childrenHint') }}</p>
		<ul v-if="context.children?.length" class="item-children-list">
			<li v-for="child in context.children" :key="child.uuid" :class="`item-child flexrow${child.missing ? ' item-child--missing' : ''}`">
				<img :src="child.img" class="item-child-image" :alt="child.name">
				<a v-if="!child.missing" class="item-child-name" data-action="openChild" :data-uuid="child.uuid">{{ child.name }}</a>
				<span v-else class="item-child-name" :data-tooltip="child.uuid">{{ child.name }}</span>
				<span class="item-child-type">{{ child.type }}</span>
				<a
					v-if="context.editable"
					class="item-control item-child-remove"
					data-action="removeChild"
					:data-uuid="child.uuid"
					:data-tooltip="localize('ARCHMAGE.ITEM.removeChild')"
				><i class="fas fa-trash" /></a>
			</li>
		</ul>
		<p v-else class="item-children-empty">{{ localize('ARCHMAGE.ITEM.childrenEmpty') }}</p>
	</fieldset>
</template>

<script setup>
/**
 * The items an item brings along with it (`system.children`), resolved by the
 * sheet into `context.children`.
 */
import { localize } from "@/methods/Helpers";

defineProps(["context"]);
</script>
