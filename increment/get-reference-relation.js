var ar = require('./analyze-reference-relation');
var path = require('path');
var fs = require('fs');
var targetFiles = null;
var chalk = require('chalk')
var mappingFilePath = process.cwd() + '/mapping.json';
var mappingData = null;
var targetBuildFile = {
    'html' : [],
    'js' : [],
    'libJs' : [],
    'css' : [],
    'img' :  []
}
function run(_targetFiles) {
    targetFiles = _targetFiles;
    if (fs.existsSync(mappingFilePath)) {
        analyzeTargetHtmlFile();
    } else {
        analyzeAll()
    }
    mappingData = require(mappingFilePath);
    getTargetBuildFile();
    //去重
    for (var type in targetBuildFile) {
        targetBuildFile[type] = targetBuildFile[type].distinct();
    }
    return targetBuildFile;
}

function analyzeAll() {
    ar.analyzeAll();
}

function analyzeTargetHtmlFile() {
    ar.batchAnalyzeReference(targetFiles.html);
}


function getTargetBuildFile() {
    targetBuildFile.img = targetFiles.img;
    get(targetFiles.html.concat(targetFiles.js).concat(targetFiles.css).concat(targetFiles.chunk));
}

function get(filePathArr) {
    filePathArr.forEach(function(filePath) {
        var fileType = path.extname(filePath);
        switch(fileType) {
            case '.js' :
                var htmlArr = mappingData.entryJs[filePath];
                if (htmlArr && htmlArr.length > 0) {
                    targetBuildFile.js.push(filePath);
                    get(htmlArr);
                }
                var jsArr = mappingData.js[filePath];
                if (jsArr && jsArr.length > 0) {
                    get(jsArr);
                }
                if (filePath.indexOf('/common/lib/') > -1) {
                    targetBuildFile.libJs.push(filePath);
                }
                break;
            case '.css' :
            case '.less' :
                var htmlArr = mappingData.entryCss[filePath];
                if (htmlArr && htmlArr.length > 0) {
                    targetBuildFile.css.push(filePath);
                    get(htmlArr);
                }
                var cssArr = mappingData.css[filePath];
                if (cssArr && cssArr.length > 0) {
                    get(cssArr);
                }
                break;
            case '.chtml' :
                var htmlArr = mappingData.chunk[filePath];
                if (htmlArr && htmlArr.length > 0) {
                    get(htmlArr);
                }
                break;
            case '.html' :
                if (filePath.indexOf('/proto_view/') < 0) {
                    targetBuildFile.html.push(filePath);
                }
                break;
        }
    })
}

//去重
function arrSet(arrObj, ele) {
    var len = arrObj.length;
    var has = false;
    for (var i = 0; i < len; i++) {
        if (arrObj[i] == ele) {
            has = true;
            break;
        }
    }
    has || arrObj.push(ele);
}


Array.prototype.distinct = Array.prototype.distinct || function () {
        //return Array.from(new Set(this));
        return [...new Set(this)];
    };

exports.run = run;