var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var watch = require('gulp-watch');

gulp.task('styles', function(){
  return gulp.src(['resources/src/css/bundle.scss', 'resources/src/css/sprak.css'])
    .pipe(sass()) // Converts Sass to CSS with gulp-sass
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest('resources/dist/css'))
});

gulp.task('default', ['styles'], function() {
    gulp.watch('resources/src/css/**', ['styles']);
})
