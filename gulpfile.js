const gulp = require('gulp');

const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const htmlmin = require('gulp-htmlmin');

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
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(gulp.dest('./dist'));
});

gulp.task('image', () => {
	return gulp.src('images/*')
		.pipe(imagemin())
		.pipe(gulp.dest('dist/images'))
});

gulp.task('html', function() {
  return gulp.src('*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build', 'sass', 'html', 'image'], function () {
	livereload.listen();
	gulp.watch('./js/*.js', ['build']);
	gulp.watch('./css/*.scss', ['sass']);
	gulp.watch('./images/*', ['image']);
	gulp.watch('./*.html', ['html']);
});

gulp.task('build:prod', ['build', 'sass', 'html', 'image']);

gulp.task('default', ['watch']);