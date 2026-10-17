import fs from "node:fs";
import path from "node:path";
import { SYSTEM_COPY } from "./constants.mjs";
import { copyFileWithReplace, destPathFor, globFiles, log, matchesGlobs, removeFile, resolveFromRoot } from "./utils.mjs";

/**
 *
 * @param root0
 * @param root0.prod
 */
export async function copyFiles({ prod = false } = {}) {
	const files = await globFiles(SYSTEM_COPY);

	for (const file of files) {
		await copyFileWithReplace(file, destPathFor(file), { prod });
	}

	log("copy", `copied ${files.length} files${prod ? " (prod)" : ""}`);
}

/**
 * Copy only the files that changed during watch, rather than re-copying the
 * full SYSTEM_COPY tree on every save.
 *
 * @param {string[]} changedPaths  Absolute paths of changed source files.
 * @param {{ prod?: boolean }} [options]
 */
export async function copyChangedPaths(changedPaths, { prod = false } = {}) {
	const root = resolveFromRoot(".");
	let copied = 0;
	let removed = 0;

	for (const file of changedPaths) {
		// Patterns in SYSTEM_COPY are root-relative, while the dest path strips
		// the src/ prefix (mirrors copyFiles).
		const rootRelative = path.relative(root, file).replaceAll("\\", "/");
		if (!matchesGlobs(rootRelative, SYSTEM_COPY)) continue;

		const dest = destPathFor(file);

		// The watcher queues unlink events alongside changes: if the source is
		// gone by the time this batch runs, drop the stale copy from dist.
		if (!fs.existsSync(file)) {
			removeFile(dest);
			removed += 1;
			continue;
		}

		await copyFileWithReplace(file, dest, { prod });
		copied += 1;
	}

	const summary = [];
	if (copied > 0) summary.push(`copied ${copied} changed file${copied === 1 ? "" : "s"}`);
	if (removed > 0) summary.push(`removed ${removed} dist file${removed === 1 ? "" : "s"}`);
	if (summary.length > 0) log("copy", summary.join(", "));
}
