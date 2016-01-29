var browserify = require('browserify');
var gulp = require('gulp');
var connect = require('gulp-connect');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify')
var uglify = require('gulp-uglify');
var coffee = require('gulp-coffee');
var babel = require('gulp-babel');
var preprocess = require('gulp-preprocess');
var preprocessify = require('preprocessify');
var merge = require('merge-stream');

gulp.task('commonjs', function() {
  // https://github.com/gulpjs/gulp/blob/master/docs/recipes/using-multiple-sources-in-one-task.md
  var babelTrans = gulp.src(['./src/**/*.js', './src/**/*.jsx'])
    .pipe(preprocess({context: { INCLUDE_GUI: true }}))
    .pipe(babel())
    .pipe(gulp.dest('./lib/js/'));

  var coffeeTrans = gulp.src('./src/**/*.coffee')
    .pipe(preprocess({context: { INCLUDE_GUI: true }}))
    .pipe(coffee({ bare: true }))
    .pipe(gulp.dest('./lib/js/'));

  return merge(babelTrans, coffeeTrans);
});

gulp.task('sass', function() {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(gulp.dest('./lib/css/'))
    .pipe(connect.reload())
});


gulp.task('browserify-lc-main', function() {
  var bundleStream = browserify({
      basedir: 'src', extensions: ['.js', '.jsx', '.coffee'], debug: true, standalone: 'LC',
      debug: false
  }).add('./index.coffee')
    .external('react')
    .external('react-dom')
    .transform(preprocessify({ INCLUDE_GUI: true }, {includeExtensions: ['.coffee'], type: 'coffee'}))
    .transform('coffeeify')
    .transform('babelify')
    .bundle()
    .on('error', function (err) {
      if (err) {
        console.error(err.toString());
      }
    });

  return bundleStream
    .pipe(source('./src/index.coffee'))
    .pipe(rename('literallycanvas.js'))
    .pipe(gulp.dest('./lib/js/'))
    .pipe(connect.reload());
});

gulp.task('browserify-lc-core', function() {
  var bundleStream = browserify({
      basedir: 'src', extensions: ['.js', '.jsx', '.coffee'], debug: true, standalone: 'LC',
      debug: false
  }).add('./index.coffee')
    .transform(preprocessify({}, {includeExtensions: ['.coffee'], type: 'coffee'}))
    .transform('coffeeify')
    .transform('babelify')
    .bundle()
    .on('error', function (err) {
      if (err) {
        console.error(err.toString());
      }
    });

  return bundleStream
    .pipe(source('./src/index.coffee'))
    .pipe(rename('literallycanvas-core.js'))
    .pipe(gulp.dest('./lib/js/'))
    .pipe(connect.reload());
});


gulp.task('uglify', ['browserify-lc-main', 'browserify-lc-core'], function() {
  return gulp.src(['./lib/js/literallycanvas?(-core).js'])
    .pipe(uglify())
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest('./lib/js'));
});


gulp.task('default', ['uglify', 'sass'], function() {
});


gulp.task('demo-reload', function () {
  return gulp.src('demo/*').pipe(connect.reload());
});


gulp.task('watch', function() {
  gulp.watch(['src/*.coffee', 'src/*/*.coffee', 'src/*.js', 'src/*/*.js'], ['browserify-lc-main', 'browserify-lc-core']);
  gulp.watch('scss/*.scss', ['sass']);
  gulp.watch('demo/*', ['demo-reload']);
});


gulp.task('serve', function() {
  connect.server({
    livereload: {port: 35728}
  });
});


gulp.task('dev', ['browserify-lc-main', 'browserify-lc-core', 'sass', 'watch', 'serve'], function() {
});
