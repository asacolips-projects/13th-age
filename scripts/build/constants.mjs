import path from 'node:path';

export const ROOT = process.cwd();

export const PACK_SRC = path.join(ROOT, 'src/packs/src');
export const PACK_DEST = path.join(ROOT, 'dist/packs');

export const SYSTEM_SCSS = ['src/scss/**/*.scss'];

export const SYSTEM_YAML = [
  'src/**/*.{yaml,yml}',
  '!src/packs/**/*.{yaml,yml}',
];

export const SYSTEM_IMAGES = ['src/assets/src/**/*.{png,jpeg,jpg}'];
export const SYSTEM_SVG = ['src/assets/src/**/*.svg'];

export const SYSTEM_COPY = [
  '!dist',
  'src/assets/**/*',
  '!src/assets/src/**/*.{png,jpeg,jpg}',
  'src/condition-maps/**/*',
  'src/images/**/*',
  'src/module/**/*',
  'src/scripts/**/*',
  'src/templates/**/*',
  'src/module/tours/configs/*',
];

export const VUE_DEPS = [
  'node_modules/vue/dist/vue.esm-browser.js',
  'node_modules/vue/dist/vue.esm-browser.prod.js',
];

export const WATCH_GLOBS = {
  scss: SYSTEM_SCSS,
  yaml: SYSTEM_YAML,
  images: SYSTEM_IMAGES,
  svg: SYSTEM_SVG,
  copy: SYSTEM_COPY,
};
