import path from "node:path";
import chokidar from "chokidar";
import { WATCH_GLOBS } from "../../scripts/build/constants.mjs";
import { runBuildTasks, runDevTasks } from "../../scripts/build/index.mjs";
import { compileImages, compileSvg } from "../../scripts/build/assets.mjs";
import { copyFiles } from "../../scripts/build/copy.mjs";
import { compileScss } from "../../scripts/build/scss.mjs";
import { compileYaml } from "../../scripts/build/yaml.mjs";
import { log, resolveFromRoot } from "../../scripts/build/utils.mjs";

const DEBOUNCE_MS = 150;

/**
 * Create a debounced wrapper that delays calling `fn` until `wait` ms have passed without another call.
 * @param {Function} fn     Function to debounce.
 * @param {number} wait     Delay in milliseconds.
 * @returns {Function}      Debounced function.
 */
function debounce(fn, wait) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), wait);
	};
}

/**
 * Vite plugin that runs the non-Vue system build (SCSS, YAML, assets, file copy, packs)
 * and, in watch mode, rebuilds those files when their sources change.
 * @param {object} [options]
 * @param {boolean} [options.prod=false]   Whether this is a production build.
 * @param {boolean} [options.packs=false]  Whether to also clean and compile compendium packs.
 * @returns {import("vite").Plugin}        The Vite plugin.
 */
export function foundrySystemBuild(options = {}) {
	const { prod = false, packs = false } = options;
	let watcher;
	let initialBuildDone = false;
	let isWatch = false;

	/**
	 * Run the full build once, including packs if enabled.
	 * @returns {Promise<void>}
	 */
	async function runInitialBuild() {
		if (packs) {
			await runBuildTasks({ prod, packs: true });
		}
		else {
			await runDevTasks({ prod });
		}
		initialBuildDone = true;
	}

	/**
	 * Start a file watcher that reruns the matching build task when a source file changes.
	 */
	function startWatchers() {
		if (watcher) return;

		const runScss = debounce(async () => {
			try {
				await compileScss();
			}
			catch(error) {
				log("watch:scss", error.message);
			}
		}, DEBOUNCE_MS);

		const runYaml = debounce(async () => {
			try {
				await compileYaml();
			}
			catch(error) {
				log("watch:yaml", error.message);
			}
		}, DEBOUNCE_MS);

		const runImages = debounce(async () => {
			try {
				await compileImages();
			}
			catch(error) {
				log("watch:images", error.message);
			}
		}, DEBOUNCE_MS);

		const runSvg = debounce(async () => {
			try {
				await compileSvg();
			}
			catch(error) {
				log("watch:svg", error.message);
			}
		}, DEBOUNCE_MS);

		const runCopy = debounce(async () => {
			try {
				await copyFiles({ prod });
			}
			catch(error) {
				log("watch:copy", error.message);
			}
		}, DEBOUNCE_MS);

		watcher = chokidar.watch([
			...WATCH_GLOBS.scss,
			...WATCH_GLOBS.yaml,
			...WATCH_GLOBS.images,
			...WATCH_GLOBS.svg,
			...WATCH_GLOBS.copy
		].map((pattern) => path.join(resolveFromRoot("."), pattern)), {
			ignoreInitial: true,
			ignored: (watchPath) => watchPath.includes(`${path.sep}dist${path.sep}`)
		});

		watcher.on("all", (_event, filePath) => {
			const relativePath = path.relative(resolveFromRoot("."), filePath).replaceAll("\\", "/");

			if (WATCH_GLOBS.scss.some((pattern) => matchGlob(relativePath, pattern))) {
				runScss();
				return;
			}

			if (WATCH_GLOBS.yaml.some((pattern) => matchGlob(relativePath, pattern))) {
				runYaml();
				return;
			}

			if (WATCH_GLOBS.images.some((pattern) => matchGlob(relativePath, pattern))) {
				runImages();
				return;
			}

			if (WATCH_GLOBS.svg.some((pattern) => matchGlob(relativePath, pattern))) {
				runSvg();
				return;
			}

			if (WATCH_GLOBS.copy.some((pattern) => matchGlob(relativePath, pattern))) {
				runCopy();
			}
		});

		log("watch", "watching non-Vue source files");
	}

	return {
		name: "foundry-system-build",
		apply: "build",

		configResolved(config) {
			isWatch = Boolean(config.build.watch);
		},

		async buildStart() {
			if (!initialBuildDone) {
				await runInitialBuild();
			}

			if (isWatch) {
				startWatchers();
			}
		},

		buildEnd() {
			if (!isWatch && watcher) {
				watcher.close();
				watcher = null;
			}
		}
	};
}

/**
 * Test a relative file path against a simple glob pattern. Negated ("!") patterns never match.
 * @param {string} filePath   Path relative to the repository root, using "/" separators.
 * @param {string} pattern    Glob pattern.
 * @returns {boolean}         True if the path matches the pattern.
 */
function matchGlob(filePath, pattern) {
	if (pattern.startsWith("!")) return false;

	const regex = new RegExp(
		`^${pattern
			.replaceAll("/", "\\/")
			.replaceAll("**", ".*")
			.replaceAll("*", "[^/]*")
			.replaceAll("{", "(")
			.replaceAll("}", ")")
			.replaceAll(",", "|")}$`
	);

	return regex.test(filePath);
}
