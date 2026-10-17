<template>
	<section :class="`section section--tabs section--tabs-${group} flexshrink`">
		<!-- <input type="hidden" :name="concat('flags.archmage.sheetDisplay.tabs.', group, '.value')" v-model="currentTab"/> -->
		<button v-if="hamburger" :class="`sheet-tabs-toggle sheet-tabs-toggle--${group}`" @click="toggleMenu">
			<i class="fas fa-bars" /><span class="visually-hidden"> Toggle Navigation</span>
		</button>
		<nav :class="`sheet-tabs tabs tabs--${group}`" :data-group="group">
			<template v-if="noSpan">
				<template v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`">
					<a
						v-if="!tab.hidden"
						:class="getTabClass(tab, tabKey)"
						:data-tab="tabKey"
						:data-tooltip="tab.hideLabel ? tab.label : undefined"
						data-tooltip-direction="UP"
						@click="changeTab"
					>
						<i v-if="tab.icon" :class="concat('fas ', tab.icon)" />
						<span v-if="!tab.hideLabel">{{ tab.label }}</span>
					</a>
				</template>
			</template>
			<template v-else>
				<span v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`" :data-tooltip="tab.hideLabel ? tab.label : undefined" data-tooltip-direction="UP">
					<a
						v-if="!tab.hidden"
						:class="getTabClass(tab, tabKey)"
						:data-tab="tabKey"
						@click="changeTab"
						@click.right="popOut"
					>
						<i v-if="tab.icon" :class="concat('fas ', tab.icon)" />
						<span v-if="!tab.hideLabel">{{ tab.label }}</span>
					</a>
				</span>
			</template>
		</nav>
	</section>
</template>

<script>
import { concat, getActor } from "@/methods/Helpers";
import { toRaw } from "vue";
export default {
	name: "Tabs",
	props: ["context", "actor", "group", "tabs", "flags", "hamburger", "no-span"],
	emits: ["change"],
	setup() {
		return { concat };
	},
	data() {
		return {
			currentTab: "details"
		};
	},
	async mounted() {
		// Attempt to get the current tab from sheet flags.
		const flagTab = this.flags?.sheetDisplay?.tabs[this.group]?.value;
		// Otherwise, attempt to get the current tab from the first active tab.
		const rawTabs = toRaw(this.tabs);
		this.currentTab = flagTab ?? (Object.values(rawTabs).find((t) => t.active)?.key ?? "details");
		// If the tab is hidden, default to the first visible one.
		if (this.tabs[this.currentTab]?.hidden) {
			this.currentTab = Object.values(rawTabs).find((t) => !t.hidden)?.key ?? "details";
		}
		this.changeTab(false);
	},
	methods: {
		changeTab(event) {
			// If this was a click, update the default tab and tell the parent
			// where the change came from, so it can run transitions. The
			// mounted() restore below passes no event and stays silent.
			if (event && event.currentTarget) {
				const from = this.currentTab;
				this.currentTab = event.currentTarget.dataset.tab;
				this.$emit("change", { from, to: this.currentTab });
			}

			// Update the tab displays.
			for (let k of Object.keys(this.tabs)) {
				this.tabs[k].active = false;
			}

			// Update the active tab display.
			if (this.tabs[this.currentTab]) {
				this.tabs[this.currentTab].active = true;
			}

			// Update the flag.
			if (typeof this.actor !== "undefined" && !this.actor.pack) {
				getActor(this.actor).then((actor) => {
					actor.setFlag("archmage", `sheetDisplay.tabs.${this.group}.value`, this.currentTab);
				});
			}
			// Close the mobile menu if open. We also need a click listener in the actor sheet class
			// to close it as well, ideally.
			const menu = event?.target?.closest(".section--tabs")?.querySelector(".sheet-tabs");
			if (menu) {
				menu.classList.remove("active");
			}
		},
		async popOut(event) {
			const tab = this.tabs[event.currentTarget.dataset.tab];
			if (tab.componentClass) {
				const actor = await getActor(this.actor);
				new CONFIG.ARCHMAGE.ActorTabFocusSheet(tab.componentClass, actor).render(true);
			}
		},
		toggleMenu(event) {
			const target = event.target;
			const menu = target?.closest(".section--tabs")?.querySelector(".sheet-tabs");
			if (menu) {
				menu.classList.toggle("active");
			}
		},
		getTabClass(tab, index) {
			return `tab-link tab-link--${index}${tab.active ? " active": ""}`;
		}
	}
};
</script>

<style lang="scss">

</style>
