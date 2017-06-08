var through = require('through-gulp');
var gulp = require('gulp');
var md5 = require('md5');
var fs = require('fs');
var path = require('path');

var jsRe = /<script.*?src=["'](.*?)[\?"']/;
var cssRe = /<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]/;
var imgRe = /<img.*?src=['"](.*?)['"]/;
var bgcRe = /url\(['"]?(.*?)['"]?\)/; //background  和 font-face
//targetReg == jsRe + cssRe + imgRe + bgcRe

//html标签属性值必须加引号
var targetReg = /<script.*?src=["'](.*?)[\?"']|<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]|<img.*?src=['"](.*?)['"]|url\(['"]?(.*?)['"]?\)/g;
var ignoreReg = /^data:image|^\/\/|^[a-zA-Z]:\/\//; //data uri、schema以及 双斜杠开头的路径不处理

var opts = null;
var parasitiferPath = null;
function changePath(filePath) {
    switch(opts.pathType) {
        case 'absolute':
            if (!path.isAbsolute(filePath)) { //说明路径本身是相对路径，需要将其处理成绝对路径
                filePath = path.resolve(parasitiferPath, filePath);
                filePath = filePath.replace(opts.projectRootPath, '');
            }
            return path.normalize(path.join(opts.accessRootPath|| '', filePath));
            break;
        case 'relative':
            if (path.isAbsolute(filePath)) {
                filePath = path.relative(parasitiferPath, path.join(opts.projectRootPath, filePath))
            }
            return filePath
            break;
    }
}


var change = function(options){

    return through(function( file, enc, callback ){
        opts = options;
        parasitiferPath = path.dirname(file.history[0]);
        var content = file.contents.toString();
        content = content.replace(targetReg, function(p1, jsPath, cssPath, imgPath, bgcPath) {
            if (jsPath) {
                if (ignoreReg.test(jsPath)) {
                    return p1;
                } else {
                    return p1.replace(jsPath, changePath(jsPath));
                }
            }
            if (cssPath) {
                if (ignoreReg.test(cssPath)) {
                    return p1;
                } else {
                    return p1.replace(cssPath, changePath(cssPath).replace('.less', '.css'));
                }
            }
            if (imgPath) {
               // var newPath = imgPath.replace(/\.+\//g, '/');
               // newPath = setImgVersion(proRootPath, newPath);
                if (ignoreReg.test(imgPath)) {
                    return p1;
                } else {
                    return p1.replace(imgPath, changePath(imgPath));
                }
            }
            if (bgcPath) {
               // var newPath = bgcPath.replace(/\.+\//g, '/');
                //newPath = setImgVersion(proRootPath, newPath);
                if (ignoreReg.test(bgcPath)) {
                    return p1;
                } else {
                    return p1.replace(bgcPath, changePath(bgcPath));
                }
            }
            return p1;
        });
        file.contents = new Buffer(content);
        callback( null, file );
    });
};

function setImgVersion(proRootPath, newPath) {
    try {
        newPath += '?v=' + md5(fs.readFileSync(proRootPath + newPath));
        return newPath;
    } catch(e) {
        console.log('图片' + newPath + '未能设置版本号');
    }
}
module.exports = change;