var through = require('through-gulp');
var gulp = require('gulp');
var md5 = require('md5');
var fs = require('fs');

var jsRe = /<script.*?src=["'](.*?)[\?"']/;
var cssRe = /<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]/;
var imgRe = /<img.*?src=['"](.*?)['"]/;
var bgcRe = /background\s*:\s*url\(['"]?(.*?)['"]?\)/;
//targetReg == jsRe + cssRe + imgRe + bgcRe
//html标签属性值必须加引号
var targetReg = /<script.*?src=["'](.*?)[\?"']|<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]|<img.*?src=['"](.*?)['"]|background\s*:\s*url\(['"]?(.*?)['"]?\)/g;
 changePath = function(options, proRootPath){
    return through(function( file, enc, callback ){
        var jsRootPath = options.jsRootPath;
        var cssRootPath = options.cssRootPath;
        var imgRootPath = options.imgRootPath;
        if (/^\/\//.test(jsRootPath)) {
            jsRootPath = 'hdynamic:' + jsRootPath; //双斜杠开头的根路径加上一个临时的schema
        }
        if (/^\/\//.test(cssRootPath)) {
            cssRootPath = 'hdynamic:' + cssRootPath;
        }
        if (/^\/\//.test(imgRootPath)) {
            imgRootPath = 'hdynamic:' + imgRootPath;
        }
        var content = file.contents.toString();
        function delRepeatSprit(str) {
            var t= str.replace(/[\/\\]+/g, '/').replace('http:/', 'http://').replace('hdynamic:/', '//');
            return t;
        }
        content = content.replace(targetReg, function(p1, jsPath, cssPath, imgPath, bgcPath) {
            if (/data:image|['"](\/\/|http:\/\/)/.test(p1)) { //绝对路径,即路径中以//、http://开头的路径为外站路径以及base64图片,不予处理
                return p1;
            }
            if (jsPath) {
                var newPath = jsPath.replace(/\.+\//g, '/');
                return delRepeatSprit(p1.replace(jsPath, jsRootPath + newPath));
            }
            if (cssPath) {
                var newPath = cssPath.replace(/\.+\//g, '/');
                return delRepeatSprit(p1.replace(cssPath, cssRootPath + newPath).replace('.less', '.css'));
            }
            if (imgPath) {
                var newPath = imgPath.replace(/\.+\//g, '/');
                newPath = setImgVersion(proRootPath, newPath);
                return delRepeatSprit(p1.replace(imgPath, imgRootPath + newPath));
            }
            if (bgcPath) {
                var newPath = bgcPath.replace(/\.+\//g, '/');
                newPath = setImgVersion(proRootPath, newPath);
                return delRepeatSprit(p1.replace(bgcPath, imgRootPath + newPath));
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
module.exports = changePath;