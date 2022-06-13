const path = require('path');
const { defineConfig } = require('vite');
const vue = require('@vitejs/plugin-vue');

// https://vitejs.dev/config/
export default defineConfig({
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
        'vue'
      ],
      output: {
        // Provide global variables to use in the UMD build
        // Add external deps here
        globals: {
          vue: 'Vue',
        },
        // Map the external dependency to a local copy of Vue 3 esm.
        paths: {
          vue: '../module/lib/vue.esm-browser.js'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name == 'style.css')
            return `styles.vue.css`;
          return assetInfo.name;
        }
      },
    },
  },
  plugins: [
    vue()
  ],
});
