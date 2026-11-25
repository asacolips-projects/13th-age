/**
 * The corpus: hand-picked PC/power/target combinations from the system packs, with
 * independently reasoned expected outcomes. This file is the reviewable spec; the
 * generator turns it into test/corpus/scenarios.json, which the corpus tests read.
 *
 * Every scenario names its pack documents by file so a pack edit that changes a used
 * value breaks generation loudly instead of silently changing what the tests measure.
 *
 * Expected outcomes are authored here, by hand, from the game rules - never derived by
 * running the production code. A regression that changes behavior fails these tests
 * instead of silently rebaselining.
 */

/** Pre-resolved monster targets (pack files; numbers verified from the pack). */
export const MONSTERS = {
	goblinScum: { pack: "srd-monsters", file: "Goblin_Scum_WXMiBSHV9Kujf46n.yml", name: "Goblin Scum" },
	orcRager: { pack: "srd-monsters", file: "Orc_Rager_YtnqxLcuPLZzxwQg.yml", name: "Orc Rager" },
	hillGiant: { pack: "srd-monsters", file: "Hill_Giant_qx4dKzHiCKZEI39v.yml", name: "Hill Giant" },
	brokenTaranar: { pack: "srd-monsters", file: "Broken_Taranar_quaqrSQgPKggkKYy.yml", name: "Broken Taranar" }
};

/**
 * Scenario factory shorthand. Fields:
 * - pc: pregen file stem (without .yml)
 * - power: power item name within that pregen
 * - targets: named target setups with optional overrides
 * - rolls: fixed d20 faces, one per attack roll on the card
 * - damageTotals: fixed totals for target-count and damage inline rolls
 * - settings: game-settings overrides for the scenario
 * - expect: independently derived expectations (outcome booleans and selected targets)
 */
export const SCENARIOS = [
	// -- Wizard: auto-hit power -------------------------------------------------
	{
		id: "wizard-5-magic-missile-auto-hit",
		pc: "Explorer_Wizard_5_atT9xG6slENAVPLF",
		power: "Magic Missile",
		targets: [{ monster: "orcRager" }],
		rolls: [],
		damageTotals: {},
		settings: {},
		expect: {
			attackRowPresent: true,
			hasRolls: false,
			outcome: "hit", // "Automatic hit": no d20, auto-hit branch
			// The pack power has no Hit row; the outcome lives in the evaluation result.
			targetsHit: undefined,
			targetsMissed: []
		}
	},

	// -- Wizard: MD spell with condition-bearing hit/miss rows -------------------
	{
		id: "wizard-5-hold-monster-md-hit-dazed-miss",
		pc: "Explorer_Wizard_5_atT9xG6slENAVPLF",
		power: "Hold Monster",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 14 }], // d20 14 + int 4 + std 5 = 23 vs MD 16 -> hit
		damageTotals: {},
		settings: {},
		expect: {
			defense: "MD",
			outcome: "hit",
			targetsHit: ["Orc Rager"],
			targetsMissed: []
		}
	},
	{
		id: "wizard-5-hold-monster-md-miss-dazed",
		pc: "Explorer_Wizard_5_atT9xG6slENAVPLF",
		power: "Hold Monster",
		targets: [{ monster: "hillGiant" }],
		rolls: [{ natural: 4 }], // 4 + 4 + 5 = 13 vs MD 14 -> miss
		damageTotals: {},
		settings: {},
		expect: {
			defense: "MD",
			outcome: "miss",
			targetsMissed: ["Hill Giant"]
		}
	},

	// -- Sorcerer: PD breath with a 1d2 target roll ------------------------------
	{
		id: "sorcerer-5-breath-white-1d2-two-targets",
		pc: "Dragon_Sorcerer_5_GT9JjvD6EPOlRP5O",
		power: "Breath of the White",
		targets: [{ monster: "orcRager" }, { monster: "hillGiant" }],
		rolls: [{ natural: 11 }, { natural: 12 }], // cha 5 + std 5 = +10: 21 vs PD 20 hit; 22 vs PD 20 hit
		damageTotals: { target: 2, hit: 20 },
		settings: {},
		expect: {
			defense: "PD",
			outcome: "hit",
			targetCount: 2,
			targetsHit: ["Orc Rager", "Hill Giant"]
		}
	},

	// -- Sorcerer: even-trigger ongoing damage -----------------------------------
	{
		id: "sorcerer-5-scorching-ray-even-trigger-active",
		pc: "Dragon_Sorcerer_5_GT9JjvD6EPOlRP5O",
		power: "Scorching Ray",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 12 }], // 12 + 10 = 22 vs PD 20 -> hit, even -> "Even Hit" row active
		damageTotals: { hit: 10, hitEven: 8 }, // [[1d8]] ongoing fire fixed to 8
		settings: {},
		expect: {
			defense: "PD",
			outcome: "hit",
			triggerRows: [{ label: "even hit", state: "trigger-active" }]
		}
	},
	{
		id: "sorcerer-5-scorching-ray-even-trigger-inactive",
		pc: "Dragon_Sorcerer_5_GT9JjvD6EPOlRP5O",
		power: "Scorching Ray",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 11 }], // odd hit
		damageTotals: { hit: 10, hitEven: 8 },
		settings: {},
		expect: {
			outcome: "hit",
			triggerRows: [{ label: "even hit", state: "trigger-inactive" }]
		}
	},

	{
		id: "wizard-5-sleep-md-hit-unconscious",
		pc: "Explorer_Wizard_5_atT9xG6slENAVPLF",
		power: "Sleep",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 14 }], // 14 + 4 + 5 = 23 vs MD 16 -> hit
		damageTotals: {},
		settings: {},
		expect: {
			defense: "MD",
			outcome: "hit"
		}
	},

	// -- Sorcerer: even-trigger with ongoing-damage effect link ------------------
	{
		id: "sorcerer-5-breath-green-ongoing-poison",
		pc: "Dragon_Sorcerer_5_GT9JjvD6EPOlRP5O",
		power: "Breath of the Green",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 16 }], // 26 vs PD 20 hit
		damageTotals: { hit: 25 },
		settings: {},
		expect: {
			outcome: "hit",
			// Hit row carries "15 + 10 = 25 ongoing poison damage": the ongoing regex
			// must link it.
			ongoingLinks: [{ value: 25, type: "poison", ends: "Unknown" }]
		}
	},

	// -- Barbarian: 2d20kh rage dice ---------------------------------------------
	{
		id: "barbarian-5-rage-melee-2d20kh-crit",
		pc: "Unstoppable_Barbarian_5_qP1EO9RjcBhMsEu7",
		power: "(Rage) Melee attack",
		targets: [{ monster: "goblinScum" }],
		rolls: [{ natural: 19, natural2: 15 }], // kept 19: crit; 19 + str 4 + std 5 = 28 vs AC 16 hit
		damageTotals: { hit: 17 },
		settings: {},
		expect: {
			defense: "AC",
			outcome: "crit",
			targetsHit: ["Goblin Scum"]
		}
	},
	{
		id: "barbarian-5-rage-melee-2d20kh-miss",
		pc: "Unstoppable_Barbarian_5_qP1EO9RjcBhMsEu7",
		power: "(Rage) Melee attack",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 3, natural2: 9 }], // kept 9: 9 + 9 = 18 vs AC 22 miss
		damageTotals: { hit: 17, miss: 5 },
		settings: {},
		expect: {
			outcome: "miss",
			targetsMissed: ["Orc Rager"]
		}
	},

	// -- Barbarian: fumble on a natural 1 ----------------------------------------
	{
		id: "barbarian-1-melee-natural-1-fumble",
		pc: "Unstoppable_Barbarian_1_nleq1FMYYGgTg9Ox",
		power: "Melee attack (Barbarian)",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 1 }], // natural 1 fumbles regardless of total
		damageTotals: { hit: 12, miss: 1 },
		settings: {},
		expect: {
			outcome: "miss",
			fumble: true,
			targetsMissed: ["Orc Rager"]
		}
	},

	// -- Fighter: dual-wield reroll on a natural 2 --------------------------------
	{
		id: "fighter-5-dualwield-natural-2-reroll",
		pc: "Winner_Fighter_5_yZYlThN227uKTpBk",
		power: "Melee attack (Fighter)",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 2 }], // dual-wielder: natural 2 flags a reroll; 2 + 4 + 5 = 11 vs AC 22 miss
		damageTotals: { hit: 16, miss: 5 },
		settings: {},
		expect: {
			outcome: "miss",
			reroll: true,
			targetsMissed: ["Orc Rager"]
		}
	},

	// -- Rogue: single-target melee at level 1 ------------------------------------
	{
		id: "rogue-1-melee-hit",
		pc: "Assassin_Rogue_1_6HIMT1iym095GExy",
		power: "Melee attack (Rogue)",
		targets: [{ monster: "goblinScum" }],
		rolls: [{ natural: 13 }], // 13 + dex 4 + std 1 = 18 vs AC 16 hit
		damageTotals: { hit: 12 },
		settings: {},
		expect: {
			defense: "AC",
			outcome: "hit",
			targetsHit: ["Goblin Scum"]
		}
	},

	// -- Ranger: even-triggered repeat attack row ---------------------------------
	{
		id: "ranger-5-double-melee-even-hit-repeat",
		pc: "Multi_Attack_Ranger_5_5su1JHGlj5QVxTij",
		power: "Double Melee Attack (Attack)",
		targets: [{ monster: "goblinScum" }],
		rolls: [{ natural: 14 }], // 14 + str 4 + std 5 + 1 = 24 vs AC 16 hit, even -> repeat row
		damageTotals: { hit: 18 },
		settings: {},
		expect: {
			defense: "AC",
			outcome: "hit",
			triggerRows: [{ label: "even hit", state: "trigger-active" }]
		}
	},

	// -- Bard: 1d4 multi-target against PD ----------------------------------------
	{
		id: "bard-5-soundburst-1d4-three-of-four",
		pc: "Battlethunder_Bard_5_6ovnxjMn2oITjm6F",
		power: "Soundburst",
		targets: [
			{ monster: "orcRager" }, { monster: "hillGiant" }, { monster: "orcRager", name: "Orc Rager 2" }, { monster: "orcRager", name: "Orc Rager 3" }
		],
		rolls: [{ natural: 8 }, { natural: 18 }, { natural: 5 }, { natural: 12 }],
		// cha 4 + std 5 = +9: 17 vs PD 20 miss; 27 hit; 14 miss; 21 hit
		damageTotals: { target: 4, hit: 22 },
		settings: {},
		expect: {
			defense: "PD",
			targetCount: 4,
			targetsHit: ["Hill Giant", "Orc Rager 3"],
			targetsMissed: ["Orc Rager", "Orc Rager 2"]
		}
	},

	// -- Bard: 1d4+1 target roll, more targets selected than the roll allows -------
	{
		id: "bard-5-song-of-thunder-caps-at-roll",
		pc: "Battlethunder_Bard_5_6ovnxjMn2oITjm6F",
		power: "Song of Thunder",
		targets: [
			{ monster: "orcRager" }, { monster: "hillGiant" }, { monster: "orcRager", name: "Orc Rager 2" }
		],
		rolls: [{ natural: 12 }, { natural: 13 }, { natural: 14 }],
		damageTotals: { target: 2, hit: 22 }, // roll says 2, three selected: cap at 2
		settings: {},
		expect: {
			targetCount: 2,
			targetsHit: ["Orc Rager", "Hill Giant"],
			targetsMissed: [],
			excludedTarget: "Orc Rager 2"
		}
	},

	// -- Paladin: smite bonus flat term --------------------------------------------
	{
		id: "paladin-5-smite-evil-hit",
		pc: "Divine_Paladin_5_4ETnAxMTOC0Oy2Nw",
		power: "Smite Evil",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 10 }], // 10 + str 3 + std 5 + 4 = 22 vs AC 22 hit (exactly)
		damageTotals: { hit: 31 },
		settings: {},
		expect: {
			defense: "AC",
			outcome: "hit",
			note: "Total equals defense: ties hit.",
			targetsHit: ["Orc Rager"]
		}
	},

	// -- Vulnerabilities: fire-vulnerable target, 1e chat setting on ---------------
	{
		id: "sorcerer-5-scorching-ray-vulnerable-fire",
		pc: "Dragon_Sorcerer_5_GT9JjvD6EPOlRP5O",
		power: "Scorching Ray",
		targets: [{ monster: "brokenTaranar" }], // Broken Taranar: vulnerable to cold, fire
		rolls: [{ natural: 13 }], // 23 vs PD 18 hit
		damageTotals: { hit: 10 },
		settings: { showVulnsInChat: true },
		expect: {
			outcome: "hit",
			vulnerabilities: ["cold", "fire"],
			vulnRow: true
		}
	},

	// -- Conditions: vulnerable condition contributes its type ----------------------
	{
		id: "wizard-5-acid-arrow-vulnerable-condition",
		pc: "Explorer_Wizard_5_atT9xG6slENAVPLF",
		power: "Acid Arrow",
		targets: [{ monster: "orcRager", effects: ["vulnerable"] }],
		rolls: [{ natural: 17 }], // 17 + 4 + 5 = 26 vs PD 20 hit
		damageTotals: { hit: 27 },
		settings: { showVulnsInChat: true },
		expect: {
			outcome: "hit",
			vulnerabilities: ["vulnerable"],
			vulnRow: true
		}
	},

	// -- Settings: optional 18+ crit range -------------------------------------------
	{
		id: "fighter-5-melee-18-crit-range",
		pc: "Winner_Fighter_5_yZYlThN227uKTpBk",
		power: "Melee attack (Fighter)",
		targets: [{ monster: "orcRager" }],
		rolls: [{ natural: 18 }], // 18 + 9 = 27 vs AC 22; 18 crits with the optional rule
		damageTotals: { hit: 16 },
		settings: { optionalBaseCritRange: true },
		expect: {
			outcome: "crit",
			targetsHit: ["Orc Rager"]
		}
	},

	// -- No targets selected: rolls stand alone --------------------------------------
	{
		id: "rogue-5-melee-no-targets",
		pc: "Assassin_Rogue_5_pjn3LFHu2cMowjqG",
		power: "Melee attack (Rogue)",
		targets: [],
		rolls: [{ natural: 15 }],
		damageTotals: { hit: 19 },
		settings: {},
		expect: {
			outcome: "undecided",
			targetsHit: [],
			targetsMissed: []
		}
	},

	// -- Unowned item: no attacker document ------------------------------------------
	{
		id: "unowned-item-no-attacker",
		pc: null,
		power: { pack: "rogue", file: "Sure_Cut_bhHw9nWiVPHqYYgG" },
		targets: [{ monster: "goblinScum" }],
		rolls: [{ natural: 16 }],
		damageTotals: { hit: 9 },
		settings: {},
		expect: {
			// Without an attacker only the power's own modifier applies: 16 + 0 = 16 vs AC 16 hit.
			outcome: "hit",
			targetsHit: ["Goblin Scum"]
		}
	}
];
