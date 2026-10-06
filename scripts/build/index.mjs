import { fileURLToPath } from "node:url";
import path from "node:path";
import { compileAssets, compileImages, compileSvg } from "./assets.mjs";
import { copyFiles } from "./copy.mjs";
import { cleanPacks, compilePacks, extractPacks } from "./packs.mjs";
import { compileScss } from "./scss.mjs";
import { copyVueDependencies } from "./vue-deps.mjs";
import { compileYaml } from "./yaml.mjs";
import { log, runParallel } from "./utils.mjs";

const TASKS = {
	css: () => compileScss(),
	yaml: () => compileYaml(),
	images: () => compileImages(),
	svg: () => compileSvg(),
	assets: () => compileAssets(),
	files: (options) => copyFiles(options),
	copy: (options) => copyFiles(options),
	"vue-deps": () => copyVueDependencies(),
	cleanPacks: () => cleanPacks(),
	compilePacks: async () => {
		await cleanPacks();
		await compilePacks();
	},
	extractPacks: () => extractPacks()
};

/**
 * Parse command-line arguments.
 * @param {string[]} argv   Arguments, excluding the node executable and script path.
 * @returns {{prod: boolean, task: string|null}}   Parsed options.
 */
function parseArgs(argv) {
	const options = { prod: false, task: null };

	for (const arg of argv) {
		if (arg.startsWith("--task=")) options.task = arg.slice("--task=".length);
		if (arg === "--prod") options.prod = true;
	}

	return options;
}

/**
 * Run a single named build task.
 * @param {string} taskName   Name of a task in TASKS.
 * @param {object} [options]  Options passed to the task (e.g. `prod`).
 * @returns {Promise<void>}
 */
export async function runTask(taskName, options = {}) {
	const task = TASKS[taskName];
	if (!task) {
		throw new Error(`Unknown build task: ${taskName}`);
	}

	await task(options);
}

/**
 * Run the build tasks needed for development (styles, YAML, assets, file copy).
 * @param {object} [options]
 * @param {boolean} [options.prod=false]  Whether this is a production build.
 * @returns {Promise<void>}
 */
export async function runDevTasks({ prod = false } = {}) {
	await runParallel([
		() => compileScss(),
		() => compileYaml(),
		() => compileAssets(),
		() => copyFiles({ prod })
	]);
}

/**
 * Run the full build: Vue dependencies, styles, YAML, assets, file copy and optionally packs.
 * @param {object} [options]
 * @param {boolean} [options.prod=false]   Whether this is a production build.
 * @param {boolean} [options.packs=false]  Whether to clean and compile compendium packs.
 * @returns {Promise<void>}
 */
export async function runBuildTasks({ prod = false, packs = false } = {}) {
	if (packs) {
		await cleanPacks();
	}

	await copyVueDependencies();

	const tasks = [
		() => compileScss(),
		() => compileYaml(),
		() => compileAssets(),
		() => copyFiles({ prod })
	];

	if (packs) {
		tasks.push(() => compilePacks());
	}

	await runParallel(tasks);
}

/**
 * CLI entry point: run the task given by --task.
 * @returns {Promise<void>}
 */
async function main() {
	const options = parseArgs(process.argv.slice(2));

	if (!options.task) {
		console.error("Usage: node scripts/build/index.mjs --task=<name> [--prod]");
		process.exit(1);
	}

	try {
		await runTask(options.task, options);
	}
	catch(error) {
		log(options.task, error.message);
		process.exit(1);
	}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
	main();
}
