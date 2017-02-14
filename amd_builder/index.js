var through = require('through-gulp');
var gulp = require('gulp');
var Promise = require('bluebird');
var _ = require('underscore');

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
var SLASH_RE = /\\\\/g;

function AMDBuilder () {
    return through(function( file, enc, callback ){
        var fileName = file.history[0].replace(/[\\\/]+/g, '/').replace(file.base.replace(/[\\\/]+/g, '/'), '');
        file.contents = new Buffer(transport(fileName, file.contents.toString()));
        callback(null, file);
    })

}

function parseDependencies(code) {
    var ret = [];

    code.replace(SLASH_RE, '')
        .replace(REQUIRE_RE, function(m, m1, m2) {
            if (m2) {
                ret.push(m2);
            }
        });

    return _.unique(ret.sort(), true);
}

function transport (filename, content) {
    var deps = JSON.stringify(parseDependencies(content));

    return 'define("' + filename.replace(/\\/g, '/') + '", ' + deps + ', function (require, exports, module) {\n' + content + '\n});';
}

module.exports = AMDBuilder;