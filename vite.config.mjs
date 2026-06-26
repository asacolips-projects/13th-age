import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { foundrySystemBuild } from './vite/plugins/foundry-system-build.mjs';

const ROOT = import.meta.dirname;
const SCSS_LOAD_PATHS = [
  path.resolve(ROOT, 'src/scss'),
  path.resolve(ROOT, 'src/scss/v2'),
];
const SCSS_INIT = path.resolve(ROOT, 'src/scss/v2/_init.scss').replace(/\\/g, '/');

export default defineConfig(({ mode }) => {
  const prod = mode === 'production';
  const packs = process.env.BUILD_PACKS === '1';

  return {
    plugins: [
      vue(),
      foundrySystemBuild({ prod, packs }),
    ],
    resolve: {
      alias: {
        '@/': `${path.resolve(ROOT, 'src/vue')}/`,
        '@src/': `${path.resolve(ROOT, 'src')}/`,
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: SCSS_LOAD_PATHS,
          additionalData: `@import "${SCSS_INIT}";`,
        },
      },
    },
    build: {
      sourcemap: true,
      minify: prod,
      outDir: './dist/vue',
      lib: {
        entry: path.resolve(ROOT, 'src/vue/index.js'),
        name: 'v3ArchmageVueComponents',
        formats: ['es'],
        fileName: (format) => `components.vue.${format}.js`,
        cssFileName: 'styles.vue',
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
          paths: {
            vue: prod
              ? '../scripts/lib/vue.esm-browser.prod.js'
              : '../scripts/lib/vue.esm-browser.js',
          },
        },
      },
    },
  };
});
