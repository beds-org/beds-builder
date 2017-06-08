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
var clean = require('gulp-clean');

var dataStore = require('nedb');
var dbName = './file_version.db';
global.nedbObj = new dataStore({ filename: dbName, autoload: true });
global.nedbObj.ensureIndex({ fieldName: 'fileName', unique: true }, function (err) {

})
var changePath = require('./custom_builder/change-path');
var genVersion = require('./custom_builder/generate-file-version');
var htmlInnerResVersionHandle = require('./custom_builder/add-file-version');
var ejsPatch = require('./custom_builder/ejs-patch');

var buildData = null;
var pathConfig = null;
var globalPathType = 'relative'; //'absolute'; //relative
var projectRootDir = process.cwd();

var config = require('./doumi_config');
var bPath = config.buildRootPathConfig;
var rPath = config.remoteRootPathConfig;

function pathHandle() {
    for (var i in pathConfig.sourcePath) {
        pathConfig.sourcePath[i] = path.join(projectRootDir, pathConfig.sourcePath[i]);
    }
}

/**
 * 处理 css
 * 特点：非模块化文件
 */
gulp.task("css", function () {
    return gulp.src(pathConfig.sourcePath.cssPath, {base : projectRootDir})
        .pipe(changePath({projectRootPath: projectRootDir, pathType: globalPathType, accessRootPath: ''}))
        .pipe(cssMinify())
        .pipe(genVersion({rootPath : projectRootDir}))
        .pipe(gulp.dest(pathConfig.distDir));
});

/**
 * 处理less
 * 特点：模块化文件、且是根模块
 */
gulp.task("lessEntryModule", function () {

    return gulp.src(pathConfig.sourcePath.lessEntryModulePath, {base : projectRootDir})
        .pipe(less({
            //modifyVars : {'@pic_path' : '"'+ rPath.css +'"'},
            paths : ['./', projectRootDir]
        }))
        .pipe(changePath({projectRootPath: projectRootDir, pathType: globalPathType}))
        .pipe(cssMinify())
        .pipe(genVersion({rootPath : projectRootDir}))
        .pipe(gulp.dest(pathConfig.distDir));
});

/**
 * 处理非模块化js文件
 */
gulp.task("jsWithoutModule", function () {
    return gulp.src(pathConfig.sourcePath.jsWithoutModulePath, {base : projectRootDir})
        .pipe(genVersion({rootPath : projectRootDir}))
        .pipe(uglify())
        .pipe(gulp.dest(pathConfig.distDir));
});

/**
 * 处理根模块js文件
 * 特点：模块化文件、根模块
 */
gulp.task("jsEntryModule", function () {
    return gulp.src(pathConfig.sourcePath.jsEntryModulePath, {base : projectRootDir})
        .pipe(webpack({
            output: {
                path : projectRootDir, //必须配置，否则js文件的根路径为当前构建器所在的根路径
                filename: '[name]',
                chunkFilename : '[name]?v=[hash]'
            },
            resolve : {
                root : projectRootDir
            },
            resolveLoader: { root: [path.join(__dirname, "node_modules"), path.join(__dirname, "custom_loader")] }, //指定loader路径
            module: {
                loaders: [
                    {test: /\.html$/, loader: 'raw-loader!html-minify'},
                    { test: /\.js$/, loader: 'path-handle!babel?presets[]=es2015'}
                ]
            },
            //keep comments for avalon ms-for
            'html-minify-loader': {
                comments: true
            }
        }))
        .pipe(genVersion({rootPath : projectRootDir}))
        .pipe(uglify())
        .pipe(gulp.dest(pathConfig.distDir));
});

/**
 * 解析入口html模板 ejs
 */
gulp.task("html", function () {
    let ejsPathConfig = {root : projectRootDir, filename: ''};
    return gulp.src(pathConfig.sourcePath.htmlPath, {base : projectRootDir})
        .pipe(ejsPatch(ejsPathConfig))
        .pipe(ejs(null, ejsPathConfig))
        .pipe(changePath({projectRootPath: projectRootDir, pathType: globalPathType})) //changePath必须在htmlInnerResVersionHandle之前执行，否则css找不到版本号
        .pipe(htmlInnerResVersionHandle({projectRootPath: projectRootDir,jsRootPath : rPath.js, cssRootPath : rPath.css}))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(pathConfig.distDir));
});

gulp.task('img', function() {
    return gulp.src(pathConfig.sourcePath.imgPath, {base : projectRootDir})
        .pipe(gulp.dest(pathConfig.distDir));
});

/**
 * 直接拷贝，不用处理的资源。
 * 如字体文件、swf、cache.manifest、favicon.png文件等
 */
gulp.task('others', function() {
    return gulp.src(pathConfig.sourcePath.otherFilesPath, {base : projectRootDir}).pipe(gulp.dest(pathConfig.distDir));

});

/**
 * @desc 清空构建目录
 * @src  destPath
 * @deps none
 * @dest destPath
 */
gulp.task("cleanDistDir", function () {
    return gulp.src(pathConfig.distDir, {read: false})
        .pipe(clean({force: true}));
});

//全量发布
gulp.task('default', gulpSequence('cleanDistDir', ['jsWithoutModule', 'jsEntryModule', 'css', 'lessEntryModule', 'img', 'others'], 'html'));


exports.setOptions = function(opt) {
    buildData = opt.buildData;
    pathConfig = opt.pathConfig;
    pathHandle();
}


