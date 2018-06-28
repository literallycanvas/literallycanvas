var browserify = require("browserify");
var gulp = require("gulp");
var connect = require("gulp-connect");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var source = require("vinyl-source-stream");
var uglify = require("gulp-uglify");
var babel = require("gulp-babel");
var preprocess = require("gulp-preprocess");
var preprocessify = require("preprocessify");

gulp.task("commonjs", function() {
    return gulp.src(["./src/**/*.js", "./src/**/*.jsx"])
        .pipe(preprocess({context: { INCLUDE_GUI: true }}))
        .pipe(babel())
        .pipe(gulp.dest("./lib/js/"));
});

gulp.task("sass", function() {
    return gulp.src("./scss/**/*.scss")
        .pipe(sass({ outputStyle: "compressed" }))
        .pipe(gulp.dest("./lib/css/"))
        .pipe(connect.reload());
});


gulp.task("browserify-lc-main", function() {
    var bundleStream = browserify({
        basedir: "src", extensions: [".js", ".jsx"], debug: true, standalone: "LC",
        debug: false
    }).add("./index.js")
        .external("create-react-class")
        .external("react")
        .external("react-dom")
        .external("react-dom-factories")
        .transform(preprocessify({ INCLUDE_GUI: true }))
        .transform("babelify")
        .bundle()
        .on("error", function (err) {
            if (err) {
                console.error(err.toString());
            }
        });

    return bundleStream
        .pipe(source("./src/index.js"))
        .pipe(rename("literallycanvas.js"))
        .pipe(gulp.dest("./lib/js/"))
        .pipe(connect.reload());
});

gulp.task("browserify-lc-core", function() {
    var bundleStream = browserify({
        basedir: "src", extensions: [".js", ".jsx"], debug: true, standalone: "LC",
        debug: false
    }).add("./index.js")
        .transform(preprocessify({}))
        .transform("babelify")
        .bundle()
        .on("error", function (err) {
            if (err) {
                console.error(err.toString());
            }
        });

    return bundleStream
        .pipe(source("./src/index.js"))
        .pipe(rename("literallycanvas-core.js"))
        .pipe(gulp.dest("./lib/js/"))
        .pipe(connect.reload());
});


gulp.task("uglify", ["browserify-lc-main", "browserify-lc-core"], function() {
    return gulp.src(["./lib/js/literallycanvas?(-core).js"])
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest("./lib/js"));
});


gulp.task("default", ["uglify", "sass"], function() {
});


gulp.task("demo-reload", function () {
    return gulp.src("demo/*").pipe(connect.reload());
});


gulp.task("watch", function() {
    gulp.watch(["src/*.js", "src/*/*.js", "src/*.jsx", "src/*/*.jsx"], ["browserify-lc-main", "browserify-lc-core"]);
    gulp.watch("scss/*.scss", ["sass"]);
    gulp.watch("demo/*", ["demo-reload"]);
});


gulp.task("serve", function() {
    connect.server({
        livereload: {port: 35728}
    });
});


gulp.task("dev", ["browserify-lc-main", "browserify-lc-core", "sass", "watch", "serve"], function() {
});
