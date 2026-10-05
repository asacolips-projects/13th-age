<template>
	<div :class="`archmage-appv2-vue flexcol`">
		<!-- Header -->
		<header class="sheet-header">
			<img
				class="profile-img"
				:src="context.item.img"
				data-edit="img"
				data-action="onEditImage"
				:title="context.item.name"
				height="100"
				width="100"
			>
			<div class="header-fields flexrow">
				<button class="item-roll flexshrink" @click="itemDocument.roll()"><i class="fas fa-dice-d20" /><span class="visually-hidden"> Send to Chat</span></button>
				<input v-model="context.item.name" type="text" name="name">
			</div>
		</header>

		<div class="section--main">
			<section class="section--fields has-preview">
				<!-- Tab links -->
				<Tabs :tabs="tabs.primary" no-span="true" />

				<!-- Details fields -->
				<Tab group="primary" :tab="tabs.primary.details">
					<PowerDetails :item="context.item" :context="context" />
				</Tab>

				<!-- Details fields -->
				<Tab group="primary" :tab="tabs.primary.attack">
					<PowerAttack :item="context.item" :context="context" />
				</Tab>

				<!-- Spell Fields -->
				<Tab group="primary" :tab="tabs.primary.special">
					<PowerSpells :item="context.item" :context="context" />
				</Tab>

				<!-- Feats -->
				<Tab group="primary" :tab="tabs.primary.feats">
					<PowerFeats :item="context.item" :context="context" />
				</Tab>

				<!-- Active Effect Fields -->
				<Tab group="primary" :tab="tabs.primary.effects">
					<fieldset class="section--effects">
						<legend>{{ game.i18n.localize('ARCHMAGE.activeEffects') }}</legend>
						<p class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.activeEffectsItemHint')" />
						<div class="archmage-v2 sheet">
							<section class="section--powers">
								<CharEffects :key="context._renderKey" :actor="context.item" />
							</section>
						</div>
					</fieldset>
				</Tab>

				<!-- Included items -->
				<Tab group="primary" :tab="tabs.primary.children">
					<ItemChildren :context="context" />
				</Tab>
			</section>

			<fieldset class="section--preview">
				<legend>{{ game.i18n.localize('Preview') }}</legend>
				<div class="archmage-v2 sheet">
					<section class="section--powers">
						<Power
							:power="context.item"
							:actor="context.actor"
							:context="context"
							include-title="true"
							:feats-active="true"
							:enriched="context.editors"
						/>
					</section>
				</div>
			</fieldset>
		</div>
	</div>
</template>

<script setup>
import {
	Tabs,
	Tab,
	Power,
	PowerDetails,
	PowerAttack,
	PowerSpells,
	PowerFeats,
	CharEffects,
	ItemChildren
} from "@/components";
import { inject, reactive, toRaw } from "vue";

const props = defineProps(["context"]);
// Convert the tabs into a new reactive variable so that they
// don't change every time the item is updated.
const rawTabs = toRaw(props.context.tabs);
const tabs = reactive({ ...rawTabs });
// Retrieve a copy of the full item document instance provided by
// the VueApplicationMixin.
const itemDocument = inject("itemDocument");

</script>
