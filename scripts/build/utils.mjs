import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { ROOT } from './constants.mjs';

export function log(task, message) {
  console.log(`[build:${task}] ${message}`);
}

export function resolveFromRoot(relativePath) {
  return path.join(ROOT, relativePath);
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
