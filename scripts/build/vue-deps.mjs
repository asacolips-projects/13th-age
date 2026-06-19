import path from 'node:path';
import { VUE_DEPS } from './constants.mjs';
import { copyFileWithReplace, globFiles, log, resolveFromRoot } from './utils.mjs';

export async function copyVueDependencies() {
  const files = await globFiles(VUE_DEPS);
  const destRoot = resolveFromRoot('src/scripts/lib');

  for (const file of files) {
    const dest = path.join(destRoot, path.basename(file));
    await copyFileWithReplace(file, dest);
  }

  log('vue-deps', `copied ${files.length} files`);
}
