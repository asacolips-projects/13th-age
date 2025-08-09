<template>
	<fieldset class="fieldset-description">
		<legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>
		<Prosemirror :editable="context.editable" :field="context.editors['document.description.value']" />
	</fieldset>


	<div class="form-group">
		<label>{{ localize("EFFECT.FIELDS.disabled.label") }}</label>
		<input type="checkbox" v-model="effect.disabled" />
	</div>

	<div class="form-group" v-if="effect.isActorEffect">
		<label>{{ localize("EFFECT.FIELDS.origin.label") }}</label>
		<div class="form-fields">
			<input type="text" name="origin" v-model="effect.origin" />
		</div>
	</div>

	<div class="form-group">
		<label>{{ localize("ARCHMAGE.ITEM.stacksAlways") }}</label>
		<input type="checkbox" v-model="effect.flags.archmage.stacksAlways" />
	</div>

	<div class="form-group">
		<label>{{ localize("EFFECT.TABS.duration") }}</label>
		<div class="form-fields">
			<select name="duration" v-model="effect.flags.archmage.duration">
          <option value="">{{ localize('ARCHMAGE.noneOption') }}</option>
				<option v-for="(label, value) in CONFIG.ARCHMAGE.effectDurationTypes" :key="value" :value="value">
					{{ localize(label) }}
				</option>
			</select>
		</div>
	</div>
</template>

<script setup>
import { localize } from '@/methods/Helpers';
import {
  Prosemirror,
  InfoBubble,
} from '@/components';

const props = defineProps(['effect', 'context']);
const { effect } = props;
</script>
