<template>
	<fieldset class="fieldset-description">
		<legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>

		<Prosemirror :editable="context.editable" :field="context.editors['system.description.value']" />

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

		<!-- @todo add support for uses to actions, some NPCs have limited use actions. -->

		<!-- <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesRemaining') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesRemainingHint')"/>
      </label>
      <div class="field">
        <input type="number" name="system.quantity.value"
          v-model="item.system.quantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesMax') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesMaxHint')"/>
      </label>
      <div class="field">
        <input type="number" name="system.maxQuantity.value"
          v-model="item.system.maxQuantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div> -->
	</fieldset>

	<fieldset class="fieldset-special">
		<legend>{{ game.i18n.localize('ARCHMAGE.SETTINGS.groups.automation') }}</legend>

		<div class="form-group stacked power-macro-editor">
			<label>{{ game.i18n.localize('ARCHMAGE.CHAT.embeddedMacro') }}</label>
			<div class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.macroEditorHint')" />
			<div class="field">
				<CodemirrorWrapper
					class="attribute-value"
					name="system.embeddedMacro.value"
					:value="item.system.embeddedMacro.value"
				/>
			</div>
		</div>
	</fieldset>

	<fieldset v-if="context.sequencerEnabled" class="fieldset-sequencer">
		<legend>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencer') }}</legend>
		<p class="hint">{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerDesc') }}</p>

		<div class="form-group stacked">
			<label>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerSelf') }}</label>
			<div class="field">
				<input
					v-model="item.system.sequencer.self"
					type="text"
					name="system.sequencer.self"
					placeholder="Ex: modules/JB2A_DnD5e/Library/Generic/UI/IconSnowflake_01_Regular_Blue_200x200.webm"
				>
			</div>
		</div>

		<div class="form-group stacked">
			<label>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerRay') }}</label>
			<div class="field">
				<input
					v-model="item.system.sequencer.ray"
					type="text"
					name="system.sequencer.ray"
					placeholder="Ex: modules/JB2A_DnD5e/Library/Cantrip/Ray_Of_Frost/RayOfFrost_01_Regular_Blue_30ft_1600x400.webm"
				>
			</div>
		</div>

		<div class="form-group stacked">
			<label>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerTarget') }}</label>
			<div class="field">
				<input
					v-model="item.system.sequencer.target"
					type="text"
					name="system.sequencer.target"
					placeholder="Ex: modules/JB2A_DnD5e/Library/Generic/Explosion/Explosion_04_Regular_Blue_400x400.webm"
				>
			</div>
		</div>

		<div class="form-group">
			<label>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerReverse') }}</label>
			<div class="field">
				<input
					v-model="item.system.sequencer.reversed"
					type="checkbox"
					name="system.sequencer.reversed"
				>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import {
	CodemirrorWrapper,
	Prosemirror,
	InfoBubble
} from "@/components";
defineProps(["item", "context"]);
</script>
