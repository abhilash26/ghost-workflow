"use strict";

// Requiring Gulp Essentials
const { src, dest, watch, parallel, series } = require("gulp");

// Requiring Essential Plugins
const fileinclude = require("gulp-file-include");
const replace = require("gulp-replace");
const htmlmin = require("gulp-htmlmin");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const rename = require("gulp-rename");
const sass = require("gulp-sass")(require("sass"));
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const notify = require("gulp-notify");
const imagemin = require("gulp-imagemin");
const browsersync = require("browser-sync").create();
const del = require("del");

// Variables
const path = {
  src: {
    css: "src/css/**/*.css",
    scss: "src/scss/**/*.scss",
    js: "src/js/**/*.js",
    html: "src/**/*.html",
    img: "src/assets/img/**/*.{jpg,png,svg,gif}",
    assets: "src/assets/**/*.*",
  },
  dist: {
    css: "dist/css",
    js: "dist/js",
    html: "dist",
    img: "dist/assets/img",
    assets: "dist/assets",
  },
};

// WatchOptions
const watchOptions = { ignoreInitial: false, delay: 50 };

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "dist",
    },
    port: 3000,
    notify: false,
  });
  done();
}

// Watch HTML Files
function watchHTML() {
  watch(path.src.html, watchOptions, function HTMLChange() {
    return src(path.src.html).pipe(fileinclude()).pipe(dest(path.dist.html));
  }).on("change", browsersync.reload);
}

function buildHTML() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(replace(/cb=\d+/g, "cb=" + new Date().getTime()))
    .pipe(htmlmin())
    .pipe(dest(path.dist.html));
}

// Watch CSS Files
function watchCSS() {
  watch(path.src.css, watchOptions, function CSSChange() {
    return src(path.src.css, { sourcemaps: true })
      .pipe(dest(path.dist.css, { sourcemaps: true }))
      .pipe(browsersync.reload({ stream: true }));
  });
}

function buildCSS() {
  return src(path.src.css, { sourcemaps: true })
    .pipe(dest(path.dist.css))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({ extname: ".min.css" }))
    .pipe(dest(path.dist.css, { sourcemaps: true }));
}

// Watch SCSS Files
function watchSCSS() {
  watch(path.src.scss, watchOptions, function SCSSChange() {
    return src(path.src.scss, { sourcemaps: true })
      .pipe(
        sass({ errLogToConsole: true }).on(
          "error",
          notify.onError("Error: <%= error.message %>")
        )
      )
      .pipe(dest(path.dist.css, { sourcemaps: true }))
      .pipe(browsersync.reload({ stream: true }));
  });
}

function buildSCSS() {
  return src(path.src.scss, { sourcemaps: true })
    .pipe(
      sass({ errLogToConsole: true }).on(
        "error",
        notify.onError("Error: <%= error.message %>")
      )
    )
    .pipe(dest(path.dist.css, { sourcemaps: true }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({ extname: ".min.css" }))
    .pipe(dest(path.dist.css));
}

// Watch JS files
function watchJS() {
  watch(path.src.js, watchOptions, function JSChange() {
    return src(path.src.js).pipe(dest(path.dist.js));
  }).on("change", browsersync.reload);
}

function buildJS() {
  return src(path.src.js)
    .pipe(concat("script.js"))
    .pipe(dest(path.dist.js))
    .pipe(uglify())
    .pipe(rename({ extname: ".min.js" }))
    .pipe(dest(path.dist.js));
}

function buildImages() {
  return src(path.src.img)
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 85, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest(path.dist.img));
}

function cleanDist() {
  return del("dist");
}

// Copy all assets to dist
function copyAssets() {
  return src(path.src.assets).pipe(dest(path.dist.assets));
}

// Exports relevant functions

exports.clean = cleanDist;
exports.assets = copyAssets;

exports.watch = series(
  cleanDist,
  copyAssets,
  browserSync,
  parallel(watchHTML, watchCSS, watchSCSS, watchJS)
);

exports.build = series(
  cleanDist,
  buildHTML,
  buildCSS,
  buildJS,
  buildSCSS,
  copyAssets,
  buildImages
);
