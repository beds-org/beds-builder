var path = require('path');
var gulp = require("gulp");
var ejs = require('gulp-ejs');
var uglify = require('gulp-uglify');
var less = require("gulp-less");
var cssMinify = require("gulp-minify-css");
var htmlmin = require('gulp-htmlmin');
var gulpSequence = require('gulp-sequence');
var ejsVar = require("./ejs_var.js");
var webpack = require('gulp-webpack');
var changePath = require('./change_path');
var dataStore = require('nedb');
var dbName = './file_version.db';
global.nedbObj = new dataStore({ filename: dbName, autoload: true });
global.nedbObj.ensureIndex({ fieldName: 'fileName', unique: true }, function (err) {

})
var versionMng = require('./file_version');
var htmlVersionHandle = require('./html_version_handle');

var buildData = null;

var config = require('./doumi_config');
var bPath = config.buildRootPathConfig;
var rPath = config.remoteRootPathConfig;

//构建css、less
gulp.task("css", function () {
    var glob = bPath.cssGlobPath;
    if (buildData) {
        glob = buildData.css.map(function(item) {
            return bPath.cssSrcRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.cssSrcRootPath})
        .pipe(less({
            modifyVars : {'@pic_path' : '"'+ rPath.css +'"'},
            paths : ['./', bPath.cssSrcRootPath]
        }))
        .pipe(changePath({imgRootPath : rPath.img}, bPath.imgSrcRootPath))
        .pipe(cssMinify())
        .pipe(versionMng({rootPath : bPath.cssSrcRootPath}))
        .pipe(gulp.dest(bPath.cssDistRootPath));
});


//合并js、混淆、压缩
gulp.task('lib-js', function() {
    var glob = bPath.jsLibGlobPath
    if (buildData) {
        glob = buildData.libJs.map(function(item) {
            return bPath.jsSrcRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.jsSrcRootPath})
        .pipe(versionMng({rootPath : bPath.jsSrcRootPath}))
        .pipe(uglify())
        .pipe(gulp.dest(bPath.jsDistRootPath));
})
gulp.task("js", function () {
    var glob = bPath.jsGlobPath;
    if (buildData) {
        glob = buildData.js.map(function(item) {
            return bPath.jsSrcRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.jsSrcRootPath})
        .pipe(webpack({
            output: {
                path : bPath.jsSrcRootPath, //必须配置，否则js文件的根路径为当前构建器所在的根路径
                filename: '[name]',
                chunkFilename : '[name]?v=[hash]'
            },
            resolve : {
                root : bPath.jsSrcRootPath
            },
            resolveLoader: { root: [path.join(__dirname, "node_modules"), __dirname] }, //指定loader路径
            module: {
                loaders: [
                    {test: /\.html$/, loader: 'raw-loader!html-minify'},
                    { test: /\.js$/, loader: 'module-path!babel?presets[]=es2015'}
                ]
            },
            //keep comments for avalon ms-for
            'html-minify-loader': {
                comments: true
            }
        }))
        .pipe(versionMng({rootPath : bPath.jsSrcRootPath}))
        .pipe(uglify())
        .pipe(gulp.dest(bPath.jsDistRootPath));
});

//解析html模板 ejs
gulp.task("html", function () {
    var glob = bPath.htmlGlobPath;
    if (buildData) {
        glob = buildData.html.map(function(item) {
            return bPath.htmlSrcRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.htmlSrcRootPath})
        .pipe(ejs(ejsVar.getEjsVar(rPath), {root : bPath.htmlSrcRootPath}))
        .pipe(gulp.dest(bPath.htmlDistRootPath));
});

gulp.task("htmlVersion", function() {
    var glob = bPath.htmlDistRootPath + 'view/**/*.html';
    if (buildData) {
        glob = buildData.html.map(function(item) {
            return bPath.htmlDistRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.htmlDistRootPath})
        .pipe(changePath({jsRootPath : rPath.js, cssRootPath : rPath.css, imgRootPath : rPath.img}, bPath.imgSrcRootPath))
        .pipe(htmlVersionHandle({jsRootPath : rPath.js, cssRootPath : rPath.css}))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(bPath.htmlDistRootPath));
});

gulp.task("img", function() {
    var glob = bPath.imgGlobPath;
    if (buildData) {
        glob = buildData.img.map(function(item) {
            return bPath.imgSrcRootPath + item;
        });
    }
    return gulp.src(glob, {base : bPath.imgSrcRootPath})
        .pipe(gulp.dest(bPath.imgDistRootPath));
});

//全量发布
gulp.task('default', gulpSequence(['lib-js', 'js', 'css', 'html', 'img'], 'htmlVersion'));

exports.setBuildData = function(_buildData) {
    buildData = _buildData;
};


