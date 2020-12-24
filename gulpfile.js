const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const yaml = require('gulp-yaml');
// const concat = require('gulp-concat');

// /* ----------------------------------------- */
// /*  Compile Scripts
// /* ----------------------------------------- */

// const SYSTEM_SCRIPTS = [
//   'scripts/setup/config.js',
//   'scripts/setup/weather.js',
//   'scripts/setup/dice.js',
//   'scripts/lib/parse-md.js',
//   'scripts/actor/actor.js',
//   'scripts/actor/actor-sheet.js',
//   'scripts/actor/actor-npc-sheet.js',
//   'scripts/actor/actor-flags.js',
//   'scripts/item/item.js',
//   'scripts/item/item-sheet.js',
//   'scripts/archmage.js',
//   'scripts/init.js'
// ];
// const NEWLINE = {
//   newLine: '\r\n\r\n/* -------------------------------------------- */\r\n/* -------------------------------------------- */\r\n/* -------------------------------------------- */\r\n\r\n'
// };
// function compileScripts() {
//   return gulp.src(SYSTEM_SCRIPTS)
//     .pipe(concat('archmage.js', NEWLINE))
//     .pipe(gulp.dest('./dist/js'));
// };
// const scripts = gulp.series(compileScripts)

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

const SYSTEM_SCSS = ["scss/**/*.scss"];
function compileScss() {
  // Configure options for sass output. For example, 'expanded' or 'nested'
  let options = {
    outputStyle: 'nested'
  };
  return gulp.src(SYSTEM_SCSS)
    .pipe(
      sass(options)
        .on('error', handleError)
    )
    .pipe(prefix({
      cascade: false
    }))
    .pipe(gulp.dest("./css"))
}
const css = gulp.series(compileScss);

/* ----------------------------------------- */
/*  Compile YAML
/* ----------------------------------------- */
const SYSTEM_YAML = ['./yaml/**/*.yml', './yaml/**/*.yaml'];
function compileYaml() {
  return gulp.src(SYSTEM_YAML)
    .pipe(yaml({ space: 2 }))
    .pipe(gulp.dest('./'))
}
const yamlTask = gulp.series(compileYaml);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch(SYSTEM_SCSS, css);
  gulp.watch(SYSTEM_YAML, yamlTask);
  // gulp.watch(SYSTEM_SCRIPTS, scripts);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
  compileScss,
  compileYaml,
  // compileScripts,
  watchUpdates
);
exports.css = css;
exports.yaml = yamlTask;
// exports.scripts = scripts;
