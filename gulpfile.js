var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify')

var topFile = './src/index.coffee'

gulp.task('sass', function() {
  return gulp.src('scss/literally.scss')
    .pipe(sass({ style: 'compressed' }))
    .pipe(gulp.dest('lib/css/literally.css'))
});

gulp.task('browserify', function() {
  var bundleStream = browserify({
      basedir: 'src', extensions: ['.js', '.coffee']
  }).add('./index.coffee')
    .transform('coffeeify')
    .bundle()

  return bundleStream
    .pipe(source(topFile))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./lib/js/bundle.js'))
})


gulp.task('default', function() {
  // place code for your default task here
});