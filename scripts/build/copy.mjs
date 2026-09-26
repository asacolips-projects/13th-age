import path from 'node:path';
import { SYSTEM_COPY } from './constants.mjs';
import { copyFileWithReplace, globFiles, log, matchesGlobs, resolveFromRoot } from './utils.mjs';

export async function copyFiles({ prod = false } = {}) {
  const files = await globFiles(SYSTEM_COPY);
  const srcRoot = resolveFromRoot('src');
  const distRoot = resolveFromRoot('dist');

  for (const file of files) {
    const relativePath = path.relative(srcRoot, file);
    const dest = path.join(distRoot, relativePath);
    await copyFileWithReplace(file, dest, { prod });
  }

  log('copy', `copied ${files.length} files${prod ? ' (prod)' : ''}`);
}

/**
 * Copy only the files that changed during watch, rather than re-copying the
 * full SYSTEM_COPY tree on every save.
 *
 * @param {string[]} changedPaths  Absolute paths of changed source files.
 * @param {{ prod?: boolean }} [options]
 */
export async function copyChangedPaths(changedPaths, { prod = false } = {}) {
  const srcRoot = resolveFromRoot('src');
  const distRoot = resolveFromRoot('dist');
  const root = resolveFromRoot('.');
  let copied = 0;

  for (const file of changedPaths) {
    // Patterns in SYSTEM_COPY are root-relative, while the dest path strips
    // the src/ prefix (mirrors copyFiles).
    const rootRelative = path.relative(root, file).replaceAll('\\', '/');
    if (!matchesGlobs(rootRelative, SYSTEM_COPY)) continue;

    const dest = path.join(distRoot, path.relative(srcRoot, file));
    await copyFileWithReplace(file, dest, { prod });
    copied += 1;
  }

  if (copied > 0) {
    log('copy', `copied ${copied} changed file${copied === 1 ? '' : 's'}`);
  }
}
