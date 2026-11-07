<template>
	<fieldset class="fieldset-description">
		<legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>
		<Prosemirror :editable="context.editable" :field="context.editors['system.description.value']" />
	</fieldset>

	<fieldset class="fieldset-details">
		<legend>{{ game.i18n.localize('ARCHMAGE.details') }}</legend>

		<!-- quantity -->
		<div class="form-group">
			<label>
				{{ game.i18n.localize('ARCHMAGE.ITEM.quantity') }}
			</label>
			<div class="field">
				<input
					v-model="item.system.quantity.value"
					type="number"
					name="system.quantity.value"
					:placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
				>
			</div>
		</div>

		<!-- price -->
		<div class="form-group">
			<label>
				{{ game.i18n.localize('ARCHMAGE.ITEM.price') }}
			</label>
			<div class="field">
				<input
					v-model="item.system.price.value"
					type="text"
					name="system.price.value"
					:placeholder="game.i18n.localize('ARCHMAGE.ITEM.pricePlaceholder')"
				>
			</div>
		</div>

		<!-- group -->
		<div class="form-group">
			<label>
				{{ game.i18n.localize('ARCHMAGE.CHAT.group') }}
				<InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.groupTitle')" />
			</label>
			<div class="field">
				<input
					v-model="item.system.group.value"
					type="text"
					name="system.group.value"
				>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import {
	Prosemirror,
	InfoBubble
} from "@/components";
defineProps(["item", "context"]);
</script>
