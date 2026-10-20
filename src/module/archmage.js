import { ARCHMAGE, FLAGS } from "./setup/config.js";
import { ActorArchmage } from "./actor/actor.js";
import { ActorArchmageNpcSheetV2 } from "./actor/actor-npc-sheet-v2.js";
import { ActorTabFocusSheet } from "./actor/actor-tab-focus-sheet.js";
import { ActorArchmageSheetV2 } from "./actor/actor-sheet-v2.js";
import { ItemArchmage } from "./item/item.js";
import { ItemArchmageSheet } from "./item/item-sheet.js";
import { ArchmagePowerSheetV2 } from "./item/power-sheet-v2.js";
import { ArchmageEquipmentSheetV2 } from "./item/equipment-sheet-v2.js";
import { ArchmageActionSheetV2 } from "./item/action-sheet-v2.js";
import { wrapRolls } from "./item/_item-sheet-helpers.mjs";
import { ArchmageMacros } from "./setup/macros.js";
import { ArchmageUtility, MacroUtils, ArchmageReference } from "./setup/utility-classes.js";
import { DiceArchmage } from "./actor/dice.js";
import { preloadHandlebarsTemplates } from "./setup/templates.js";
import { TourGuide } from "./tours/tourguide.js";
import { ActorHelpersV2 } from "./actor/helpers/actor-helpers-v2.js";
import { EffectArchmageSheet } from "./active-effects/effect-sheet.js";
import { registerModuleArt } from "./setup/register-module-art.js";
import { TokenArchmage } from "./actor/token.js";
import { combatRound, combatStart, combatTurn, preDeleteCombat } from "./hooks/combat.mjs";
import { ArchmageCompendiumBrowserApplication } from "./applications/compendium-browser.js";
import { ArchmageActiveEffectSheetV2 } from "./active-effects/effect-sheet-v2.js";
import { baselineMonsterDialog } from "./actor/baseline-monster.js";
import { registerChatMessageHooks } from "./chat/index.js";

registerChatMessageHooks();

Hooks.once("init", async function () {

	// Disable legacy transferral on v11 so that it's consistent with v12.
	// @see https://foundryvtt.com/article/v11-active-effects/
	CONFIG.ActiveEffect.legacyTransferral = false;

	if (game.modules.get("_CodeMirror")?.active && typeof CodeMirror != "undefined") {
		var cssId = "archmage-codemirror";
		if (!document.getElementById(cssId)) {
			var head = document.getElementsByTagName("head")[0];
			var link = document.createElement("link");
			link.id = cssId;
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = "/modules/_CodeMirror/theme/monokai.css";
			link.media = "all";
			head.appendChild(link);
		}
	}

	String.prototype.safeCSSId = function () {
		return encodeURIComponent(
			this.toLowerCase()
		).replace(/%[0-9A-F]{2}/gi, "-");
	};

	Handlebars.registerHelper("safeCSSId", (arg) => {
		return `${arg}`.safeCSSId();
	});

	Handlebars.registerHelper("getPowerClass", (inputString) => {
		// Get the appropriate usage. TODO: likely needs to be localized?
		let usage = "other";
		let usageString = inputString !== null ? inputString.toLowerCase() : "";
		if (usageString.includes("will")) {
			usage = "at-will";
		}
		else if (usageString.includes("recharge")) {
			usage = "recharge";
		}
		else if (usageString.includes("battle")) {
			usage = "once-per-battle";
		}
		else if (usageString.includes("daily")) {
			usage = "daily";
		}

		return usage;
	});

	Handlebars.registerHelper("concatenate", function () {
		var outStr = "";
		for (var arg in arguments) {
			if (typeof arguments[arg] != "object") {
				outStr += arguments[arg];
			}
		}
		return outStr;
	});

	Handlebars.registerHelper("iconSymbol", (iconKey) => {
		let symbols = {
			Positive: "+",
			Negative: "-",
			Conflicted: "~"
		};
		return symbols[iconKey];
	});

	// Preload template partials.
	preloadHandlebarsTemplates();

	game.settings.register("archmage", "secondEdition", {
		name: "ARCHMAGE.SETTINGS.secondEditionName",
		hint: "ARCHMAGE.SETTINGS.secondEditionHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true,
		requiresReload: true
	});

	game.settings.register("archmage", "alternateIconRollingMethod", {
		name: "ARCHMAGE.SETTINGS.alternateIconRollingMethodName",
		hint: "ARCHMAGE.SETTINGS.alternateIconRollingMethodHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true,
		requiresReload: false
	});

	game.settings.register("archmage", "resetIconsOnRest", {
		name: "ARCHMAGE.SETTINGS.resetIconsOnRestName",
		hint: "ARCHMAGE.SETTINGS.resetIconsOnRestHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true,
		requiresReload: false
	});

	game.archmage = {
		ActorArchmage,
		ActorArchmageSheetV2,
		ActorArchmageNpcSheetV2,
		DiceArchmage,
		ItemArchmage,
		ItemArchmageSheet,
		EffectArchmageSheet,
		wrapRolls,
		ArchmageActiveEffectSheetV2,
		ArchmageMacros,
		ArchmageUtility,
		MacroUtils,
		rollItemMacro,
		ActorHelpersV2,
		ArchmageCompendiumBrowserApplication,
		isSocketGM: () => game.users.activeGM.id === game.user.id,
		system: {
			moduleArt: {
				map: new Map(),
				refresh: registerModuleArt
			}
		},
		terrains: [
			{
				id: "none",
				name: "ARCHMAGE.TERRAINS.none",
				icon: "fa-solid fa-circle-xmark"
			},
			{
				id: "caveDungeonUnderworld",
				name: "ARCHMAGE.TERRAINS.caveDungeonUnderworld",
				icon: "fa-solid fa-dungeon"
			},
			{
				id: "forestWoods",
				name: "ARCHMAGE.TERRAINS.forestWoods",
				icon: "fa-solid fa-trees"
			},
			{
				id: "iceTundraDeepSnow",
				name: "ARCHMAGE.TERRAINS.iceTundraDeepSnow",
				icon: "fa-solid fa-icicles"
			},
			{
				id: "migration",
				name: "ARCHMAGE.TERRAINS.migration",
				icon: "fa-solid fa-paw-claws"
			},
			{
				id: "mountains",
				name: "ARCHMAGE.TERRAINS.mountains",
				icon: "fa-solid fa-mountains"
			},
			{
				id: "plainsOverworld",
				name: "ARCHMAGE.TERRAINS.plainsOverworld",
				icon: "fa-solid fa-staff"
			},
			{
				id: "ruins",
				name: "ARCHMAGE.TERRAINS.ruins",
				icon: "fa-solid fa-scroll-old"
			},
			{
				id: "swampLakeRiver",
				name: "ARCHMAGE.TERRAINS.swampLakeRiver",
				icon: "fa-solid fa-water"
			}
		]
	};

	// Replace sheets.
	foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
	foundry.documents.collections.Items.registerSheet("archmage", ItemArchmageSheet, {
		label: "ARCHMAGE.sheetItem",
		makeDefault: true
	});
	// AppV2 + Vue based sheets. These will eventually become the default.
	foundry.documents.collections.Items.registerSheet("archmage", ArchmagePowerSheetV2, {
		label: "ARCHMAGE.sheetItemV2",
		types: ["power"],
		makeDefault: true
	});
	foundry.documents.collections.Items.registerSheet("archmage", ArchmageEquipmentSheetV2, {
		label: "ARCHMAGE.sheetItemV2",
		types: ["equipment"],
		makeDefault: true
	});
	foundry.documents.collections.Items.registerSheet("archmage", ArchmageActionSheetV2, {
		label: "ARCHMAGE.sheetItemV2",
		types: ["action", "trait", "nastierSpecial"],
		makeDefault: true
	});

	foundry.applications.apps.DocumentSheetConfig.registerSheet(ActiveEffect, "archmage", ArchmageActiveEffectSheetV2, {
		label: "ARCHMAGE.sheetActiveEffect",
		makeDefault: true
	});

	CONFIG.ARCHMAGE = ARCHMAGE;
	// Default the 2e constant to false, but the setting will be checked later in the 'ready' hook.
	CONFIG.ARCHMAGE.is2e = false;

	// Override 2e conditions journals before copying them to CONFIG
	// We do it here because we want to keep a copy of *all* conditions in ARCHMAGE.statusEffects
	// in order to be able to e.g. recognize both hindered and hampered
	if (game.settings.get("archmage", "secondEdition")) {

		// Remove AE from and update vulnerable
		let id = ARCHMAGE.statusEffects.findIndex((e) => e.id == "vulnerable");
		delete ARCHMAGE.statusEffects[id].changes;
		ARCHMAGE.statusEffects[id].journal = "uHqgXlfj0rkf0XRE";

		// Update grabbed.
		id = ARCHMAGE.statusEffects.findIndex((e) => e.id == "grabbed");
		ARCHMAGE.statusEffects[id].journal = "e74tdY4XILWFW9VB";

		// Update stunned
		id = ARCHMAGE.statusEffects.findIndex((e) => e.id == "stunned");
		ARCHMAGE.statusEffects[id].journal = "2rxwthymp5rl1dqf";

		// Update confused
		id = ARCHMAGE.statusEffects.findIndex((e) => e.id == "confused");
		ARCHMAGE.statusEffects[id].journal = "21cEqzk92tflpW7O";

	}

	// Update status effects.
	CONFIG.statusEffects = ARCHMAGE.statusEffects.concat(ARCHMAGE.extendedStatusEffects);

	// Update 2e constants
	if (game.settings.get("archmage", "secondEdition")) {
		// Update dice number at higher level
		CONFIG.ARCHMAGE.numDicePerLevel = CONFIG.ARCHMAGE.numDicePerLevel2e;

		// Update tier multiplier Array
		CONFIG.ARCHMAGE.tierMultPerLevel = CONFIG.ARCHMAGE.tierMultPerLevel2e;

		// Update monster baseline stats
		CONFIG.ARCHMAGE.baselineMonsterStats = CONFIG.ARCHMAGE.baselineMonsterStats2e;

		// Remove 1e hampered from context menu status effects
		let id = CONFIG.statusEffects.findIndex((e) => e.id == "hampered");
		CONFIG.statusEffects[id].hud = false;

		// Update class base stats
		for (let cl of Object.keys(CONFIG.ARCHMAGE.classes2e)) {
			for (let k of Object.keys(CONFIG.ARCHMAGE.classes2e[cl])) {
				CONFIG.ARCHMAGE.classes[cl][k] = CONFIG.ARCHMAGE.classes2e[cl][k];
			}
		}

		// Update daily -> arc
		CONFIG.ARCHMAGE.powerUsages.daily = "ARCHMAGE.arc";
		CONFIG.ARCHMAGE.powerUsages["daily-desperate"] = "ARCHMAGE.arc-desperate";
		CONFIG.ARCHMAGE.equipUsages.daily = "ARCHMAGE.arc";
		CONFIG.ARCHMAGE.equipUsages["daily-desperate"] = "ARCHMAGE.arc-desperate";
		CONFIG.ARCHMAGE.featUsages.daily = "ARCHMAGE.arc";

		// Add additional classResources
		CONFIG.ARCHMAGE.classResources = foundry.utils.mergeObject(
			CONFIG.ARCHMAGE.classResources,
			CONFIG.ARCHMAGE.classResources2e
		);
	}
	else {
		// Remove Mental Phenomenon flag
		delete FLAGS.characterFlags.dexToInt;
		// Remove Grim Determination flag
		delete FLAGS.characterFlags.grimDetermination;
		// Remove Blessing of Heaven flag
		delete FLAGS.characterFlags.dexToCha;

		// Remove 11th level feat tier
		delete CONFIG.ARCHMAGE.featTiers.iconic;

		// Remove 2e hindered from context menu status effects
		let id = CONFIG.statusEffects.findIndex((e) => e.id == "hindered");
		CONFIG.statusEffects[id].hud = false;

		// Remove 2e charmed from context menu status effects
		// id = CONFIG.statusEffects.findIndex(e => e.id == "charmed");
		// CONFIG.statusEffects[id].hud = false;
	}

	// Assign the actor class to the CONFIG
	CONFIG.Actor.documentClass = ActorArchmage;
	CONFIG.Token.objectClass = TokenArchmage;

	// Assign ItemArchmage class to CONFIG
	CONFIG.Item.documentClass = ItemArchmage;

	// Override CONFIG
	CONFIG.Item.sheetClass = ItemArchmageSheet;

	foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);

	foundry.documents.collections.Actors.registerSheet("archmage", ActorArchmageNpcSheetV2, {
		label: "ARCHMAGE.sheetNPC",
		types: ["npc"],
		makeDefault: true
	});

	// V2 actor sheet (See issue #118).
	foundry.documents.collections.Actors.registerSheet("archmage", ActorArchmageSheetV2, {
		label: "ARCHMAGE.sheetCharacter",
		types: ["character"],
		makeDefault: true
	});

	/* -------------------------------------------- */
	CONFIG.Actor.characterFlags = FLAGS.characterFlags;
	CONFIG.Actor.npcFlags = FLAGS.npcFlags;
	// Store flags in global config for later manipulation
	CONFIG.ARCHMAGE.FLAGS = FLAGS;

	/**
	 * Register Initiative formula setting
	 * @param {boolean} tiebreaker  Whether to use the dexterity tiebreaker.
	 */
	function _setArchmageInitiative(tiebreaker) {
		CONFIG.Combat.initiative.tiebreaker = tiebreaker;
		CONFIG.Combat.initiative.decimals = 0;
		if (ui.combat && ui.combat._rendered) ui.combat.render();
	}
	game.settings.register("archmage", "initiativeDexTiebreaker", {
		name: "ARCHMAGE.SETTINGS.initiativeDexTiebreakerName",
		hint: "ARCHMAGE.SETTINGS.initiativeDexTiebreakerHint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: (enable) => _setArchmageInitiative(enable)
	});
	_setArchmageInitiative(game.settings.get("archmage", "initiativeDexTiebreaker"));

	game.settings.register("archmage", "initiativeStaticNpc", {
		name: "ARCHMAGE.SETTINGS.initiativeStaticNpcName",
		hint: "ARCHMAGE.SETTINGS.initiativeStaticNpcHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true
	});

	game.settings.register("archmage", "automateHPConditions", {
		name: "ARCHMAGE.SETTINGS.automateHPConditionsName",
		hint: "ARCHMAGE.SETTINGS.automateHPConditionsHint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});

	game.settings.register("archmage", "staggeredOverlay", {
		name: "ARCHMAGE.SETTINGS.staggeredOverlayName",
		hint: "ARCHMAGE.SETTINGS.staggeredOverlayHint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});

	game.settings.register("archmage", "multiTargetAttackRolls", {
		name: "ARCHMAGE.SETTINGS.multiTargetAttackRollsName",
		hint: "ARCHMAGE.SETTINGS.multiTargetAttackRollsHint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});

	game.settings.register("archmage", "hideExtraRolls", {
		name: "ARCHMAGE.SETTINGS.hideExtraRollsName",
		hint: "ARCHMAGE.SETTINGS.hideExtraRollsHint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});

	game.settings.register("archmage", "showDefensesInChat", {
		name: "ARCHMAGE.SETTINGS.showDefensesInChatName",
		hint: "ARCHMAGE.SETTINGS.showDefensesInChatHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true
	});

	game.settings.register("archmage", "showVulnsInChat", {
		name: "ARCHMAGE.SETTINGS.showVulnsInChatName",
		hint: "ARCHMAGE.SETTINGS.showVulnsInChatHint",
		scope: "world",
		type: Boolean,
		default: false,
		config: true
	});

	game.settings.register("archmage", "enableOngoingEffectsMessages", {
		name: "ARCHMAGE.SETTINGS.enableOngoingEffectsMessagesName",
		hint: "ARCHMAGE.SETTINGS.enableOngoingEffectsMessagesHint",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
	});

	game.settings.register("archmage", "allowTargetDamageApplication", {
		name: "ARCHMAGE.SETTINGS.allowTargetDamageApplicationName",
		hint: "ARCHMAGE.SETTINGS.allowTargetDamageApplicationHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register("archmage", "userTargetDamageApplicationType", {
		scope: "client",
		config: false,
		default: "selected",
		type: String
	});

	game.settings.register("archmage", "allowRerolls", {
		name: "ARCHMAGE.SETTINGS.allowRerollsName",
		hint: "ARCHMAGE.SETTINGS.allowRerollsHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register("archmage", "rechargeOncePerDay", {
		name: "ARCHMAGE.SETTINGS.rechargeOncePerDayName",
		hint: "ARCHMAGE.SETTINGS.rechargeOncePerDayHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "optionalBaseCritRange", {
		name: "ARCHMAGE.SETTINGS.optionalBaseCritRangeName",
		hint: "ARCHMAGE.SETTINGS.optionalBaseCritRangeHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "unboundEscDie", {
		name: "ARCHMAGE.SETTINGS.UnboundEscDieName",
		hint: "ARCHMAGE.SETTINGS.UnboundEscDieHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "automateBaseStatsFromClass", {
		name: "ARCHMAGE.SETTINGS.automateBaseStatsFromClassName",
		hint: "ARCHMAGE.SETTINGS.automateBaseStatsFromClassHint",
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});

	game.settings.register("archmage", "lastTourVersion", {
		scope: "client",
		config: false,
		default: "1.6.0",
		type: String
	});

	game.settings.register("archmage", "tourVisibility", {
		name: "ARCHMAGE.SETTINGS.tourVisibilityName",
		hint: "ARCHMAGE.SETTINGS.tourVisibilityHint",
		scope: "world",
		config: true,
		default: "all",
		type: String,
		choices: {
			all: "ARCHMAGE.SETTINGS.tourVisibilityAll",
			gm: "ARCHMAGE.SETTINGS.tourVisibilityGM",
			off: "ARCHMAGE.SETTINGS.tourVisibilityOff"
		}
	});

	game.settings.register("archmage", "sheetTooltips", {
		name: "ARCHMAGE.SETTINGS.sheetTooltipsName",
		hint: "ARCHMAGE.SETTINGS.sheetTooltipsHint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "showPrivateGMAttackRolls", {
		name: "ARCHMAGE.SETTINGS.showPrivateGMAttackRollsName",
		hint: "ARCHMAGE.SETTINGS.showPrivateGMAttackRollsHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "nightmode", {
		name: "ARCHMAGE.SETTINGS.nightmodeName",
		hint: "ARCHMAGE.SETTINGS.nightmodeHint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "compactMode", {
		name: "ARCHMAGE.SETTINGS.compactModeName",
		hint: "ARCHMAGE.SETTINGS.compactModeHint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register("archmage", "disableMovementDistances", {
		name: "ARCHMAGE.SETTINGS.disableMovementDistancesName",
		hint: "ARCHMAGE.SETTINGS.disableMovementDistancesHint",
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true
	});

	game.settings.register("archmage", "disableMovementTrails", {
		name: "ARCHMAGE.SETTINGS.disableMovementTrailsName",
		hint: "ARCHMAGE.SETTINGS.disableMovementTrailsHint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register("archmage", "allowPasteParsing", {
		name: "ARCHMAGE.SETTINGS.allowPasteParsingName",
		hint: "ARCHMAGE.SETTINGS.allowPasteParsingHint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
		requiresReload: false
	});

	game.settings.register("archmage", "showNaturalRolls", {
		name: "ARCHMAGE.SETTINGS.showNaturalRollsName",
		hint: "ARCHMAGE.SETTINGS.showNaturalRollsHint",
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: false,
		onChange: (newValue) => {
			$("#chat").toggleClass("show-natural-rolls", newValue);
			$("#chat-notifications").toggleClass("show-natural-rolls", newValue);
		}
	});

	game.settings.register("archmage", "colorBlindMode", {
		name: "ARCHMAGE.SETTINGS.ColorblindName",
		hint: "ARCHMAGE.SETTINGS.ColorblindHint",
		scope: "client",
		config: true,
		default: "default",
		type: String,
		choices: {
			default: "ARCHMAGE.SETTINGS.ColorblindOptionDefault",
			colorBlindRG: "ARCHMAGE.SETTINGS.ColorblindOptioncolorBlindRG",
			colorBlindBY: "ARCHMAGE.SETTINGS.ColorblindOptioncolorBlindBY"
			// custom: "ARCHMAGE.SETTINGS.Custom",
		},
		onChange: () => {
			$("body").removeClass(["default", "colorBlindRG", "colorBlindBY", "custom"])
				.addClass(game.settings.get("archmage", "colorBlindMode"));
		}
	});
	// Adding the colorblind mode class at startup
	$("body").addClass(game.settings.get("archmage", "colorBlindMode"));

	// Track whether we overrode DsN's default configuration
	game.settings.register("archmage", "DsNDefaultConfigOverrides", {
		name: "DsN Override",
		scope: "world",
		config: false,
		type: Boolean,
		default: false
	});

	/**
	 * Override the default Initiative formula to customize special behaviors of the system.
	 * Apply advantage, proficiency, or bonuses where appropriate
	 * Apply the dexterity score as a decimal tiebreaker if requested
	 * See Combat._getInitiativeFormula for more detail.
	 * @private
	 * @returns {string} The initiative formula.
	 */
	Combatant.prototype._getInitiativeFormula = function () {
		return this.actor?.getInitiativeFormula() ?? "1d20";
	};

	ArchmageUtility.fixVuePopoutBug();
});

Hooks.on("ready", () => {
	// Precompile regexps
	// Do it after ready to wait for localization to load
	CONFIG.ARCHMAGE.REGEXP.ONGOING_DAMAGE = new RegExp(`(<a (?:(?!<a ).)*?><i class="fas fa-dice-d20"><\\/i>)*(-?\\d+)(<\\/a>)* (?:${game.i18n.localize("ARCHMAGE.ongoing")} ([a-zA-Z]*(?: [a-zA-Z]+)?) ?${game.i18n.localize("ARCHMAGE.damage")}|([a-zA-Z]+(?: [a-zA-Z]+)?) ${game.i18n.localize("ARCHMAGE.ongoing")} ${game.i18n.localize("ARCHMAGE.damage")})(?:\\s*\\((\\w*) ?${game.i18n.localize("ARCHMAGE.DURATION.SaveEnds")}(?:, \\d*\\+)?\\))?`, "ig");
	// /(<a (?:(?!<a ).)*?><i class="fas fa-dice-d20"><\/i>)*(-?\d+)(<\/a>)* (?:ongoing ([a-zA-Z]*(?: [a-zA-Z]+)?) ?damage|([a-zA-Z]+(?: [a-zA-Z]+)?) ongoing damage)(?:\s*\((\w*) ?save ends(?:, \d*\+)?\))?/ig
	CONFIG.ARCHMAGE.REGEXP.CONDITIONS = new Map(
		CONFIG.ARCHMAGE.statusEffects.filter((x) => x.journal).map((x) => {
			const localizedName = game.i18n.localize(x.name);
			return [
				localizedName,
				[
					x,
					new RegExp(`\\*?\\b(${localizedName})\\b\\*?(?:\\s*\\(?(\\w*\\s?${game.i18n.localize("ARCHMAGE.DURATION.SaveEnds")}|${game.i18n.localize("ARCHMAGE.DURATION.NextTurnFilter")})(?:,\\s\\d*\\+)?\\)?)?`, "ig")
				]
			];
		})
	);
	for (const kind of Object.keys(CONFIG.ARCHMAGE.REGEXP.FLEXIBLE_KINDS)) {
		const word = game.i18n.localize(`ARCHMAGE.${kind}`).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		CONFIG.ARCHMAGE.REGEXP.FLEXIBLE_KINDS[kind] = new RegExp(word, "i");
	}

	// Optionally Hide ruler distance labels — 13th Age uses abstract movement where distances are irrelevant.
	if (game.settings.get("archmage", "disableMovementDistances")) {
		CONFIG.Token.rulerClass.WAYPOINT_LABEL_TEMPLATE = "";
	}
});

Hooks.on("setup", (data, options, id) => {
	// Configure autocomplete inline properties module.
	const aip = game.modules.get("autocomplete-inline-properties")?.API;
	if (aip?.PACKAGE_CONFIG) {
		// Autocomplete Inline Rolls
		const aipKeys = [
			"str",
			"dex",
			"con",
			"int",
			"wis",
			"cha",
			"ac",
			"pd",
			"md",
			"hp",
			"recoveries",
			"wpn.m",
			"wpn.r",
			"wpn.p",
			"wpn.k",
			"wpn.j"
		];
		let filteredKeys = [
			"standardBonuses",
			"out",
			"incrementals",
			"icons",
			"details",
			"coins",
			"backgrounds",
			"attr",
			"attributes",
			"abilities",
			"abil",
			"tier",
			"sheetGrouping",
			"disengage"
		];
		aipKeys.forEach((k) => {
			filteredKeys.push(`${k}.type`);
			filteredKeys.push(`${k}.label`);
		});
		const AIP = {
			packageName: "archmage",
			sheetClasses: [
				{
					name: "ItemArchmageSheet",
					fieldConfigs: [
						{
							selector: '.archmage-aip input[type="text"]',
							showButton: true,
							allowHotkey: true,
							dataMode: aip.CONST.DATA_MODE.OWNING_ACTOR_ROLL_DATA,
							filteredKeys: filteredKeys
						}
					]
				},
				{
					name: "ActiveEffectConfig",
					fieldConfigs: [
						{
							selector: '.tab[data-tab="effects"] .key input[type="text"]',
							showButton: true,
							allowHotkey: true,
							dataMode: "owning-actor",
							defaultPath: "data"
						}
					]
				}
			]
		};
		aip.PACKAGE_CONFIG.push(AIP);
	}
});

/* ---------------------------------------------- */

/**
 * Render the escalation die display into the combat tracker.
 */
async function addEscalationDie() {
	const render = () => {
		const escalation = ArchmageUtility.getEscalation();
		const hide = game.combats.contents.length < 1 ? " hide" : "";
		const hideIfNotGM = !game.user.isGM ? " hide" : "";
		const subtitle = game.i18n.localize("ARCHMAGE.escalationDieLabel");
		return foundry.applications.handlebars.renderTemplate(
			"systems/archmage/templates/sidebar/ed-display.html",
			{
				escalation,
				hide,
				hideIfNotGM,
				subtitle
			}
		);
	};
	const htmlContent = await render();
	$(".archmage-hotbar").prepend(htmlContent);

	// Add click events for ed.
	$("body").on("click", ".ed-control", async (event) => {
		let $self = $(event.currentTarget);
		let isIncrease = $self.hasClass("ed-plus");
		await ArchmageUtility.setEscalationOffset(game.combat, isIncrease);
		const htmlContent = await render();
		$(".archmage-hotbar").find(".archmage-escalation-display")
			.replaceWith(htmlContent);
	});

	// Add click events for effect links
	$("body").on("click", "a.effect-link", async (event) => {
		event.preventDefault();
		const a = event.currentTarget;
		let doc = null;
		let id = a.dataset.id;

		switch (a.dataset.type) {
			case "condition":
				const journalId = CONFIG.ARCHMAGE.statusEffects.find((x) => x.id === id)?.journal;
				doc = journalId ? await game.packs.get("archmage.conditions").getDocument(journalId) : false;
				break;
			case "effect":
				console.warn("Effects not currently supported");
				break;
		}
		if (!doc) return;

		return doc.sheet.render(true);
	});

	$("#chat").toggleClass("show-natural-rolls", game.settings.get("archmage", "showNaturalRolls"));
	$("#chat-notifications").toggleClass("show-natural-rolls", game.settings.get("archmage", "showNaturalRolls"));
}

/* -------------------------------------------- */

Hooks.once("ready", async () => {
	$(`<div class="archmage-hotbar faded-ui flexrow"></div>`).insertBefore("#players");
	await addEscalationDie();
	$("body").append('<div class="archmage-preload"></div>');
	renderSceneTerrains();

	// Apply localization to CONFIG.ARCHMAGE leaf props
	// TODO: the following are currently localized on each usage, may need to be hunted down
	// one by one and moved here
	// ARCHMAGE.statusEffects
	// ARCHMAGE.extendedStatusEffects
	// ARCHMAGE.effectDurationTypes
	// ARCHMAGE.chakraSlots
	[
		"featTiers",
		"powerSources",
		"powerTypes",
		"powerUsages",
		"equipUsages",
		"featUsages",
		"actionTypes",
		"actionTypesShort",
		"creatureTypes",
		"creatureSizes",
		"creatureStrengths",
		"creatureRoles",
		"raceList",
		"classList"
	].forEach((s) => {
		for (const [k, v] of Object.entries(CONFIG.ARCHMAGE[s])) {
			CONFIG.ARCHMAGE[s][k] = game.i18n.localize(v);
		}
	});

	// Localize actor flags
	console.log(CONFIG.ARCHMAGE.FLAGS);  // Throws an error is object isn't accessed before loop
	[
		"characterFlags",
		"npcFlags"
	].forEach((s) => {
		for (const k of Object.keys(CONFIG.ARCHMAGE.FLAGS[s])) {
			CONFIG.ARCHMAGE.FLAGS[s][k].name = game.i18n.localize(CONFIG.ARCHMAGE.FLAGS[s][k].name);
			CONFIG.ARCHMAGE.FLAGS[s][k].hint = game.i18n.localize(CONFIG.ARCHMAGE.FLAGS[s][k].hint);
			if (CONFIG.ARCHMAGE.FLAGS[s][k].options) {
				for (const k_opt of Object.keys(CONFIG.ARCHMAGE.FLAGS[s][k].options)) {
					CONFIG.ARCHMAGE.FLAGS[s][k].options[k_opt] = game.i18n.localize(
						CONFIG.ARCHMAGE.FLAGS[s][k].options[k_opt]
					);
				}
			}
		}
	});
	// Override character flags now that we have them translated
	CONFIG.Actor.characterFlags = CONFIG.ARCHMAGE.FLAGS.characterFlags;
	CONFIG.Actor.npcFlags = CONFIG.ARCHMAGE.FLAGS.npcFlags;

	CONFIG.ARCHMAGE.ActorTabFocusSheet = ActorTabFocusSheet;

	// Add a constant for whether or not we're on 2e.
	CONFIG.ARCHMAGE.is2e = game.settings.get("archmage", "secondEdition");

	// Add effect link drag data
	document.addEventListener("dragstart", (event) => {
		if (!event.target.classList.contains("effect-link")) return;
		const dataset = event.target.dataset;
		let data = {
			type: dataset.type,
			id: dataset.id
		};
		if (dataset.actorId) data.actorId = dataset.actorId;
		if (dataset.damageType) data.damageType = dataset.damageType;
		if (dataset.value) data.value = dataset.value;
		if (dataset.ends) data.ends = dataset.ends;
		if (dataset.source) data.source = dataset.source;
		if (dataset.tooltip) data.tooltip = dataset.tooltip;
		if (dataset.name) data.name = dataset.name;
		data.text = event.target.innerText;
		event.dataTransfer.setData("text/plain", JSON.stringify(data));
	});

	// Handle click events for the compendium browser.
	document.addEventListener("click", (event) => {
		if (event?.target?.classList?.contains("open-archmage-browser")) {
			// Retrieve the existing compendium browser, if any.
			let compendiumBrowser = Object.values(ui.windows).find((app) => app.constructor.name == "ArchmageCompendiumBrowserApplication");
			// Otherwise, build a new one.
			if (!compendiumBrowser) {
				compendiumBrowser = new ArchmageCompendiumBrowserApplication({ defaultTab: event.target.dataset.tab ?? "creatures" });
			}
			// Render the browser.
			compendiumBrowser.render(true);
		}

		if (event?.target?.classList?.contains("archmage-rolls-reference")) {
			event.preventDefault();
			new ArchmageReference().render(true);
		}

		if (event?.target?.classList?.contains("create-baseline-monster")) {
			event.preventDefault();
			baselineMonsterDialog();
		}
	});

	// Wait to register the hotbar macros until ready.
	Hooks.on("hotbarDrop", (bar, data, slot) => {
		if (["Item"].includes(data.type)) {
			createArchmageMacro(data, slot);
			return false;
		}
	});

	$(".message").off("contextmenu");

	// Build the module art map. See module/setup/register-module-art.js for more details.
	registerModuleArt();
});

/* ---------------------------------------------- */

Hooks.on("renderDocumentDirectory", (app, html, options) => {
	const htmlElement = $(html)[0];
	if (options.documentCls === "actor") {
		htmlElement.querySelector(".directory-footer").insertAdjacentHTML("beforeend", `
      <div class="flexrow">
        <button type="button" class="open-archmage-browser" data-tab="creatures">
          <i class="fas fa-face-smile-horns open-archmage-browser"></i>
        ${game.i18n.localize("ARCHMAGE.COMPENDIUMBROWSER.buttons.browseCreatures")}
        </button>
        <button type="button" class="create-baseline-monster" style="flex-grow: 0;"
          data-tooltip="${game.i18n.localize("ARCHMAGE.COMPENDIUMBROWSER.buttons.baselineMonster")}"
          data-tooltip-direction="UP">
          <i class="fas fa-spaghetti-monster-flying"></i>
        </button>
      </div>
    `);
	}
	if (options.documentCls === "item") {
		htmlElement.querySelector(".directory-footer").insertAdjacentHTML("beforeend", `
      <div class="flexrow">
        <button type="button" class="open-archmage-browser" data-tab="powers"><i class="fas fa-swords open-archmage-browser"></i>${game.i18n.localize("ARCHMAGE.COMPENDIUMBROWSER.buttons.browsePowers")}</button>
        <button type="button" class="open-archmage-browser" data-tab="items"><i class="fas fa-wand-magic-sparkles open-archmage-browser"></i>${game.i18n.localize("ARCHMAGE.COMPENDIUMBROWSER.buttons.browseItems")}</button>
      </div>`);
	}
});

/* -------------------------------------------- */

/**
 * Render the terrain indicators for the currently viewed scene.
 */
function renderSceneTerrains() {

	// Remove any existing element
	$(".archmage-terrains").remove();

	let scene = game.scenes.viewed;
	if (!scene) return;
	let flag = scene.getFlag("archmage", "terrains");
	if (!flag) return;
	let terrains = flag.filter((x) => x !== "none");
	if (!terrains || (terrains.length === 0)) return;

	const label = game.i18n.localize("ARCHMAGE.terrains");
	const isGM = game.user.isGM ? "gm" : "";
	const aside = $(`
    <aside class="archmage-terrains flexcol ${isGM}">
      <h4 class="archmage-terrains-header">${label}</h4>
    </aside>
  `);
	if (terrains) {
		terrains.forEach((t) => {
			const terrain = game.archmage.terrains.find((x) => x.id === t);
			aside.append(`<div><i class="${terrain.icon}"></i> ${game.i18n.localize(terrain.name)}</div>`);
		});
	}
	// Set height based on number of terrains
	$(".archmage-hotbar").append(aside);
}

/* -------------------------------------------- */

Hooks.on("canvasReady", (canvas) => {
	renderSceneTerrains();
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
	html = $(html);
	// Define groups for organization.
	const groups = [
		{
			label: "ARCHMAGE.SETTINGS.groups.edition",
			settings: ["secondEdition", "alternateIconRollingMethod"],
			highlights: []
		},
		{
			label: "ARCHMAGE.SETTINGS.groups.automation",
			settings: [
				"enableOngoingEffectsMessages",
				"resetIconsOnRest",
				"automateHPConditions",
				"staggeredOverlay",
				"multiTargetAttackRolls",
				"hideExtraRolls",
				"showDefensesInChat",
				"showVulnsInChat",
				"roundUpDamageApplication",
				"allowTargetDamageApplication",
				"allowRerolls",
				"rechargeOncePerDay",
				"optionalBaseCritRange",
				"automateBaseStatsFromClass",
				"showPrivateGMAttackRolls"
			],
			highlights: [
			]
		},
		{
			label: "ARCHMAGE.SETTINGS.groups.appearance",
			settings: [
				"nightmode",
				"compactMode",
				"showNaturalRolls",
				"sheetTooltips"
			],
			highlights: [
			]
		},
		{
			label: "ARCHMAGE.SETTINGS.groups.accessibility",
			settings: [
				"colorBlindMode"
			],
			highlights: []
		},
		{
			label: "ARCHMAGE.SETTINGS.groups.general",
			settings: [
				"disableMovementDistances",
				"disableMovementTrails",
				"allowPasteParsing",
				"initiativeDexTiebreaker",
				"initiativeStaticNpc",
				"unboundEscDie",
				"tourVisibility"
			],
			highlights: [
				"disableMovementDistances",
				"disableMovementTrails"
			]
		}
	];

	// Find the parent category element.
	const settingsElements = html.find('section[data-category="system"] .form-group');
	const parent = settingsElements.closest("section");
	parent.addClass("archmage-settings");

	// Iterate through our groups and move all of their settings into the matching element.
	for (let group of groups) {
		const details = $(`<details><summary>${game.i18n.localize(group.label)}</summary><span class="slot"></span></details>`);
		let settingsCount = 0;

		for (let setting of group.settings) {
			const element = html.find(`label[for="settings-config-archmage.${setting}"]`).parent();
			if (element.length < 1) continue;

			// Add a highlight if necessary.
			if (group.highlights.includes(setting)) {
				element.addClass("highlight");
				element.find("label").append(`<span class="new-setting"> (${game.i18n.localize("ARCHMAGE.SETTINGS.newSetting")})</span>`);
			}

			// Move the element.
			element.detach();
			details.append(element);
			settingsCount++;

			// Add listener for the colorblind selector.
			if (setting === "colorBlindMode") {
				element.find("select").on("change", changeColorBlindPreview);
			}
		}

		// Add special template for the a11y section.
		if (settingsCount > 0) {
			if (group.label.includes("accessibility")) {
				foundry.applications.handlebars.renderTemplate("systems/archmage/templates/sidebar/apps/a11y-preview.html", {}).then((tpl) => {
					details.append(tpl);
				});
			}
			parent.append(details);
		}
	}

	// Event listener for the color blind selector.
	/**
	 * Update the settings preview to match the selected color blind mode.
	 * @param {Event} event  The change event from the color blind selector.
	 */
	function changeColorBlindPreview(event) {
		const element = event.currentTarget;
		const parent = element.closest("details");
		const preview = parent?.querySelector(".archmage-settings-preview");
		const value = element.value;

		if (!preview) return;

		switch (value) {
			case "colorBlindRG":
				preview.classList.remove("colorBlindBY");
				preview.classList.add("colorBlindRG");
				break;

			case "colorBlindBY":
				preview.classList.remove("colorBlindRG");
				preview.classList.add("colorBlindBY");
				break;

			default:
				preview.classList.remove("colorBlindBY");
				preview.classList.remove("colorBlindRG");
				break;
		}
	}
});

/* -------------------------------------------- */

Hooks.on("renderSceneConfig", (app, html, data) => {

	// Attach a list of Terrains to the scene config as a multi-select
	const terrainOptions = game.archmage.terrains.map((t) => {
		return {
			value: t.id,
			label: game.i18n.localize(t.name)
		};
	});
	const currentTerrains = data.document.getFlag("archmage", "terrains") || [];

	// Create multiple select dom element
	const htmlSelect = $(`<select style="height:125px;" multiple="multiple" name="flags.archmage.terrains" data-dtype="String"></select>`);
	terrainOptions.forEach((o) => {
		const attrs = [`value='${o.value}'`, currentTerrains.includes(o.value) ? "selected=" : ""];
		const option = $(`<option ${attrs.join(" ")}>${o.label}</option>`);
		htmlSelect.append(option);
	});

	// Wrap the select in a form-group
	const htmlFormGroup = $(`<div class="form-group"></div>`);
	htmlFormGroup.append(`<label>${game.i18n.localize("ARCHMAGE.TERRAINS.label")}</label>`);
	htmlFormGroup.append(htmlSelect);

	// Attach the select after .initial-position
	html = $(html);
	const lastControl = html.find("div[data-tab=basics] .form-group").last();
	lastControl.after(htmlFormGroup);

	// Update the height of the scene config by setting to auto
	$(app.element).css("height", "auto");
});

/* -------------------------------------------- */

Hooks.on("updateScene", (scene, data, options, userId) => {
	renderSceneTerrains();
});

/* ---------------------------------------------- */

Hooks.on("renderSettings", async (app, html) => {
	html = $(html);
	let button = $(`<button id="archmage-reference-btn" class="archmage-rolls-reference" type="button" data-action="archmage-help"><i class="fas fa-dice-d20"></i> Attributes and Inline Rolls Reference</button>`);
	html.find('button[data-app="controls"]').after(button);

	// Event trigger has been moved to the ready hook using the archmage-rolls-reference class.
	// button.on('click', ev => {
	//   ev.preventDefault();
	//   new ArchmageReference().render(true);
	// });

	let helpButton = $(`<button id="archmage-help-btn" type="button" data-action="archmage-help"><i class="fas fa-question-circle"></i> System Documentation</button>`);
	html.find('button[data-app="controls"]').after(helpButton);

	helpButton.on("click", (ev) => {
		ev.preventDefault();
		window.open("https://asacolips.gitbook.io/toolkit13-system/", "archmageHelp", "width=1032,height=720");
	});

	let licenseButton = $(`<button id="archmage-license-btn" type="button" data-action="archmage-help"><i class="fas fa-book"></i> ${game.i18n.localize("ARCHMAGE.DIALOG.CUP.title")}</button>`);
	html.find('button[data-app="controls"]').after(licenseButton);

	licenseButton.on("click", (ev) => {
		ev.preventDefault();
		new Dialog({
			title: game.i18n.localize("ARCHMAGE.DIALOG.CUP.title"),
			content: game.i18n.localize("ARCHMAGE.DIALOG.CUP.content"),
			buttons: {}
		}).render(true);
	});

	// This is intentionally in renderSettings, as it is one of the last bits of HTML to get rendered, which is required for the Tour to hook in
	let tourVisibility = game.settings.get("archmage", "tourVisibility");
	let showTours = tourVisibility !== "off";

	if (tourVisibility == "gm" && !game.user.isGM) {
		showTours = false;
	}

	if (showTours) {
		let tourGuide = new TourGuide();
		await tourGuide.registerTours();
		// @todo fix tours for v10
		// tourGuide.startNewFeatureTours();
	}
});

Hooks.on("diceSoNiceReady", (dice3d) => {
	dice3d.addSystem({ id: "archmage", name: "Archmage" }, false);

	// Override some of DsN's defaults to better suit the system - let users change them back
	if (game.user.isGM
		&& foundry.utils.isNewerVersion(game.modules.get("dice-so-nice")?.version, "4.1.1")
		&& !game.settings.get("archmage", "DsNDefaultConfigOverrides")) {
		ui.notifications.info(game.i18n.localize("ARCHMAGE.UI.infoDsNDefaultsApplied"));
		// Disable DsN's automatic parsing of inline rolls
		game.settings.set("dice-so-nice", "animateInlineRoll", false);
		// Speed up the dice animation for everyone ("2" = 2x)
		game.settings.set("dice-so-nice", "globalAnimationSpeed", "2");
		game.settings.set("archmage", "DsNDefaultConfigOverrides", true);
	}

	dice3d.addTexture("archmagered", {
		name: "Archmage Red",
		composite: "source-over",
		source: "systems/archmage/images/redTexture.png"
	})
		.then(() => {
			dice3d.addColorset({
				name: "archmage",
				description: "Archmage Red/Gold",
				category: "Archmage",
				background: ["#9F8"],
				texture: "archmagered",
				edge: "#9F8003",
				foreground: "#9F8003",
				default: true
			});
		});
});

/* -------------------------------------------- */

Hooks.on("updateToken", (tokenDoc, changes, options, userId) => {
	if (!game.settings.get("archmage", "disableMovementTrails")) return;
	if ("x" in changes || "y" in changes) {
		tokenDoc.clearMovementHistory?.();
	}
});

/* -------------------------------------------- */

Hooks.on("dropActorSheetData", (actor, sheet, data) => {
	const types = ["effect", "ActiveEffect", "condition", "ongoing-damage"];
	if (types.includes(data.type)) {
		// Render the condition dialog and apply the effect.
		_applyAE(actor, data);
		// Return false to prevent Foundry from adding a duplicate effect.
		return false;
	}
});

/* ---------------------------------------------- */

Hooks.on("dropCanvasData", (canvas, data) => {

	/**
	 * Find the owned, visible token under the drop point, preferring the closest to its center.
	 * @returns {TokenDocument|null} The token at the drop point, if any.
	 */
	function findToken() {
		// Get the token at the drop point, if any
		const x = data.x;
		const y = data.y;
		const gridSize = canvas.scene.grid.size;
		// Get the set of targeted tokens
		const targets = Array.from(canvas.scene.tokens.values()).filter((t) => {
			if (t.hidden || !t.isOwner) return false;
			return (t.x <= x
				&& (t.x + t.width * gridSize) >= x
				&& t.y <= y
				&& (t.y + t.height * gridSize) >= y);
		});
		if (targets.length == 0) return null;

		let token = targets[0];
		if (targets.length > 1) {
			// Select closest to center
			token = targets.reduce((a, b) => {
				const cntr_x_a = a.x + a.width * gridSize / 2;
				const cntr_y_a = a.y + a.height * gridSize / 2;
				const dist_a = Math.sqrt(Math.pow(x - cntr_x_a, 2) + Math.pow(y - cntr_y_a, 2));
				const cntr_x_b = b.x + b.width * gridSize / 2;
				const cntr_y_b = b.y + b.height * gridSize / 2;
				const dist_b = Math.sqrt(Math.pow(x - cntr_x_b, 2) + Math.pow(y - cntr_y_b, 2));
				return (dist_a < dist_b ? a : b);
			});
		}
		return token;
	}
	const types = ["effect", "ActiveEffect", "condition", "ongoing-damage"];
	if (!types.includes(data.type)) return;

	const token = findToken();
	if (!token) return;
	// Render the condition dialog and apply the effect.
	_applyAE(token.actor, data);
	// Return false to prevent Foundry from adding a duplicate effect. This hook
	// must stay synchronous: an async handler returns a Promise, which Foundry
	// reads as truthy and so does not cancel its own drop handling.
	return false;
});

/**
 * Apply a dropped condition, effect, or ongoing damage to an actor.
 * @param {Actor} actor   The actor to apply the effect to.
 * @param {object} data   The drop data.
 * @returns {Promise<ActiveEffect[]|undefined>} The created effects, if created immediately.
 */
async function _applyAE(actor, data) {
	if (data.type === "condition") {
		// Handle hampered in 2e.
		if (CONFIG.ARCHMAGE.is2e && data.id === "hampered") {
			data.id = "hindered";
		}
		// Check for existing statuses.
		let statusEffect = CONFIG.statusEffects.find((x) => x.id === data.id || x.id === data.name?.toLowerCase());
		const ends = data.ends ?? "Unknown";
		if (statusEffect) {
			statusEffect = foundry.utils.duplicate(statusEffect);
			statusEffect.label = game.i18n.localize(statusEffect.name);
			statusEffect.name = statusEffect.label;
			statusEffect.origin = data.source;
			// Add it as a status so that it can be toggled on the token.
			statusEffect.statuses = [statusEffect.id];
			statusEffect.duration = ends;

			return await _applyAEDurationDialog(actor, statusEffect, ends, data.source, data.type);
		}

		// Just a generic condition, transfer the name
		let effectData = {
			name: data.name,
			img: "icons/svg/aura.svg",
			origin: data.source,
			duration: ends
		};
		return await _applyAEDurationDialog(actor, effectData, ends, data.source, data.type);

	}
	else if (data.type === "effect" || data.type === "ActiveEffect") {
		let effect = null;
		let sourceDocument = null;
		if (data.uuid) {
			effect = fromUuidSync(data.uuid);
			sourceDocument = effect.parent?.parent ?? effect.parent;
		}
		else {
			const actorId = data.actorId;
			const sourceActor = game.actors.get(actorId);
			if (sourceActor) {
				effect = sourceActor.effects.get(data.id);
				sourceDocument = sourceActor;
			}
			else {
				effect = {
					name: data.name,
					img: "icons/svg/aura.svg",
					origin: data?.source ?? null
				};
			}
		}
		let effectData = foundry.utils.duplicate(effect);
		const ends = effectData.flags?.archmage?.duration ?? "Unknown";
		return await _applyAEDurationDialog(actor, effectData, ends, sourceDocument?.uuid, data.type);
	}
	else if (data.type == "ongoing-damage") {
		const img = data.value >= 0 ? "icons/svg/degen.svg" : "icons/svg/regen.svg";

		let effectData = {
			name: data.name,
			img: img,
			origin: data.source,
			flags: {
				archmage: {
					ongoingDamage: data.value,
					ongoingDamageType: data.damageType,
					ongoingDamageMultiplier: 1,
					duration: data.ends,
					tooltip: data.tooltip
				}
			}
		};
		return await _applyAEDurationDialog(actor, effectData, data.ends, data.source, data.type);
	}
}

/**
 * Prompt for an effect's duration, then create it on the actor. Shift skips the dialog.
 * @param {Actor} actor          The actor to apply the effect to.
 * @param {object} effectData    The effect data to create.
 * @param {string} duration      The default duration type key.
 * @param {string} source        The UUID of the effect's source.
 * @param {string|null} type     The drop data type.
 * @returns {Promise<ActiveEffect[]|undefined>} The created effects when the dialog is skipped, otherwise undefined.
 */
async function _applyAEDurationDialog(actor, effectData, duration, source, type = null) {
	// If no effectData something went wrong, stop gracefully
	if (effectData == undefined) {
		ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.warnStatusEffect"));
		return;
	}

	// Shift bypass
	if (event?.shiftKey) {
		if (!duration) duration = "Unknown";
		let options = {};
		if (["StartOfNextSourceTurn", "EndOfNextSourceTurn"].includes(duration)) {
			options = { sourceTurnUuid: source };
		}
		game.archmage.MacroUtils.setDuration(effectData, duration, options);
		return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}

	// Render modal dialog
	const sourceActor = await fromUuid(source);
	let durations = foundry.utils.duplicate(CONFIG.ARCHMAGE.effectDurationTypes);
	delete durations.Unknown;
	const template = "systems/archmage/templates/chat/apply-AE.html";
	let dialogData = {
		effectName: effectData.name,
		sourceName: sourceActor?.name ?? "",
		ongoing: effectData?.flags?.archmage?.ongoingDamage ?? false,
		defaultDuration: duration != "Unknown" ? duration : "",
		durations: durations
	};

	foundry.applications.handlebars.renderTemplate(template, dialogData).then((dlg) => {
		new Dialog({
			title: game.i18n.localize("ARCHMAGE.CHAT.applyAETitle"),
			content: dlg,
			buttons: {
				apply: {
					label: game.i18n.localize("ARCHMAGE.CHAT.Apply"),
					callback: (html) => {
						duration = html.find('[name="duration"]:checked').val();
						const ongoing = {
							half: html.find('[name="ongoingHalf"]')?.is(":checked") ?? false,
							double: html.find('[name="ongoingDouble"]')?.is(":checked") ?? false,
							triple: html.find('[name="ongoingTriple"]')?.is(":checked") ?? false
						};
						if (!duration) duration = "Unknown";
						let options = {};
						if (["StartOfNextSourceTurn", "EndOfNextSourceTurn"].includes(duration)) {
							options = { sourceTurnUuid: source };
						}
						else if (duration == "EndOfRound") {
							if (!game.combat) ui.notifications.warn(game.i18n.localize("ARCHMAGE.DURATION.EndOfRoundWarning"));
							options = { round: game.combat?.round || 1 };
						}
						if (ongoing.half) {
							// Kept fractional, it's rounded up when the damage is dealt.
							effectData.flags.archmage.ongoingDamage =
								Number(effectData.flags.archmage.ongoingDamage) / 2;
						}
						if (ongoing.triple) effectData.flags.archmage.ongoingDamageMultiplier = 3;
						else if (ongoing.double) effectData.flags.archmage.ongoingDamageMultiplier = 2;
						game.archmage.MacroUtils.setDuration(effectData, duration, options);
						return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
					}
				},
				cancel: {
					label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
					callback: () => {}
				}
			},
			default: "apply",
			render: (html) => {
				// The damage multiplier checkboxes are mutually exclusive.
				const multipliers = $(html).find('[name="ongoingDouble"], [name="ongoingTriple"]');
				multipliers.on("change", (event) => {
					if (event.currentTarget.checked) multipliers.not(event.currentTarget).prop("checked", false);
				});
			}
		}).render(true);
	});
}

Hooks.on("renderJournalSheet", async (app, html, data) => {
	app._element[0].classList.add("archmage-v2");
});

/* ---------------------------------------------- */

registerChatMessageHooks();

/**
 * Handle a condition button socket message: set its flag on the chat message as GM.
 * @param {object} msg  The socket message data.
 */
function _handleCondButtonMsg(msg) {
	if (!game.archmage.isSocketGM()) return;
	const chatMessage = game.messages.get(msg.msg);
	if (chatMessage) {
		if (msg.disable) {
			// Replace grayed-out with disabled
			msg.disable.classList.remove("grayed-out");
			msg.disable.classList.add("disabled");
			msg.disable.setAttribute("disabled", true);
		}
		else {
			chatMessage.setFlag("archmage", msg.flg, true);
		}
	}
}

/**
 * Handle an effect creation socket message: create the effects on each actor as GM.
 * @param {object} msg  The socket message data.
 */
function _handlecreateAEsMsg(msg) {
	if (!game.archmage.isSocketGM()) return;
	msg.actorIds.forEach((id) => {
		const actor = game.actors.get(id);
		actor.createEmbeddedDocuments("ActiveEffect", msg.effects);
	});
}

/**
 * Handle the creation of pseudo-combatants emitted via sockets.
 *
 * Players lack the permissions needed to alter the initiative order,
 * so the active GM creates the combatant on their behalf.
 *
 * @param {object} msg Operation data from the emitted socket.
 * @returns {void}
 */
function _handlePseudoCombatantMsg(msg) {
	if (!game.archmage.isSocketGM()) return;
	game.archmage.MacroUtils.createPseudoCombatant(msg.combatId, msg.data);
}

/**
 * Handle damage/healing application emitted via sockets.
 *
 * The DamageApplicator class supports applying damage to targeted
 * tokens as an optional feature, and if doing so, it needs to be
 * handled via a socket due to user permissions for unowned targets.
 *
 * @param {object} data Operation data from the emitted socket.
 * @returns {void}
 */
function _handleApplyDamageHealing(data) {
	if (!game.archmage.isSocketGM()) return;
	data.uuids.forEach((uuid) => {
		// Retrieve a copy of the actor.
		const token = fromUuidSync(uuid);
		const actor = token?.actor ?? false;
		if (actor) {
			const updates = {};
			// Handle update operations.
			if (data.operation === "damage") {
				updates[data.attr] = foundry.utils.getProperty(actor, data.attr) - data.value;
			}
			else if (data.operation === "healing") {
				updates[data.attr] = Math.max(0, foundry.utils.getProperty(actor, data.attr)) + data.value;
			}
			else if (data.operation === "tempHealing") {
				const hp = { ...actor.system.attributes.hp };
				if (isNaN(hp.temp) || hp.temp === undefined) hp.temp = 0;
				hp.temp = Math.max(hp.temp, data.value);
				updates[data.attr] = hp.temp;
			}
			// Apply the update, if any.
			if (updates?.[data.attr] !== undefined) {
				actor.update(updates);
			}
		}
	});
}

/**
 * Run an actor's lifecycle hook script for its owning user.
 * @param {object} root0           The socket message data.
 * @param {string} root0.actorId   The ID of the actor whose hook to run.
 * @param {string} root0.hookName  The name of the lifecycle hook to run.
 * @returns {Promise<*>|undefined} The hook script's result, if it ran.
 */
function _handleActorLifecycleHook({ actorId, hookName }) {
	const actor = game.actors.get(actorId);
	if (!actor || game.user.character.id !== actor.id) return;

	// Can't run if you can't run
	if (!game.user.hasPermission("MACRO_SCRIPT")) return;

	const speaker = ChatMessage.implementation.getSpeaker();
	const macroData = {
		// TODO: ???
	};

	const hookBody = actor.system.lifecycleHooks?.[hookName]?.trim();
	if (!hookBody) return;

	const AsyncFunction = async function () {}.constructor;
	try {
		const fn = new AsyncFunction("speaker", "actor", "archmage", hookBody);
		return fn.call(this, speaker, actor, macroData);
	}
	catch(ex) {
		ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errMacroSyntax"));
		console.error(`Lifecycle hook '${actor.name}' / ${hookName} failed with: ${ex}`, ex);
	}
}

Hooks.once("ready", async function () {
	game.socket.on("system.archmage", (data) => {
		switch (data.type) {
			case "shareItem":
				ItemArchmageSheet.handleShareItem(data);
				break;
			case "condButton":
				_handleCondButtonMsg(data);
				break;
			case "createAEs":
				_handlecreateAEsMsg(data);
				break;
			case "pseudoCombatant":
				_handlePseudoCombatantMsg(data);
				break;
			case "applyDamageHealing":
				_handleApplyDamageHealing(data);
				break;
			case "actorLifecycleHook":
				_handleActorLifecycleHook(data);
				break;
			default:
				console.log(data);
		}
	});
});

/* ---------------------------------------------- */

// Update the escalation die tracker. Character values for the escalation die
// are updated in their prepareData() and getRollData() functions.
Hooks.on("renderCombatTracker", async (_combatTracker, _html, { combat }) => {
	// await new Promise(r => setTimeout(r, 250));
	// Handle non-gm users.
	if (combat?.current === undefined) {
		combat = game.combat;
	}

	const escalation = ArchmageUtility.getEscalation(combat);
	const $escalationDiv = $(".archmage-escalation-display");
	$escalationDiv.attr("data-value", escalation);
	$escalationDiv.toggleClass("hide", combat === null);
	$escalationDiv.find(".ed-number h1").text(escalation);

	// Update open sheets.
	for (let app of Object.values(ui.windows)) {
		const appType = app?.object?.type ?? null;
		if (appType == "character" || appType == "npc") {
			app.render();
		}

		if (app.constructor.name === "ArchmageCompendiumBrowserApplication") {
			app.render();
		}
	}
});

/* -------------------------------------------- */

Hooks.on("combatStart", combatStart);

/* -------------------------------------------- */

Hooks.on("combatTurn", combatTurn);

/* -------------------------------------------- */

Hooks.on("combatRound", combatRound);

/* -------------------------------------------- */

Hooks.on("preDeleteCombat", preDeleteCombat);

/* ---------------------------------------------- */

// DEPRECATED?
/* // Update escalation die values on scene change.
Hooks.on('renderCombatTracker', (async () => {
  // Handle non-gm users.
  let combat = game.combat;
  let escalation = 0;
  let $escalationDiv = $('.archmage-escalation');

  // Restore the escalation die.
  if (combat !== null) {
    escalation = ArchmageUtility.getEscalation(combat);
    $escalationDiv.removeClass('hide');
  }
  // Hide the escalation die.
  else {
    $escalationDiv.addClass('hide');
  }
  // Update the value of the tracker.
  $escalationDiv.attr('data-value', escalation);
  $escalationDiv.find('.ed-number').text(escalation);
})); */

/* ---------------------------------------------- */

Hooks.on("deleteCombat", (combat) => {
	// Clear the escalation die.
	$(".archmage-escalation").addClass("hide");

	if (!game.user.isGM) return;

	// Clear out death saves, per combat resources and temp HP.
	let combatants = combat.combatants;
	if (combatants) {
		// Retrieve the character actors.
		let actors = combatants.filter((c) => c?.actor?.type == "character");
		let updatedActors = {};
		// Iterate over the actors for updates.
		actors.forEach(async (a) => {
			// Only proceed if this combatant has an actor and hasn't been updated.
			if (a.actor && !updatedActors[a.actor._id]) {
				// Retrieve the actor.
				let actor = a.actor;
				// Perform the update.
				if (actor) {
					let updates = {};
					updates["system.attributes.hp.temp"] = 0;
					await actor.update(updates);
					updatedActors[actor._id] = true;
				}
			}
		});
	}
});

Hooks.on("createCombatant", (document, data, options, id) => {
	if (!game.user.isGM) return;
	let actor = document.actor;
	// Add command points at start of combat.
	if (actor && actor.type == "character") {
		let updates = {};
		let hasStrategist = actor.items.find((i) => i.name.toLowerCase().includes(game.i18n.localize("ARCHMAGE.CHAT.strategist")));
		let basePoints = hasStrategist ? 2 : 1;
		// TODO: Add support for Forceful Command.
		updates["system.resources.perCombat.commandPoints.current"] = basePoints;
		actor.update(updates);
	}
});

/* ---------------------------------------------- */

Hooks.on("dcCalcWhitelist", (whitelist, actor) => {
	// Add whitelist support for the calculator.
	whitelist.archmage = {
		flags: {
			adv: true
		},
		abilities: [
			"str",
			"dex",
			"con",
			"int",
			"wis",
			"cha"
		],
		attributes: [
			"init",
			"level",
			"standardBonuses"
		],
		custom: {
			abilities: {},
			attributes: {
				levelHalf: {
					label: "level_half",
					name: "1/2 Level",
					formula: actor.system.attributes.level !== undefined
						? Math.floor(actor.system.attributes.level.value / 2)
						: 0
				},
				escalation: {
					label: "escalation",
					name: "Esc. Die",
					formula: "@attr.escalation.value"
				},
				melee: {
					label: "melee",
					name: "W [Melee]",
					formula: "@attr.weapon.melee.value"
				},
				ranged: {
					label: "ranged",
					name: "W [Ranged]",
					formula: "@attr.weapon.ranged.value"
				},
				standardBonus: {
					label: "standard_bonuses",
					name: "Standard Bonuses",
					formula: "@attr.standardBonuses.value"
				}
			},
			custom: {}
		}
	};

	// Replace the ability attributes in the calculator with custom formulas.
	let levelMultiplier = 1;
	if (actor.system.attributes.level.value >= 5) {
		levelMultiplier = 2;
	}
	if (actor.system.attributes.level.value >= 8) {
		levelMultiplier = 3;
	}

	if (levelMultiplier > 1) {
		for (let prop of whitelist.archmage.abilities) {
			whitelist.archmage.custom.custom[prop] = {
				label: prop,
				name: `${levelMultiplier}${prop}`,
				formula: `@abil.${prop}.dmg`
			};
		}
	}
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createArchmageMacro(data, slot) {
	// First, determine if this is a valid owned item.
	if (data.type !== "Item") return;
	if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
		return ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.warnMacroOnlyOwnedItems"));
	}
	// If it is, retrieve it based on the uuid.
	const item = await Item.fromDropData(data);
	// Create the macro command
	const command = `game.archmage.rollItemMacro("${item.uuid}");`;
	// Some compendium entries may have incorrect images for their type.
	const img = item.img !== CONFIG.ARCHMAGE.defaultTokens.character
		? item.img
		: CONFIG.ARCHMAGE.defaultTokens[item.type];
	// Create the macro document.
	const macro = await Macro.create({
		name: item.name,
		type: "script",
		img: img,
		command: command,
		flags: {
			"archmage.itemMacro": true,
			"archmage.itemUuid": data.uuid
		}
	});
	// Assign it to the hotbar.
	game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemData  The item's UUID, or its name on the speaker's actor.
 * @returns {Promise<*>|undefined} The item roll when loaded by name, otherwise undefined.
 */
function rollItemMacro(itemData) {
	// Reconstruct the drop data so that we can load the item.
	if (itemData.includes("Item.")) {
		const dropData = {
			type: "Item",
			uuid: itemData
		};
		Item.fromDropData(dropData).then((item) => {
			// Determine if the item loaded and if it's an owned item.
			if (!item || !item.parent) {
				const itemName = item?.name ?? itemData;
				return ui.notifications.warn(game.i18n.format("ARCHMAGE.UI.warnMacroItemNotFound", { item: itemName }));
			}

			// Trigger the item roll
			item.roll();
		});
	}
	// Load item by name from the actor.
	else {
		const speaker = ChatMessage.getSpeaker();
		const itemName = itemData;
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);
		const item = actor ? actor.items.find((i) => i.name === itemName) : null;
		if (!item) return ui.notifications.warn(game.i18n.format("ARCHMAGE.UI.warnMacroItemNotOnActor", { item: itemName }));

		// Trigger the item roll
		return item.roll();
	}
}
