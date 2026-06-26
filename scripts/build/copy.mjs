import path from 'node:path';
import { SYSTEM_COPY } from './constants.mjs';
import { copyFileWithReplace, globFiles, log, resolveFromRoot } from './utils.mjs';

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
