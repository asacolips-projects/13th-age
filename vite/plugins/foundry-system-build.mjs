import path from 'node:path';
import chokidar from 'chokidar';
import { WATCH_GLOBS } from '../../scripts/build/constants.mjs';
import { runBuildTasks, runDevTasks } from '../../scripts/build/index.mjs';
import { compileImages, compileSvg } from '../../scripts/build/assets.mjs';
import { copyFiles } from '../../scripts/build/copy.mjs';
import { compileScss } from '../../scripts/build/scss.mjs';
import { compileYaml } from '../../scripts/build/yaml.mjs';
import { log, resolveFromRoot } from '../../scripts/build/utils.mjs';

const DEBOUNCE_MS = 150;

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function foundrySystemBuild(options = {}) {
  const { prod = false, packs = false } = options;
  let watcher;
  let initialBuildDone = false;
  let isWatch = false;

  async function runInitialBuild() {
    if (packs) {
      await runBuildTasks({ prod, packs: true });
    } else {
      await runDevTasks({ prod });
    }
    initialBuildDone = true;
  }

  function startWatchers() {
    if (watcher) return;

    const runScss = debounce(async () => {
      try {
        await compileScss();
      } catch (error) {
        log('watch:scss', error.message);
      }
    }, DEBOUNCE_MS);

    const runYaml = debounce(async () => {
      try {
        await compileYaml();
      } catch (error) {
        log('watch:yaml', error.message);
      }
    }, DEBOUNCE_MS);

    const runImages = debounce(async () => {
      try {
        await compileImages();
      } catch (error) {
        log('watch:images', error.message);
      }
    }, DEBOUNCE_MS);

    const runSvg = debounce(async () => {
      try {
        await compileSvg();
      } catch (error) {
        log('watch:svg', error.message);
      }
    }, DEBOUNCE_MS);

    const runCopy = debounce(async () => {
      try {
        await copyFiles({ prod });
      } catch (error) {
        log('watch:copy', error.message);
      }
    }, DEBOUNCE_MS);

    watcher = chokidar.watch([
      ...WATCH_GLOBS.scss,
      ...WATCH_GLOBS.yaml,
      ...WATCH_GLOBS.images,
      ...WATCH_GLOBS.svg,
      ...WATCH_GLOBS.copy,
    ].map((pattern) => path.join(resolveFromRoot('.'), pattern)), {
      ignoreInitial: true,
      ignored: (watchPath) => watchPath.includes(`${path.sep}dist${path.sep}`),
    });

    watcher.on('all', (_event, filePath) => {
      const relativePath = path.relative(resolveFromRoot('.'), filePath).replaceAll('\\', '/');

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

    log('watch', 'watching non-Vue source files');
  }

  return {
    name: 'foundry-system-build',
    apply: 'build',

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
    },
  };
}

function matchGlob(filePath, pattern) {
  if (pattern.startsWith('!')) return false;

  const regex = new RegExp(
    `^${pattern
      .replaceAll('/', '\\/')
      .replaceAll('**', '.*')
      .replaceAll('*', '[^/]*')
      .replaceAll('{', '(')
      .replaceAll('}', ')')
      .replaceAll(',', '|')}$`,
  );

  return regex.test(filePath);
}
