<template>
	<li class="item power-item" :class="depth ? 'power-item--child' : ''">
		<!-- Clickable power header, matching the character sheet's rows. -->
		<!-- The trigger goes in a Foundry tooltip rather than the row's own
         hover box: that box is absolutely positioned inside the row,
         and so is fragmented by the multi-column list, which makes the
         columns rebalance the moment it appears. -->
		<PowerSummaryRow
			:power="row.power"
			:active="!!expanded[row.key]"
			:trigger="false"
			:data-tooltip="triggerTooltip"
			data-tooltip-direction="DOWN"
			@toggle="isPower && $emit('toggle-expanded', row.key)"
		>
			<template #image>
				<img :src="row.power.img" class="power-image" :alt="row.power.name">
			</template>
			<PowerFeatPips v-if="isPower && hasFeats(row.power)" :feats="row.power.system.feats" />
			<div v-if="row.power.system.actionType?.value" class="power-action">{{ getActionShort(row.power.system.actionType.value) }}</div>
			<div v-if="row.power.system.recharge?.value && ['recharge', 'recharge-desperate'].includes(row.power.system.powerUsage?.value)" class="power-recharge">{{ Number(row.power.system.recharge.value) || 16 }}+</div>
			<div class="item-controls power-import-select">
				<label :data-tooltip="localize('ARCHMAGE.importSubmit')" @click.stop>
					<input type="checkbox" :checked="selection.includes(row.key)" @change="$emit('toggle-selection', row)">
				</label>
			</div>
		</PowerSummaryRow>
		<!-- Expanded power content. -->
		<div v-if="isPower" class="power-content" :class="expanded[row.key] ? 'active' : ''">
			<Transition name="slide-fade">
				<Power
					v-if="expanded[row.key]"
					:power="row.power"
					:actor="false"
					:context="context"
					:all-levels="true"
					:feats-active="true"
				/>
			</Transition>
		</div>
		<!-- What this power grants, which comes along with it. -->
		<ul v-if="row.children.length" class="power-import-children">
			<PowerImporterRow
				v-for="child in row.children"
				:key="child.key"
				:row="child"
				:context="context"
				:selection="selection"
				:expanded="expanded"
				:depth="depth + 1"
				@toggle-selection="$emit('toggle-selection', $event)"
				@toggle-expanded="$emit('toggle-expanded', $event)"
			/>
		</ul>
	</li>
</template>

<script>
/**
 * One importable power, and the powers it grants below it.
 */
import { getActionShort, hasFeats, localize } from "@/methods/Helpers";
import Power from "@/components/parts/Power.vue";
import PowerFeatPips from "@/components/parts/PowerFeatPips.vue";
import PowerSummaryRow from "@/components/parts/PowerSummaryRow.vue";

export default {
	name: "PowerImporterRow",
	components: {
		Power,
		PowerFeatPips,
		PowerSummaryRow
	},
	props: {
		row: { type: Object, required: true },
		context: { type: Object, required: true },
		selection: { type: Array, required: true },
		// Which rows have been expanded to show their text, keyed by row key.
		expanded: { type: Object, required: true },
		depth: { type: Number, default: 0 }
	},
	emits: ["toggle-selection", "toggle-expanded"],
	setup() {
		return {
			getActionShort,
			hasFeats,
			localize
		};
	},
	computed: {
		// Children can be other kinds of item, which have no power text to show.
		isPower() {
			return this.row.power.type === "power";
		},
		/**
		 * The power's trigger text, as tooltip markup, or undefined for powers
		 * without one, and for powers already expanded to show their full text.
		 * Foundry renders tooltips in its own layer at the root of the document, so
		 * this costs the list no layout.
		 */
		triggerTooltip() {
			const trigger = this.row.power.system.trigger?.value;
			if (!trigger || this.expanded[this.row.key]) return undefined;
			const escaped = trigger.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
			return `<p style="text-align: left; margin: 0;"><strong>${localize("ARCHMAGE.CHAT.trigger")}:</strong> ${escaped}</p>`;
		}
	}
};
</script>
