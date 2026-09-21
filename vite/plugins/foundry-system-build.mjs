import path from 'node:path';
import chokidar from 'chokidar';
import { WATCH_GLOBS } from '../../scripts/build/constants.mjs';
import { runBuildTasks, runDevTasks } from '../../scripts/build/index.mjs';
import { compileImages, compileSvg } from '../../scripts/build/assets.mjs';
import { copyChangedPaths } from '../../scripts/build/copy.mjs';
import { compileScss } from '../../scripts/build/scss.mjs';
import { compileYaml } from '../../scripts/build/yaml.mjs';
import { log, matchesGlobs, resolveFromRoot } from '../../scripts/build/utils.mjs';

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

    const pendingCopy = new Set();
    const runCopy = debounce(async () => {
      const changed = [...pendingCopy];
      pendingCopy.clear();
      try {
        await copyChangedPaths(changed, { prod });
      } catch (error) {
        log('watch:copy', error.message);
      }
    }, DEBOUNCE_MS);

    // chokidar 4+ no longer expands globs, so watching the glob patterns from
    // WATCH_GLOBS directly matches nothing. Watch the src tree instead and let
    // matchesGlobs below decide which task (if any) a change belongs to.
    watcher = chokidar.watch([path.join(resolveFromRoot('.'), 'src')], {
      ignoreInitial: true,
    });

    watcher.on('all', (event, filePath) => {
      const relativePath = path.relative(resolveFromRoot('.'), filePath).replaceAll('\\', '/');

      if (event === 'addDir' || event === 'unlinkDir') return;

      if (matchesGlobs(relativePath, WATCH_GLOBS.scss)) {
        runScss();
        return;
      }

      if (matchesGlobs(relativePath, WATCH_GLOBS.yaml)) {
        runYaml();
        return;
      }

      if (matchesGlobs(relativePath, WATCH_GLOBS.images)) {
        runImages();
        return;
      }

      if (matchesGlobs(relativePath, WATCH_GLOBS.svg)) {
        runSvg();
        return;
      }

      if (matchesGlobs(relativePath, WATCH_GLOBS.copy)) {
        if (event === 'add' || event === 'change') pendingCopy.add(filePath);
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
