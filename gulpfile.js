// Dependencies for build tasks.
const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const yaml = require('gulp-yaml');
const webp = require('gulp-webp');
const replace = require('gulp-replace');
const shell = require('gulp-shell')

// Dependencies for compendium tasks.
const mergeStream = require("merge-stream");
const fs = require("fs");
const path = require("path");
const clean = require("gulp-clean");

// Constants.
const PACK_SRC = "src/packs/src";
const PACK_DEST = "dist/packs";

/* ----------------------------------------- */
/*  Compile Compendia
/* ----------------------------------------- */

/**
 * Gulp Task: Compile packs from the yaml source content to .db files.
 */
function compilePacks() {
  // Every folder in the src dir will become a compendium.
  const folders = fs.readdirSync(PACK_SRC).filter((file) => {
    return fs.statSync(path.join(PACK_SRC, file)).isDirectory();
  });

  const packs = folders.map((folder) => {
    return gulp.src(path.join(PACK_SRC, folder))
      .pipe(shell([
        `fvtt package --id archmage --type System pack <%= file.stem %> -c --yaml --in "<%= file.path %>" --out ${PACK_DEST}`
      ]))
  })

  return mergeStream.call(null, packs);
}

/**
 * Cleanup the packs directory.
 *
 * This task will delete the existing compendiums so that the compile task can
 * write fresh copies in their place.
 */
function cleanPacks() {
  return gulp.src(`${PACK_DEST}`, { allowEmpty: true }, {read: false}).pipe(clean());
}

/* ----------------------------------------- */
/*  Export Compendia
/* ----------------------------------------- */

/**
 * Gulp Task: Export Packs
 *
 * This gulp task will load all compendium .db files from the dest directory,
 * load them into memory, and then export them to a human-readable YAML format.
 */
function extractPacks() {
  // Start a stream for all db files in the packs dir.
  const packs = gulp.src(`${PACK_DEST}/*`)
    .pipe(shell([
      'fvtt package --id archmage --type System unpack <%= file.stem %> -c --yaml --in dist/packs --out src/packs/src/<%= file.stem %>'
    ]));

  // Call the streams.
  return mergeStream.call(null, packs);
}

/* ----------------------------------------- */
/* Convert images
/* ----------------------------------------- */
const SYSTEM_IMAGES = [
  'src/assets/src/**/*.{png,jpeg,jpg}',
];
function compileImages() {
  return gulp.src(SYSTEM_IMAGES, {base: 'src/assets/src'})
    .pipe(webp())
    .pipe(gulp.dest('./dist/assets'));
};
const imageTask = gulp.series(compileImages);

const SYSTEM_SVG = [
  'src/assets/src/**/*.svg',
];
function compileSvg() {
  return gulp.src(SYSTEM_SVG, {base: 'src/assets/src'})
    .pipe(gulp.dest('./dist/assets'));
}
const svgTask = gulp.series(compileSvg);

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

const SYSTEM_SCSS = ["src/scss/**/*.scss"];
function compileScss() {
  // Configure options for sass output. For example, 'expanded' or 'nested'
  let options = {
    outputStyle: 'compressed'
  };
  return gulp.src(SYSTEM_SCSS)
    .pipe(sourcemaps.init())
    .pipe(
      sass.sync(options)
        .on('error', handleError)
    )
    .pipe(prefix({
      cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./dist/css"))
}
const css = gulp.series(compileScss);

/* ----------------------------------------- */
/*  Compile YAML
/* ----------------------------------------- */
const SYSTEM_YAML = [
  './src/**/*.{yaml,yml}',
  '!./src/packs/**/*.{yaml,yml}'
  // './src/system.{yaml,yml}',
  // './src/template.{yaml,yml}'
];
function compileYaml() {
  return gulp.src(SYSTEM_YAML)
    .pipe(yaml({ space: 2 }))
    .pipe(gulp.dest('./dist'))
}
const yamlTask = gulp.series(compileYaml);

/* ----------------------------------------- */
/* Copy files
/* ----------------------------------------- */
const SYSTEM_COPY = [
  'src/assets/**/*',
  '!src/assets/src/**/*.{png,jpeg,jpg}',
  'src/condition-maps/**/*',
  'src/images/**/*',
  'src/module/**/*',
  'src/scripts/**/*',
  'src/templates/**/*',
  'src/module/tours/configs/*'
];
function copyVueDependencies() {
  return gulp.src([
      'node_modules/vue/dist/vue.esm-browser.js',
      'node_modules/vue/dist/vue.esm-browser.prod.js'
    ], {base: 'node_modules/vue/dist'})
    .pipe(gulp.dest('./src/scripts/lib'));
}
function copyFiles() {
  return gulp.src(SYSTEM_COPY, {base: 'src'})
    .pipe(gulp.dest('./dist'))
}
function copyFilesProd() {
  return gulp.src(SYSTEM_COPY, {base: 'src'})
    .pipe(replace('vue.esm-browser.js', 'vue.esm-browser.prod.js'))
    .pipe(gulp.dest('./dist'))
}
const copyTask = gulp.series(copyFiles);
const copyTaskProd = gulp.series(copyFilesProd);

/* ----------------------------------------- */
/*  Compile Vue 3                            */
/* ----------------------------------------- */
const exec = require('child_process').exec;
const VITE_FILES = ['src/vue/**/*.{js,vue}']
// Local builds.
function viteBuild(cb) {
  return exec('npm run vite:build', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}
function copyFoundryVite() {
  return gulp.src('./src/vue/foundry-shim/foundry-ui/**/*', {base: 'src/vue/foundry-shim/foundry-ui'})
    .pipe(gulp.dest('./dist/'));
}
const viteBuildTask = gulp.series(viteBuild);
// Prod builds.
function viteBuildProd(cb) {
  return exec('npm run vite:build:prod', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}
const viteBuildProdTask = gulp.series(viteBuildProd);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch(SYSTEM_SCSS, css);
  gulp.watch(SYSTEM_YAML, yamlTask);
  gulp.watch(SYSTEM_IMAGES, imageTask);
  gulp.watch(SYSTEM_SVG, svgTask);
  gulp.watch(VITE_FILES, viteBuildTask);
  gulp.watch(SYSTEM_COPY, copyTask);
  // gulp.watch(SYSTEM_SCRIPTS, scripts);
}

function watchUpdatesNoVite() {
  gulp.watch(SYSTEM_SCSS, css);
  gulp.watch(SYSTEM_YAML, yamlTask);
  gulp.watch(SYSTEM_IMAGES, imageTask);
  gulp.watch(SYSTEM_SVG, svgTask);
  gulp.watch(SYSTEM_COPY, copyTask);
  // gulp.watch(SYSTEM_SCRIPTS, scripts);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
  gulp.parallel(
    compileScss,
    compileYaml,
    compileImages,
    compileSvg,
    copyTask,
    viteBuildTask,
  ),
  watchUpdates
);
exports.images = imageTask;
exports.svg = svgTask;
exports.css = css;
exports.yaml = yamlTask;
exports.files = copyTask;
exports.cleanPacks = gulp.series(cleanPacks);
exports.compilePacks = gulp.series(cleanPacks, compilePacks);
exports.extractPacks = gulp.series(extractPacks);
exports.build = gulp.series(
  cleanPacks,
  copyVueDependencies,
  gulp.parallel(
    compileScss,
    compileYaml,
    compileImages,
    compileSvg,
    compilePacks,
    copyTask,
    viteBuildTask // vue 3 task
  ),
);
exports.prod = gulp.series(
  cleanPacks,
  copyVueDependencies,
  gulp.parallel(
    compileScss,
    compileYaml,
    compileImages,
    compileSvg,
    copyTaskProd,
    compilePacks,
    viteBuildProdTask // vue 3 task
  )
);
exports.noVite = gulp.series(
  cleanPacks,
  copyVueDependencies,
  gulp.parallel(
    compileScss,
    compileYaml,
    compileImages,
    compileSvg,
    copyTaskProd,
    copyFoundryVite
  )
);
exports.noViteWatch = gulp.series(
  gulp.parallel(
    compileScss,
    compileYaml,
    compileImages,
    compileSvg,
    copyTask,
  ),
  watchUpdatesNoVite
);
