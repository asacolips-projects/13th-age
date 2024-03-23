<template>
	<section :class="classes">
		<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTERSETTINGS.settings')}}</h2>
		<section class="sheet-settings grid grid-2col">
			<!-- Flag Settings -->
			<div class="unit unit--flags">
				<div v-for="(flag, f) in flags" :key="f" :data-key="f" class="settings-flags">
					<label :for="concat('flags.archmage.', f)" class="unit-subtitle flexrow"><input type="checkbox" :name="concat('flags.archmage.', f, )" v-model="flag.value"> {{flag.name}}</label>
					<p class="notes">{{flag.hint}}</p>
				</div>
			</div>
		</section>
	</section>
</template>

<script>
import { concat, localize } from "@/methods/Helpers";
export default {
	name: "NpcSettings",
	props: ["actor", "owner", "tab"],
	setup() {
		return {
			concat,
			localize
		};
	},
	computed: {
		flags() {
			let flags = CONFIG.Actor.npcFlags;
			let charFlags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
			for (let [k, v] of Object.entries(flags)) {
				v.value = charFlags && charFlags[k] ? charFlags[k] : null;
				flags[k] = v;
			}
			return flags;
		},
		classes() {
			return `section section--settings flexcol`;
		},
		overrides() {
			return Object.keys(this.actor.overrides);
		}
	},
	methods: { /* See created. */},
	async mounted() {}
};
</script>
