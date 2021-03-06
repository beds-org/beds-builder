var Promise = require('promise');
var through = require('through-gulp');
var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var db = global.nedbObj;
var targetReg = /<script.*?src=["'](.*?)[\?"']|<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]/g;

var opts = null;
var parasitiferPath = null;
var filePathMap = {};
function changePath(filePath) {
    if (!path.isAbsolute(filePath)) { //说明路径本身是相对路径，需要将其处理成绝对路径
        var temp = filePath;
        filePath = path.resolve(parasitiferPath, filePath);
        filePath = filePath.replace(opts.projectRootPath, '');
        filePathMap[filePath] = temp;
    }
    return filePath
}

// 插件入口函数
var htmlVersionHandle = function(options){
    return through(function( file, enc, callback ){
        opts = options;
        parasitiferPath = path.dirname(file.history[0]);
        var promiseArr = [];
        var jsRootPath = options.jsRootPath;
        var cssRootPath = options.cssRootPath;
        var content = file.contents.toString();
        content.replace(targetReg, function(target, s1, s2) {
            var rootPath = s1 ? jsRootPath : cssRootPath;  //s1表示匹配到的js。 s2表示匹配到的是css
            var fileName= s1 || s2;
            fileName = fileName.replace(rootPath, '');
           // fileName = ('/' + fileName).replace(/[\\\/]+/g, '/'); //路径以斜杠开头
            fileName = changePath(fileName)
            promiseArr.push(new Promise(function(resolve, reject) {
                db.find({'fileName' : fileName}, function(err, docs) {
                    if (docs.length == 0) {
                        console.log('文件：' + fileName + ', 没有查到版本号');
                    }
                    resolve(docs[0]);
                });
            }));

        });
        Promise.all(promiseArr).done(function(docArr) {
            docArr.forEach(function(doc) {
                if (!doc) {
                    return;
                }
                var reg = new RegExp((filePathMap[doc.fileName] || doc.fileName) + '(\\??).*?(t=.*?(?=[\'\"&])|(?=[\'\"]))');
                content = content.replace(reg, function(p1, p2, p3) {
                    if (!p2) {
                        p1 += '?';
                    }
                    if (!p3 && p1.lastIndexOf('?') != (p1.length -1)) {
                        p1 += '&';
                    }
                    if (p3) {
                        p1 = p1.replace(p3, 't=' + doc.md5)
                    } else {
                        p1 += 't=' + doc.md5;
                    }
                    return p1;
                });
            });
            file.contents = new Buffer(content);
            callback( null, file );
        });
    });
};

module.exports = htmlVersionHandle;