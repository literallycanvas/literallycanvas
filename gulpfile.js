var browserify = require('browserify');
var gulp = require('gulp');
var connect = require('gulp-connect');
var rename = require('gulp-rename');
var sass = require('gulp-ruby-sass');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify')
var uglify = require('gulp-uglify');
var preprocessify = require('preprocessify');

gulp.task('sass', function() {
  return gulp.src('scss/literallycanvas.scss')
    .pipe(sass({ style: 'compressed' }))
    .pipe(gulp.dest('lib/css'))
    .pipe(connect.reload())
});


gulp.task('browserify-lc-main', function() {
  var bundleStream = browserify({
      basedir: 'src', extensions: ['.js', '.coffee'], debug: true
  }).add('./index.coffee')
    .external('React/addons')
    .external('React')
    .transform(preprocessify({ INCLUDE_GUI: true }, {includeExtensions: ['.coffee'], type: 'coffee'}))
    .transform('coffeeify')
    .bundle({standalone: 'LC'})
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
      basedir: 'src', extensions: ['.js', '.coffee'], debug: true
  }).add('./index.coffee')
    .transform(preprocessify({}, {includeExtensions: ['.coffee'], type: 'coffee'}))
    .transform('coffeeify')
    .bundle({standalone: 'LC'})
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
  gulp.watch(['src/*.coffee', 'src/*/*.coffee'], ['browserify-lc-main', 'browserify-lc-core']);
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
