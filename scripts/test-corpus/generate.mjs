/**
 * Generate test/corpus/scenarios.json from scripts/test-corpus/scenario-spec.mjs.
 *
 * Resolves every scenario's pack documents, computes the attack bonuses the same way
 * the actor's prepareData does, renders the chat-card rows, and records the expected
 * outcomes authored in the spec. The output is a pure fixture: no Foundry, no network.
 *
 * Usage: npm run generateTestCorpus
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, MONSTERS } from "./scenario-spec.mjs";
import { loadPackDoc, actorOf, targetOf, packName } from "./pack-loader.mjs";
import { powerCardRows } from "./pack-card.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "test", "corpus", "scenarios.json");

/** Localized row labels, from src/languages/en.yaml ARCHMAGE.CHAT. */
const CHAT_LABELS = {
	trigger: "Trigger", sustainOn: "Sustain On", target: "Target", always: "Always",
	attack: "Attack", hit: "Hit", hitEven: "Even Hit", hitOdd: "Odd Hit",
	crit: "Crit", miss: "Miss", missEven: "Even Miss", missOdd: "Odd Miss", resources: "Resources"
};

/**
 * Resolve one target setup to a token document.
 * @param {object} setup Target setup from the spec: monster key plus optional name,
 *   effects and vulnerability overrides.
 * @returns {object} A token document shaped for the roll engine.
 */
function resolveTarget(setup) {
	const monster = MONSTERS[setup.monster];
	if (!monster) throw new Error(`Unknown monster key: ${setup.monster}`);
	const doc = loadPackDoc(monster.pack, monster.file);
	return targetOf(doc, { name: setup.name, effects: setup.effects, vulnerability: setup.vulnerability });
}

/**
 * Build the attacker document the handler receives (options.actor shape), from a
 * resolved pregen actor.
 * @param {object} actor Resolved actor from pack-loader.actorOf.
 * @returns {object} The actor document shape HitEvaluation reads.
 */
function attackerDocument(actor) {
	return {
		type: actor.type,
		system: {
			attributes: {
				critMod: { atk: { value: actor.critAtkMod } },
				weapon: { melee: { dualwield: actor.dualwield } }
			},
			details: {
				detectedClasses: actor.classes,
				level: { value: actor.level }
			}
		}
	};
}

/**
 * Build one scenario record.
 * @param {object} spec Scenario spec from scenario-spec.mjs.
 * @returns {object} The scenario record written to test/corpus/scenarios.json.
 */
function buildScenario(spec) {
	// Attacker: a pregen PC, or null for the unowned-item case.
	let actor = null;
	let pcSource = null;
	if (spec.pc) {
		const doc = loadPackDoc("pregen-characters", `${spec.pc}.yml`);
		actor = actorOf(doc);
		actor.pack = packName("pregen-characters");
		pcSource = { pack: "pregen-characters", file: `${spec.pc}.yml`, id: actor.id };
	}

	// Power: by name from the PC, or a standalone pack document (unowned item).
	let power;
	let powerSource;
	if (spec.pc) {
		power = (actor.raw.items ?? []).find((i) => i.type === "power" && i.name === spec.power);
		if (!power) throw new Error(`Power '${spec.power}' not in ${spec.pc}`);
		powerSource = { pack: "pregen-characters", item: spec.power };
	}
	else {
		power = loadPackDoc(spec.power.pack, `${spec.power.file}.yml`);
		powerSource = { pack: spec.power.pack, file: `${spec.power.file}.yml`, id: power._id };
	}

	const targets = spec.targets.map(resolveTarget);

	// Card rows: the pack power rendered with the fixed rolls and totals.
	// The pack attack line holds a single roll; rollItemAdjustAttacks repeats it per
	// selected target (capped by the power's target count), so the rendered card
	// carries one anchor per target. Spec rolls list one outcome per *target*.
	const specTargetCount = spec.damageTotals.target ?? 1;
	const rollTargetCount = spec.rolls.length; // one fixed roll per target on the card
	const targetCount = Math.min(specTargetCount, Math.max(targets.length, 1));
	const perLine = Math.max(1, Math.min(rollTargetCount, targetCount));
	const attackRolls = [];
	for (let i = 0; i < perLine; i++) attackRolls.push(spec.rolls[i]);
	const rows = powerCardRows({
		power,
		actor: actor ?? { abilities: {}, std: 0, atk: {} },
		rolls: attackRolls,
		damageTotals: spec.damageTotals,
		// The pack line rolls once; repeat it per target by pre-expanding the line.
		repeatAttack: perLine,
		labels: CHAT_LABELS
	});

	return {
		id: spec.id,
		note: spec.expect.note ?? undefined,
		source: {
			pc: pcSource,
			power: powerSource,
			powerId: power._id,
			targets: spec.targets.map((t) => ({
				monster: MONSTERS[t.monster].file,
				name: t.name ?? MONSTERS[t.monster].name,
				effects: t.effects ?? []
			}))
		},
		options: {
			type: spec.pc ? "power" : "item",
			critMod: 0,
			// The handler reads options.targets for the multi-target roll count.
			targets: spec.damageTotals.target ?? 1
		},
		settings: {
			optionalBaseCritRange: false,
			secondEdition: false,
			multiTargetAttackRolls: false,
			showDefensesInChat: false,
			showVulnsInChat: false,
			...spec.settings
		},
		fixture: {
			actor: actor ? attackerDocument(actor) : null,
			targets,
			rows,
			// The d20 data the tests re-derive: naturals as rolled on the card,
			// one entry per placed attack roll.
			rolls: attackRolls
		},
		expect: spec.expect
	};
}

const scenarios = SCENARIOS.map(buildScenario);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify({
	generated: "by scripts/test-corpus/generate.mjs - edit scenario-spec.mjs and rerun, do not edit by hand",
	scenarios
}, null, "\t")}\n`);

console.log(`Generated ${scenarios.length} scenarios -> ${path.relative(ROOT, OUT)}`);
