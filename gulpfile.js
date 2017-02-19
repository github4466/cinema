let gulp = require('gulp'),
  	rename = require('gulp-rename'),
  	sass = require('gulp-sass'),
    cssmin = require('gulp-clean-css'),
  	autoprefixer = require('gulp-autoprefixer'),
    htmlmin = require('gulp-htmlmin'),
    uglify = require('gulp-uglify'),
    concat = require("gulp-concat"),
    browserSync = require('browser-sync').create()

gulp.task('html', () => {
  let options = {
    removeComments: true,//清除HTML注释
    collapseWhitespace: true,//压缩HTML
    collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
    minifyJS: true,//压缩页面JS
    minifyCSS: true//压缩页面CSS
  }
  gulp.src('src/index.html')
      .pipe(htmlmin(options))
      .pipe(gulp.dest('dist'))
      .pipe(browserSync.stream())
})

gulp.task('sass', () => {
  gulp.src('src/scss/all.scss')
      .pipe(sass({outputStyle: 'expanded'}))
      .pipe(autoprefixer({
          browsers: ['last 15 versions', '> 1%', 'ie 8', 'ie 7'],
          remove:true //去掉不必要的前缀
      }))
      .pipe(cssmin({
        keepSpecialComments: '*'  //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
      }))
      .pipe(gulp.dest('dist/css'))
      .pipe(browserSync.stream())  
})


gulp.task('js', () => {
  gulp.src(['src/js/common.js','src/js/main.js'])
      .pipe(concat('all.js'))
      .pipe(uglify())
      .pipe(gulp.dest('dist/js'))
      .pipe(browserSync.stream())
})

gulp.task('browser-sync', ['sass', 'html', 'js'], () => {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })
  gulp.watch('src/scss/*.scss', ['sass'])
  gulp.watch('src/*.html', ['html'])
  gulp.watch('src/js/*.js', ['js'])  
})            

gulp.task('default', ['browser-sync'])