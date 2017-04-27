"use strict";
const path = require('path');
const gulp = require("gulp");
const ejs = require('gulp-ejs');
const uglify = require('gulp-uglify');
const less = require("gulp-less");
const cssMinify = require("gulp-minify-css");
const htmlmin = require('gulp-htmlmin');
const gulpSequence = require('gulp-sequence');
const ejsVar = require("./ejs_var.js");
const webpack = require('gulp-webpack');
const clean = require('gulp-clean');
const Q = require('q');
const zip = require('gulp-zip');
const notify = require('gulp-notify');
const os = require('os');

const dataStore = require('nedb');
const dbName = './file_version.db';
global.nedbObj = new dataStore({ filename: dbName, autoload: true });
global.nedbObj.ensureIndex({ fieldName: 'fileName', unique: true }, function (err) {

})
const changePath = require('./custom_builder/change-path');
const genVersion = require('./custom_builder/generate-file-version');
const htmlInnerResVersionHandle = require('./custom_builder/add-file-version');
const ejsPatch = require('./custom_builder/ejs-patch');

//const plugins = require("gulp-load-plugins")();

const config = require('./doumi_config');

const rpath = config.remoteRootPathConfig;

//构建源文件路径配置
const projectSrcRootDir = config.proSrcRootPath;

let jsRootModuleSrcFileDir = projectSrcRootDir;  //gulp base路径时使用
let jsRootModuleSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/modules/**/*.js')];

let jsUnModuleSrcFileRootDir = projectSrcRootDir;
let jsUnModuleSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/common/js_lib/*.js'), '!' + path.join(projectSrcRootDir, '/html/common/js_lib/sea.js')];

let cssSrcFileRootDir = projectSrcRootDir;
let cssSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/static/css/**/*.css')];

let lessRootModuleSrcFileRootDir = projectSrcRootDir;
let lessRootModuleSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/modules/**/*.less')];

let htmlSrcFileRootDir = projectSrcRootDir;
let htmlSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/modules/**/*.html')];

let imgSrcFileRootDir = projectSrcRootDir;
let imgSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/static/images/**/*.*')];

let othersSrcFileRootDir = projectSrcRootDir;
let othersSrcFilePathGlob = [path.join(projectSrcRootDir, '/html/static/fonts/**/*.*'), path.join(projectSrcRootDir, '/html/favicon.png'), path.join(projectSrcRootDir, '/html/cache.manifest')];

//发布路径配置
const distRootDir = config.proDistRootDir;
let jsDistFileRootDir = distRootDir;
let cssDistFileRootDir = distRootDir;
let imgDistFileRootDir = distRootDir;
let htmlDistFileRootDir = distRootDir;

//实际请求时的基路径配置
const requestBasePath = config.remoteRootPathConfig;

let jsRequestBasePath = requestBasePath.js;
let cssRequestBasePath = requestBasePath.css;
let imgRequestBasePath = requestBasePath.img;

/**
 * @desc 清空构建目录
 * @src  destPath
 * @deps none
 * @dest destPath
 */
gulp.task("cleanDistDir", function () {
    return gulp.src(distRootDir + '/html', {read: false})
        .pipe(clean({force: true}));
});

//带lib的资源都是直接被html引用的。也就是说没有模块化。


/**
* 处理非模块化js文件
*/
gulp.task("jsWithoutModule", function () {
    return gulp.src(jsUnModuleSrcFilePathGlob, {base : jsUnModuleSrcFileRootDir})
        .pipe(uglify())
        .pipe(gulp.dest(distRootDir));
});

/**
 * 处理根模块js文件
 * 特点：模块化文件、根模块
 */
gulp.task("jsRootModule", function () {
    return gulp.src(jsRootModuleSrcFilePathGlob, {base : jsRootModuleSrcFileDir})
        .pipe(webpack({
            output: {
                path : jsRootModuleSrcFileDir, //必须配置，否则js文件的根路径为当前构建器所在的根路径
                filename: '[name]',
                chunkFilename : '[name]?v=[hash]'
            },
            resolve : {
                root : jsRootModuleSrcFileDir
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
        .pipe(genVersion({rootPath : jsRootModuleSrcFileDir}))
        .pipe(uglify())
        .pipe(gulp.dest(distRootDir));
});


/**
 * 处理 css
 * 特点：非模块化文件
 */
gulp.task("css", function () {
    return gulp.src(cssSrcFilePathGlob, {base : cssSrcFileRootDir})
        .pipe(changePath({projectRootPath: projectSrcRootDir, pathType: 'relative', accessRootPath: ''}))
        .pipe(cssMinify())
        .pipe(genVersion({rootPath : lessRootModuleSrcFileRootDir}))
        .pipe(gulp.dest(distRootDir));
});


/**
 * 处理less
 * 特点：模块化文件、且是根模块
 */
gulp.task("lessRootModule", function () {

    return gulp.src(lessRootModuleSrcFilePathGlob, {base : lessRootModuleSrcFileRootDir})
        .pipe(less({
            //modifyVars : {'@pic_path' : '"'+ rPath.css +'"'},
            paths : ['./', lessRootModuleSrcFileRootDir]
        }))
        .pipe(changePath({projectRootPath: projectSrcRootDir, pathType: 'relative'}))
        .pipe(cssMinify())
        .pipe(genVersion({rootPath : lessRootModuleSrcFileRootDir}))
        .pipe(gulp.dest(distRootDir));
});

gulp.task('img', function() {
    return gulp.src(imgSrcFilePathGlob, {base : imgSrcFileRootDir}).pipe(gulp.dest(distRootDir));
})

/**
 * 直接拷贝，不用处理的资源。
 * 如字体文件、swf、cache.manifest、favicon.png文件等
 */
gulp.task('others', function() {
    return gulp.src(othersSrcFilePathGlob, {base : othersSrcFileRootDir}).pipe(gulp.dest(distRootDir));

})

/**
 * 解析入口html模板 ejs
 */
gulp.task("html", function () {
    let ejsPathConfig = {root : htmlSrcFileRootDir, filename: ''};
    return gulp.src(htmlSrcFilePathGlob, {base : htmlSrcFileRootDir})
        .pipe(ejsPatch(ejsPathConfig))
        .pipe(ejs(ejsVar.getEjsVar(rpath), ejsPathConfig))
        .pipe(changePath({projectRootPath: projectSrcRootDir, pathType: 'relative'}))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(distRootDir));
});


/*
 * @desc 将所有资源项目打包压缩并加上时间戳
 * @src  devPath destPath
 * @deps cleanCss,cleanScript
 * @dest basePath/bin
 */


var globalTimesup = '';
gulp.task('compressionZip', function () {
    var timesup = new Date().format("MMddhhmmss");
    globalTimesup = timesup;
   return gulp.src([distRootDir + '/html/**/*'])
        .pipe(zip("html_"+timesup+".zip"))
        .pipe(gulp.dest(distRootDir + "/bin"))
});

/*
 * @desc dek加密html.zip文件
 * @src  devPath destPath
 * @deps compressionzip
 * @dest basePath/bin
 */
var dek_key = '@Dou$Mi&Jian$Zhi@H5!';
gulp.task('dekHtml', function () {
    var deferred = Q.defer();
    var commond = '';
    var spawn = require('child_process').spawn;
    //./dek -i a.zip -o b.dek -k I'mKey –e
    if(os.platform().toLowerCase() == 'linux'){
        commond = './dek_linux';
    }else{
        commond = './dek';
    }
    var run = spawn(commond, ['-i', distRootDir + '/bin/html_' + globalTimesup + '.zip', '-k', dek_key, '-e']);
    run.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });
    run.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });
    run.on('exit', function (code) {
        console.log("dek html.zip end");
        deferred.resolve();
    });

    return deferred.promise;

});

/*
 * @desc 重命名dek文件
 * @src  devPath destPath
 * @deps dekdev
 * @dest basePath/bin
 */
gulp.task('renameHtmlDek', function () {
    var deferred = Q.defer();

    var spawn = require('child_process').spawn;
    //./dek -i a.zip -o b.dek -k I'mKey –e
    var run = spawn('mv', [distRootDir + '/bin/html_' + globalTimesup + '.zip.dek', distRootDir + '/bin/html_' + globalTimesup + '.dek']);
    run.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });
    run.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });
    run.on('exit', function (code) {
        console.log("rename end");
        deferred.resolve();
    });

    return deferred.promise;

});

Date.prototype.format = function(format){
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        }
    }
    return format;
};


gulp.task('default', gulpSequence('cleanDistDir',['jsWithoutModule', 'jsRootModule', 'css', 'lessRootModule', 'img', 'html', 'others'],'compressionZip', 'dekHtml', 'renameHtmlDek'));
