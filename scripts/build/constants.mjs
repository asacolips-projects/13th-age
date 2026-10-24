import path from "node:path";

export const ROOT = process.cwd();

export const PACK_SRC = path.join(ROOT, "src/packs/src");
export const PACK_DEST = path.join(ROOT, "dist/packs");

export const SYSTEM_SCSS = ["src/scss/**/*.scss"];

export const SYSTEM_YAML = [
	"src/**/*.{yaml,yml}",
	"!src/packs/**/*.{yaml,yml}"
];

export const SYSTEM_IMAGES = ["src/assets/src/**/*.{png,jpeg,jpg}"];
export const SYSTEM_SVG = ["src/assets/src/**/*.svg"];

export const SYSTEM_COPY = [
	"!dist",
	"src/assets/**/*",
	"!src/assets/src/**/*.{png,jpeg,jpg}",
	"src/condition-maps/**/*",
	"src/images/**/*",
	"src/module/**/*",
	"src/scripts/**/*",
	"src/templates/**/*",
	"src/module/tours/configs/*"
];

// Copied for development (where the dev Vue build is what runs) but skipped
// for production releases: imports are rewritten to the .prod.js bundle, so
// the 500-odd KB development build would only be dead weight in the zip.
export const PROD_COPY_EXCLUDES = [
	"src/scripts/lib/vue.esm-browser.js"
];

export const VUE_DEPS = [
	"node_modules/vue/dist/vue.esm-browser.js",
	"node_modules/vue/dist/vue.esm-browser.prod.js"
];

export const WATCH_GLOBS = {
	scss: SYSTEM_SCSS,
	yaml: SYSTEM_YAML,
	images: SYSTEM_IMAGES,
	svg: SYSTEM_SVG,
	copy: SYSTEM_COPY
};
