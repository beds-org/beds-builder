var through = require('through-gulp');
var gulp = require('gulp');
var fs = require('fs');
var path =require('path');
function concat(content, basePath) {
    var depContentArr = [];
    var deps = content.replace(/\r/g, '').split('\n')
    deps.forEach(function(dep) {
        depContentArr.push(fs.readFileSync(path.join(basePath, dep), 'utf8'));
    });
    return depContentArr.join('\n');
}


var fileConcat = function(){
    return through(function( file, enc, callback ){
        file.contents = new Buffer(concat(file.contents.toString(), file.base));
        callback( null, file );
    })
}

module.exports = fileConcat;