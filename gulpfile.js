var gulp = require("gulp"),
  tsc = require("gulp-typescript"),
  nodemon = require("gulp-nodemon"),
  runSequence = require("run-sequence"),
  tslint = require("gulp-tslint"),
  sourcemaps = require("gulp-sourcemaps"),
  del = require("del"),
  path = require("path");

var tsProject = tsc.createProject("tsconfig.json");

// Set NODE_ENV to "test"
gulp.task("env:test", function () {
  process.env.NODE_ENV = "test";
});

// Set NODE_ENV to "development"
gulp.task("env:dev", function () {
  process.env.NODE_ENV = "development";
});

// Set NODE_ENV to "production"
gulp.task("env:prod", function () {
  process.env.NODE_ENV = "production";
});

// Remove dist folder
gulp.task("clean", function () {
  return del([
    "dist"
  ]);
});

gulp.task("lint", function () {
  return gulp.src([
      "src/**/**.ts"
    ])
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report());
});

gulp.task("html-templates", function () {
  return gulp.src([
      "src/**/**.html"
    ])
    .pipe(gulp.dest("dist"));
});

gulp.task("watch", function () {
  gulp.watch("src/**/*.ts", ["lint", "tsc"]);
  gulp.watch("src/**/*.html", ["html-templates"]);
});

gulp.task("nodemon", function () {
  return nodemon({
      script: "./server.js",
    })
    .on("restart", function () {
      console.log("restarted");
    });
});

gulp.task("build", function (done) {
  runSequence("clean", "env:dev", "lint", "html-templates", done);
});
