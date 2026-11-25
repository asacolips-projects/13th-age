/**
 * Load actor and power documents from the pack YAML sources, the way Foundry loads
 * them from a compendium. Reads src/packs/src directly so the corpus tracks the
 * playable data, and resolves the derived numbers an actor gets at prepareData time
 * (ability modifiers from values, tier multipliers, the standard bonus).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const PACK_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/packs/src");

/** Tier multiplier by level, from CONFIG.ARCHMAGE.tierMultPerLevel. */
const TIER_MULT_PER_LEVEL = [0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4];

/**
 * Load one YAML document from a pack folder.
 * @param {string} pack Pack folder name, e.g. "pregen-characters".
 * @param {string} file File name, e.g. "Assassin_Rogue_1_6HIMT1iym095GExy.yml".
 * @returns {object} The raw document.
 */
export function loadPackDoc(pack, file) {
	const filePath = path.join(PACK_SRC, pack, file);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Pack document not found: ${pack}/${file}`);
	}
	return yaml.load(fs.readFileSync(filePath, "utf8"));
}

/**
 * List the YAML files of a pack folder.
 * @param {string} pack
 * @returns {string[]}
 */
export function packFiles(pack) {
	return fs.readdirSync(path.join(PACK_SRC, pack)).filter((f) => f.endsWith(".yml"));
}

/**
 * The full pack entry name, e.g. "archmage.pregen-characters".
 * @param {string} pack
 * @returns {string}
 */
export function packName(pack) {
	return `archmage.${pack}`;
}

/**
 * An actor as the roll engine reads it: attributes, details and (for characters)
 * resolved ability numbers. Mirrors Actor.prepareData/getRollData for the fields
 * the corpus needs, without instantiating a Foundry document.
 * @param {object} doc Raw actor document.
 * @returns {object}
 */
export function actorOf(doc) {
	const system = doc.system;
	const level = system.attributes.level.value;
	const abilities = {};
	if (system.abilities) {
		for (const [key, abl] of Object.entries(system.abilities)) {
			// Stored mods are stale (0); prepareData recomputes from the value, then applies
			// the key modifier by lowering mod2 to mod1. The dmg field is tierMult * mod.
			let mod = Math.floor((abl.value - 10) / 2);
			abilities[key] = { mod, dmg: TIER_MULT_PER_LEVEL[level] * mod };
		}
		const keyMod = system.attributes.keyModifier;
		if (keyMod?.mod1 && keyMod?.mod2 && abilities[keyMod.mod2]) {
			abilities[keyMod.mod2].mod = Math.min(abilities[keyMod.mod1].mod, abilities[keyMod.mod2].mod);
			abilities[keyMod.mod2].dmg = TIER_MULT_PER_LEVEL[level] * abilities[keyMod.mod2].mod;
		}
	}

	// Active attack-bonus equipment. The pregens have none; the resolver stays honest
	// by summing what a real actor would.
	const atkBonuses = { m: 0, r: 0, a: 0, d: 0 };
	for (const item of doc.items ?? []) {
		if (item.type === "equipment" && item.system?.isActive) {
			for (const key of ["melee", "ranged", "arcane", "divine"]) {
				const bonus = item.system?.attributes?.attack?.[key]?.bonus;
				if (bonus) atkBonuses[key[0]] += bonus;
			}
		}
	}

	return {
		id: doc._id,
		name: doc.name,
		type: doc.type,
		pack: null, // filled by the scenario builder
		uuid: `Compendium.${packName("pregen-characters")}.${doc._id}`,
		level,
		classes: system.details?.detectedClasses ?? [],
		dualwield: system.attributes?.weapon?.melee?.dualwield ?? false,
		critAtkMod: system.attributes?.critMod?.atk?.value ?? 0,
		std: level, // standardBonuses = level + escalation, escalation 0 outside combat
		abilities,
		atk: atkBonuses,
		attributes: {
			ac: system.attributes.ac.value,
			pd: system.attributes.pd.value,
			md: system.attributes.md.value,
			critDefMod: system.attributes?.critMod?.def?.value ?? 0
		},
		vulnerability: system.details?.vulnerability?.value ?? "",
		raw: doc
	};
}

/**
 * A target token built from an npc pack document, shaped like the token documents
 * HitEvaluation and the damage applicator read.
 * @param {object} doc Raw npc actor document.
 * @param {object} [options]
 * @param {string} [options.name] Token name override.
 * @param {string[]} [options.effects] Actor effect names, e.g. ["vulnerable"].
 * @param {string} [options.vulnerability] Vulnerability text override.
 * @returns {object}
 */
export function targetOf(doc, options = {}) {
	const a = doc.system.attributes;
	return {
		id: doc._id,
		name: options.name ?? doc.name,
		actor: {
			type: doc.type,
			system: {
				attributes: {
					ac: { value: a.ac.value },
					pd: { value: a.pd.value },
					md: { value: a.md.value },
					critMod: {
						atk: { value: a.critMod?.atk?.value ?? 0 },
						def: { value: a.critMod?.def?.value ?? 0 }
					}
				},
				details: {
					vulnerability: { value: options.vulnerability ?? doc.system.details?.vulnerability?.value ?? "" }
				}
			},
			effects: (options.effects ?? []).map((name) => ({
				name,
				statuses: new Set([name])
			}))
		}
	};
}
