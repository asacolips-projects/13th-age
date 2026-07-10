import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import { SYSTEM_SCSS } from './constants.mjs';
import { ensureDir, globFiles, log, resolveFromRoot } from './utils.mjs';

const LOAD_PATHS = [
  resolveFromRoot('src/scss'),
  resolveFromRoot('src/scss/v2'),
];

function isEntryPoint(filePath) {
  return !path.basename(filePath).startsWith('_');
}

export async function compileScss() {
  const files = (await globFiles(SYSTEM_SCSS)).filter(isEntryPoint);
  const outDir = resolveFromRoot('dist/css');

  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  ensureDir(outDir);

  let compiled = 0;
  let failed = 0;

  for (const file of files) {
    const relativePath = path.relative(resolveFromRoot('src/scss'), file);
    const outFile = path.join(outDir, relativePath.replace(/\.scss$/, '.css'));
    ensureDir(path.dirname(outFile));

    let result;
    try {
      result = sass.compile(file, {
        style: 'compressed',
        sourceMap: true,
        sourceMapIncludeSources: true,
        loadPaths: LOAD_PATHS,
      });
    } catch (error) {
      failed += 1;
      log('scss', error.toString());
      continue;
    }

    const prefixed = await postcss([autoprefixer({ cascade: false })])
      .process(result.css, { from: file, to: outFile });

    fs.writeFileSync(outFile, prefixed.css);

    if (result.sourceMap) {
      const map = {
        ...result.sourceMap,
        file: path.basename(outFile),
      };
      fs.writeFileSync(`${outFile}.map`, JSON.stringify(map));
    }

    compiled += 1;
  }

  const summary = failed
    ? `compiled ${compiled} files (${failed} failed)`
    : `compiled ${compiled} files`;
  log('scss', summary);
}
