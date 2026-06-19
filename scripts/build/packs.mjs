import fs from 'node:fs';
import path from 'node:path';
import { PACK_DEST, PACK_SRC } from './constants.mjs';
import { getFvttCommand, log, spawnCommand } from './utils.mjs';

export async function cleanPacks() {
  if (fs.existsSync(PACK_DEST)) {
    fs.rmSync(PACK_DEST, { recursive: true, force: true });
  }
  log('packs', 'cleaned dist/packs');
}

export async function compilePacks() {
  const folders = fs.readdirSync(PACK_SRC).filter((entry) => {
    return fs.statSync(path.join(PACK_SRC, entry)).isDirectory();
  });

  const fvtt = getFvttCommand();

  for (const folder of folders) {
    const folderPath = path.join(PACK_SRC, folder);
    await spawnCommand(fvtt, [
      'package',
      '--id', 'archmage',
      '--type', 'System',
      'pack', folder,
      '-c',
      '--yaml',
      '--in', folderPath,
      '--out', PACK_DEST,
    ]);
  }

  log('packs', `compiled ${folders.length} compendia`);
}

export async function extractPacks() {
  const entries = fs.readdirSync(PACK_DEST);
  const fvtt = getFvttCommand();

  for (const entry of entries) {
    const stem = path.parse(entry).name;
    await spawnCommand(fvtt, [
      'package',
      '--id', 'archmage',
      '--type', 'System',
      'unpack', stem,
      '-c',
      '--yaml',
      '--in', 'dist/packs',
      '--out', `src/packs/src/${stem}`,
    ]);
  }

  log('packs', `extracted ${entries.length} compendia`);
}
