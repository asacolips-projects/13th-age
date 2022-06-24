import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '',
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src/vue')}/`
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "src/scss/v2/_init.scss";'
      }
    },
  },
  build: {
    sourcemap: true,
    outDir: './dist/vue',
    lib: {
      entry: path.resolve(__dirname, 'src/vue/index.js'),
      name: 'v3boilerplateVueComponents',
      formats: ['es'], // also supports 'umd'
      fileName: (format) => `components.vue.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
      ],
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Provide global variables to use in the UMD build
        // Add external deps here
        globals: {
          vue: 'Vue',
        },
        // Map the external dependency to a local copy of Vue 3 esm.
        paths: {
          vue: `./scripts/lib/vue.esm-browser.js`
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name == 'style.css')
            return `styles.vue.css`;
          return assetInfo.name;
        }
      },
    },
  }
});
