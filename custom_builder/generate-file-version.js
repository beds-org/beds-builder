var through = require('through-gulp');
var gulp = require('gulp');
var md5 = require('md5');

var fs = require('fs');

var db = global.nedbObj;
// 插件入口函数
var generateFileVersion = function(options){
    return through(function( file, enc, callback ){
        var rootPath = '';
        if (options && options.rootPath) {
            rootPath = options.rootPath;
        }
        var fileName = file.history[0].replace(/[\\\/]+/g, '/').replace(rootPath, '');
        fileName = ('/' + fileName).replace(/[\\\/]+/g, '/').replace(/\.less$/, ".css"); //路径以斜杠开头
        if (!file.contents) {
            callback( null, file );
            return;
        }
        var content = file.contents.toString();
        var md5Info = md5(content);
        var doc = {
            fileName : fileName,
            md5 : md5Info
        }
        db.update({fileName : doc.fileName}, doc, {upsert : true});
        callback( null, file );
    });
};

module.exports = generateFileVersion;