/**
 * Shared helpers for the corpus test suites: loads the generated scenarios and wires
 * their settings into the shared Foundry-shaped globals from test/setup.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { SCENARIOS_JSON } from "./paths.mjs";

const data = JSON.parse(fs.readFileSync(SCENARIOS_JSON, "utf8"));

// JSON has no Sets: the generator writes statuses as an object (Set -> JSON gives
// {}). Restore real Sets from the effect names, mirroring live effect documents.
for (const s of data.scenarios) {
	for (const target of s.fixture.targets) {
		for (const effect of target.actor?.effects ?? []) {
			const names = Array.isArray(effect.statuses)
				? effect.statuses
				: Object.keys(effect.statuses ?? {});
			if (names.length === 0 && effect.name) names.push(effect.name);
			effect.statuses = new Set(names);
		}
	}
}

/** All generated scenarios, in file order. */
export const scenarios = data.scenarios;

/**
 * One scenario by id (throws on a bad id, so typos fail loudly).
 * @param {string} id Scenario id.
 * @returns {object} The scenario record.
 */
export const scenario = (id) => {
	const found = data.scenarios.find((s) => s.id === id);
	if (!found) throw new Error(`Unknown corpus scenario: ${id}`);
	return found;
};

/**
 * Apply a scenario's game settings to the shared globals, and return a reset function.
 * @param {object} settings Scenario settings, e.g. { showVulnsInChat: true }.
 * @returns {() => void} Restore the defaults.
 */
export function applySettings(settings) {
	const defaults = { ...game.settings._values };
	for (const [key, value] of Object.entries(settings)) {
		game.settings.set(key, value);
	}
	return () => {
		for (const [key, value] of Object.entries(defaults)) {
			game.settings.set(key, value);
		}
	};
}

export { path };
