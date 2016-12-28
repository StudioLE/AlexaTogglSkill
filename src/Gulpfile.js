'use strict'

var gulp = require('gulp')
var zip = require('gulp-zip')
 
gulp.task('zip', function() {
  return gulp.src('**/*', { dot: true })
    .pipe(zip('toggl-src.zip'))
    .pipe(gulp.dest('../dist'))
})