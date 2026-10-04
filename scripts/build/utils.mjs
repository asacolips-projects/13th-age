import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { minimatch } from 'minimatch';
import { ROOT } from './constants.mjs';

export function log(task, message) {
  console.log(`[build:${task}] ${message}`);
}

export function resolveFromRoot(relativePath) {
  return path.join(ROOT, relativePath);
}

/**
 * Dist path for a source file under src/: the copy pipeline and the yaml
 * compiler both mirror the src tree into dist, stripping the src/ prefix.
 *
 * @param {string} sourcePath  Absolute path under src/.
 * @returns {string} Absolute dist path.
 */
export function destPathFor(sourcePath) {
  return path.join(resolveFromRoot('dist'), path.relative(resolveFromRoot('src'), sourcePath));
}

/**
 * Remove a dist artifact, ignoring a missing file so removals are always
 * safe to run.
 */
export function removeFile(filePath) {
  fs.rmSync(filePath, { force: true });
}

export async function globFiles(patterns, options = {}) {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const includes = patternList.filter((pattern) => !pattern.startsWith('!'));
  const ignore = patternList
    .filter((pattern) => pattern.startsWith('!'))
    .map((pattern) => pattern.slice(1));

  return glob(includes, {
    cwd: ROOT,
    absolute: true,
    nodir: true,
    ignore,
    ...options,
  });
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export async function copyFileWithReplace(src, dest, { prod = false } = {}) {
  ensureDir(path.dirname(dest));

  if (!prod) {
    fs.copyFileSync(src, dest);
    return;
  }

  const ext = path.extname(src).toLowerCase();
  const textExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.json']);

  if (textExtensions.has(ext)) {
    const content = fs.readFileSync(src, 'utf8')
      .replaceAll('vue.esm-browser.js', 'vue.esm-browser.prod.js');
    fs.writeFileSync(dest, content);
    return;
  }

  fs.copyFileSync(src, dest);
}

export function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

export function getFvttCommand() {
  const local = path.join(ROOT, 'node_modules/.bin/fvtt');
  return fs.existsSync(local) ? local : 'fvtt';
}

export async function runParallel(tasks) {
  await Promise.all(tasks.map((task) => task()));
}

/**
 * Match a path against an ordered glob list with `!` negations, mirroring
 * how `globFiles` evaluates include/exclude patterns.
 *
 * @param {string} filePath  Path to test, relative to the project root.
 * @param {string[]} patterns  Glob patterns; entries starting with `!` exclude.
 * @returns {boolean}
 */
export function matchesGlobs(filePath, patterns) {
  let included = false;

  for (const pattern of patterns) {
    // Later patterns win: a negation match knocks the path back out even if
    // an earlier include matched it.
    if (pattern.startsWith('!')) {
      if (minimatch(filePath, pattern.slice(1), { dot: true })) included = false;
    } else if (minimatch(filePath, pattern, { dot: true })) {
      included = true;
    }
  }

  return included;
}
