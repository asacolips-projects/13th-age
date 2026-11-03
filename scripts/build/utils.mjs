import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { minimatch } from "minimatch";
import { ROOT } from "./constants.mjs";

/**
 * Log a message prefixed with the build task name.
 * @param {string} task      Name of the build task.
 * @param {string} message   Message to log.
 */
export function log(task, message) {
	console.log(`[build:${task}] ${message}`);
}

/**
 * Resolve a path relative to the repository root.
 * @param {string} relativePath   Path relative to the repository root.
 * @returns {string}              Absolute path.
 */
export function resolveFromRoot(relativePath) {
	return path.join(ROOT, relativePath);
}

/**
 * Dist path for a source file under src/: the copy pipeline and the yaml
 * compiler both mirror the src tree into dist, stripping the src/ prefix.
 *
 * @param {string} sourcePath  Absolute path under src/.
 * @returns {string} Absolute dist path.
 */
export function destPathFor(sourcePath) {
	return path.join(resolveFromRoot("dist"), path.relative(resolveFromRoot("src"), sourcePath));
}

/**
 * Remove a dist artifact, ignoring a missing file so removals are always
 * safe to run.
 * @param filePath
 */
export function removeFile(filePath) {
	fs.rmSync(filePath, { force: true });
}

/**
 * Glob files relative to the repository root. Patterns starting with "!" are treated as ignores.
 * @param {string|string[]} patterns   Glob pattern(s) to match.
 * @param {object} [options]           Extra options passed to `glob`.
 * @returns {Promise<string[]>}        Absolute paths of the matched files.
 */
export async function globFiles(patterns, options = {}) {
	const patternList = Array.isArray(patterns) ? patterns : [patterns];
	const includes = patternList.filter((pattern) => !pattern.startsWith("!"));
	const ignore = patternList
		.filter((pattern) => pattern.startsWith("!"))
		.map((pattern) => pattern.slice(1));

	return glob(includes, {
		cwd: ROOT,
		absolute: true,
		nodir: true,
		ignore,
		...options
	});
}

/**
 * Create a directory (and any missing parents) if it doesn't exist.
 * @param {string} dirPath   Directory to create.
 */
export function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Copy a file, creating the destination directory. In production mode, references to the
 * Vue development build in text files are rewritten to the production build.
 * @param {string} src                    Source file path.
 * @param {string} dest                   Destination file path.
 * @param {object} [options]
 * @param {boolean} [options.prod=false]  Whether this is a production build.
 * @returns {Promise<void>}
 */
export async function copyFileWithReplace(src, dest, { prod = false } = {}) {
	ensureDir(path.dirname(dest));

	if (!prod) {
		fs.copyFileSync(src, dest);
		return;
	}

	const ext = path.extname(src).toLowerCase();
	const textExtensions = new Set([".js", ".mjs", ".cjs", ".html", ".json"]);

	if (textExtensions.has(ext)) {
		const content = fs.readFileSync(src, "utf8")
			.replaceAll("vue.esm-browser.js", "vue.esm-browser.prod.js");
		fs.writeFileSync(dest, content);
		return;
	}

	fs.copyFileSync(src, dest);
}

/**
 * Spawn a command from the repository root, inheriting stdio.
 * @param {string} command     Command to run.
 * @param {string[]} args      Command arguments.
 * @param {object} [options]   Extra options passed to `child_process.spawn`.
 * @returns {Promise<void>}    Resolves on exit code 0, rejects otherwise.
 */
export function spawnCommand(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: ROOT,
			stdio: "inherit",
			shell: process.platform === "win32",
			...options
		});

		child.on("error", reject);
		child.on("close", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
		});
	});
}

/**
 * Get the fvtt CLI command, preferring the locally installed binary.
 * @returns {string}   Path to the local fvtt binary, or "fvtt" to use the one on PATH.
 */
export function getFvttCommand() {
	const local = path.join(ROOT, "node_modules/.bin/fvtt");
	return fs.existsSync(local) ? local : "fvtt";
}

/**
 * Run tasks concurrently and wait for all of them to finish.
 * @param {Array<() => *>} tasks   Functions to run; each may return a promise.
 * @returns {Promise<void>}
 */
export async function runParallel(tasks) {
	await Promise.all(tasks.map((task) => task()));
}

/**
 * Match a path against an ordered glob list with `!` negations, mirroring
 * how `globFiles` evaluates include/exclude patterns.
 *
 * @param {string} filePath  Path to test, relative to the project root.
 * @param {string[]} patterns  Glob patterns; entries starting with `!` exclude.
 * @returns {boolean}
 */
export function matchesGlobs(filePath, patterns) {
	let included = false;

	for (const pattern of patterns) {
		// Later patterns win: a negation match knocks the path back out even if
		// an earlier include matched it.
		if (pattern.startsWith("!")) {
			if (minimatch(filePath, pattern.slice(1), { dot: true })) included = false;
		}
		else if (minimatch(filePath, pattern, { dot: true })) {
			included = true;
		}
	}

	return included;
}
