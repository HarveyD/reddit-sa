var gulp = require('gulp');

var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');

gulp.task('build', function () {
	return browserify({ entries: './js/main.js', debug: true })
		.transform("babelify", { presets: ['es2015'] })
		.bundle()
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./dist'))
		.pipe(livereload());
});

gulp.task('sass', function () {
	return gulp.src('css/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['build', 'sass'], function () {
	livereload.listen();
	gulp.watch('./js/*.js', ['build']);
	gulp.watch('./css/*.scss', ['sass']);
});

gulp.task('build', ['build', 'sass'], function () {
	gulp.watch('./js/*.js', ['build']);
	gulp.watch('./css/*.scss', ['sass']);
});

gulp.task('default', ['watch']);