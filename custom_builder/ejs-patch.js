"use strict";
/**
 * ejs支持相对路径
 * @type {through}
 */
const through = require('through-gulp');
const gulp = require('gulp');

const ejsPatch = function(ejsPathConfig){
    return through(function( file, enc, callback ){
        ejsPathConfig.filename = file.history[0];
        callback( null, file);
    })
}

module.exports = ejsPatch;