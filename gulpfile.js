var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

gulp.task('sass', function() {
  return gulp.src('scss/literally.scss')
    .pipe(sass({ style: 'compressed' }))
    .pipe(gulp.dest('lib/css/literally.css'))
});

gulp.task('default', function() {
  // place code for your default task here
});