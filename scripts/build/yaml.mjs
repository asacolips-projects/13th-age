import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { SYSTEM_YAML } from './constants.mjs';
import { ensureDir, globFiles, log, resolveFromRoot } from './utils.mjs';

export async function compileYaml() {
  const files = await globFiles(SYSTEM_YAML);
  const srcRoot = resolveFromRoot('src');
  const distRoot = resolveFromRoot('dist');

  for (const file of files) {
    const relativePath = path.relative(srcRoot, file);
    const outFile = path.join(
      distRoot,
      relativePath.replace(/\.(yaml|yml)$/, '.json'),
    );
    ensureDir(path.dirname(outFile));

    const content = fs.readFileSync(file, 'utf8');
    const data = yaml.load(content);
    fs.writeFileSync(outFile, `${JSON.stringify(data, null, 2)}\n`);
  }

  log('yaml', `compiled ${files.length} files`);
}
