<template>
	<section class="section section--resources flexrow flexshrink" :data-resource-count="resourceCount" :data-custom-count="customResourceCount">
		<!-- Command Points -->
		<section v-if="actor.system.resources.perCombat.commandPoints?.enabled" class="unit unit--command-points">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints')}}</h2>
			<div class="resource flexrow">
				<div class="resource--left">
					<input type="number" name="system.resources.perCombat.commandPoints.current" v-model="commandPoints">
				</div>
				<div class="resource--right flexcol">
					<!-- TODO: Add support for epic feat to bump to d6. -->
					<a class="rollable rollable--command rollable--command-4" data-roll-type="command" data-roll-opt="d4">d4</a>
					<a class="rollable rollable--command rollable--command-3" data-roll-type="command" data-roll-opt="d3">d3</a>
				</div>
			</div>
		</section>
		<!-- Ki -->
		<section v-if="actor.system.resources.spendable.ki?.enabled" class="unit unit--has-max unit--ki">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.ki')}}</h2>
			<Progress name="ki" :current="actor.system.resources.spendable.ki.current" :max="actor.system.resources.spendable.ki.max"/>
			<div class="resource flexrow">
				<input type="number" name="system.resources.spendable.ki.current" class="resource-current" v-model="ki.current">
				<span class="resource-separator">/</span>
				<input type="number" name="system.resources.spendable.ki.max" class="resource-max" v-model="ki.max">
			</div>
		</section>
		<!-- Focus -->
		<section v-if="actor.system.resources.perCombat.focus?.enabled" class="unit unit--focus">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.focus')}}</h2>
			<div class="resource flexrow">
				<input type="checkbox" name="system.resources.perCombat.focus.current" v-model="focus">
			</div>
		</section>
		<!-- Momentum -->
		<section v-if="actor.system.resources.perCombat.momentum?.enabled" class="unit unit--momentum">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.momentum')}}</h2>
			<div class="resource flexrow">
				<input type="checkbox" name="system.resources.perCombat.momentum.current" v-model="momentum">
			</div>
		</section>
		<!-- Combat Rhythm -->
		<section v-if="actor.system.resources.perCombat.rhythm?.enabled && secondEdition" class="unit unit--rhythm">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHARACTER.RESOURCES.rhythm')}}</h2>
			<div class="resource flexrow">
				<select name="system.resources.perCombat.rhythm.current" v-model="rhythm">
					<option value="none">{{localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.none')}}</option>
					<option value="offense">{{localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense')}}</option>
					<option value="defense">{{localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense')}}</option>
				</select>
			</div>
		</section>
		<!-- Disengage -->
		<section class="unit unit--disengage" :data-tooltip="tooltip('pcEngagement')">
			<h2 class="unit-title">{{localize('ARCHMAGE.SAVE.disengage')}}</h2>
			<div class="resource flexcol">
				<a class="rollable rollable--disengage disengage-value" data-roll-type="save" data-roll-opt="disengage">{{disengage.value}}+</a>
				<div class="disengage-bonus flexrow">
					<span class="disengage-label">{{localize('ARCHMAGE.bonus')}}</span>
					<input type="number" name="system.attributes.disengageBonus" class="disengage-bonus" v-model="disengage.bonus">
				</div>
			</div>
		</section>
		<!-- Rests -->
		<section class="unit unit--rest">
			<h2 class="unit-title">{{localize('ARCHMAGE.CHAT.Rests')}}</h2>
			<div class="resource flexcol">
				<button type="button" class="rest rest--quick" data-rest-type="quick" :data-tooltip="tooltip('pcRestQuick')"><i class="fas fa-campground"></i> {{localize('ARCHMAGE.CHAT.QuickRest')}}</button>
				<button type="button" class="rest rest--full" data-rest-type="full" :data-tooltip="tooltip('pcRestFull')"><i class="fas fa-bed"></i> {{localize('ARCHMAGE.CHAT.FullHeal')}}</button>
			</div>
		</section>
		<div class="resource-divider" v-if="(resourceCount > 1 && customResourceCount > 0) || customResourceCount > 1"></div>
		<!-- Custom Resouces -->
		<section v-for="(resource, index) in customResources" :key="index" class="unit unit--custom">
			<input type="text" :name="concat('system.resources.spendable.', index, '.label')" class="resource-title-input" v-model="resource.label"/>
			<Progress :name="index" :current="resource.current" :max="resource.max"/>
			<div class="resource flexrow">
				<input type="number" :name="concat('system.resources.spendable.', index, '.current')" class="resource-current" v-model="resource.current">
				<span class="resource-separator">/</span>
				<input type="number" :name="concat('system.resources.spendable.', index, '.max')" class="resource-max" v-model="resource.max">
			</div>
		</section>
	</section>
</template>

<script>
import { concat, localize, tooltip } from "@/methods/Helpers";
import Progress from "@/components/parts/Progress.vue";
export default {
	name: "CharResources",
	props: ["actor"],
	setup() {
		return {
			concat,
			localize,
			tooltip
		};
	},
	components: {
		Progress
	},
	data() {
		return {
			commandPoints: 0,
			momentum: false,
			focus: false,
			ki: {
				value: 0,
				max: 0
			},
			disengage: {
				value: 11,
				bonus: 0
			},
			rhythm: "none"
		};
	},
	computed: {
		customResources() {
			let resources = {};
			for (let [k, v] of Object.entries(this.actor.system.resources.spendable)) {
				if (v.secondEdition && !game.settings.get("archmage", "secondEdition")) continue;
				if (k.includes("custom") && v.enabled) resources[k] = v;
			}
			return resources;
		},
		secondEdition() {
			return game.settings.get("archmage", "secondEdition") === true;
		},
		resourceCount() {
			let count = 0;
			if (this.actor.system.resources.perCombat.commandPoints.enabled) count++;
			if (this.actor.system.resources.spendable.ki.enabled) count++;
			if (this.actor.system.resources.perCombat.focus.enabled) count++;
			if (this.actor.system.resources.perCombat.momentum.enabled) count++;
			if (game.settings.get("archmage", "secondEdition")) {
				if (this.actor.system.resources.perCombat.rhythm.enabled) count++;
			}
			return count;
		},
		customResourceCount() {
			let arr = Object.keys(this.customResources);
			return arr && arr.length ? arr.length : 0;
		}
	},
	methods: {
		updateResourceProps() {
			this.commandPoints = this.actor.system.resources.perCombat.commandPoints.current;
			this.momentum = this.actor.system.resources.perCombat.momentum.current;
			this.focus = this.actor.system.resources.perCombat.focus.current;
			this.ki = this.actor.system.resources.spendable.ki;
			if (game.settings.get("archmage", "secondEdition")) {
				this.rhythm = this.actor.system.resources.perCombat.rhythm.current;
			}
			this.disengage = {
				value: this.actor.system.attributes.disengage,
				bonus: this.actor.system.attributes.disengageBonus
			};
		}
	},
	watch: {
		"actor.system.resources": {
			deep: true,
			handler() {
				this.updateResourceProps();
			}
		},
		"actor.system.attributes": {
			deep: true,
			handler() {
				this.updateResourceProps();
			}
		}
	},
	async mounted() {
		this.updateResourceProps();
	}
};
</script>
