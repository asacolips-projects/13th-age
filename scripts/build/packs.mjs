import fs from "node:fs";
import path from "node:path";
import { PACK_DEST, PACK_SRC } from "./constants.mjs";
import { getFvttCommand, log, spawnCommand } from "./utils.mjs";

/**
 * Delete the compiled compendium packs in dist/packs.
 * @returns {Promise<void>}
 */
export async function cleanPacks() {
	if (fs.existsSync(PACK_DEST)) {
		fs.rmSync(PACK_DEST, { recursive: true, force: true });
	}
	log("packs", "cleaned dist/packs");
}

/**
 * Compile each YAML pack folder in src/packs/src into a LevelDB pack in dist/packs.
 * @returns {Promise<void>}
 */
export async function compilePacks() {
	const folders = fs.readdirSync(PACK_SRC).filter((entry) => {
		return fs.statSync(path.join(PACK_SRC, entry)).isDirectory();
	});

	const fvtt = getFvttCommand();

	for (const folder of folders) {
		const folderPath = path.join(PACK_SRC, folder);
		await spawnCommand(fvtt, [
			"package",
			"--id", "archmage",
			"--type", "System",
			"pack", folder,
			"-c",
			"--yaml",
			"--in", folderPath,
			"--out", PACK_DEST
		]);
	}

	log("packs", `compiled ${folders.length} compendia`);
}

/**
 * Extract each compiled pack in dist/packs back to YAML in src/packs/src.
 * @returns {Promise<void>}
 */
export async function extractPacks() {
	const entries = fs.readdirSync(PACK_DEST);
	const fvtt = getFvttCommand();

	for (const entry of entries) {
		const stem = path.parse(entry).name;
		await spawnCommand(fvtt, [
			"package",
			"--id", "archmage",
			"--type", "System",
			"unpack", stem,
			"-c",
			"--yaml",
			"--in", "dist/packs",
			"--out", `src/packs/src/${stem}`
		]);
	}

	log("packs", `extracted ${entries.length} compendia`);
}
