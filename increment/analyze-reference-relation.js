var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var pathConfig = require('../doumi_config').buildRootPathConfig;
var htmlSrcRootPath = pathConfig.htmlSrcRootPath + '/view/';
var cssSrcRootPath = pathConfig.cssSrcRootPath;
var jsSrcRootPath = pathConfig.jsSrcRootPath;

var map = {
    html : {},
    entryJs : {},
    entryCss : {},
    chunk : {},
    js : {},
    css : {}
};


/**
 * 分析视图文件(入口)，html放到 html对象
 * @param viewFilePath  视图文件路径
 * @param _map json对象，用于存储映射关系
 */
function analyzeQuote (viewFilePath) {
    viewFilePath = path.normalize(viewFilePath);
    var realFilePath = htmlSrcRootPath + viewFilePath;
    var viewFileContent;
    try {
        viewFileContent = fs.readFileSync(realFilePath, {encoding : "utf8"});
    } catch (e) {
        console.log(chalk.red("引用分析,没有发现html文件:" + realFilePath));
        return;
    }
    var rpViewFilePath = viewFilePath.replace(/[\.]+\//g, "");
    if (!/\.chtml$/.test(viewFilePath)) {
        map.html[rpViewFilePath] || (map.html[rpViewFilePath] = 1);
    }
    //找到css引用 必须使用绝对路径引用。不能使用.或..开头的路径。 css里不能使用import。 less使用import也遵循前面的路径原则。且都不能省略后缀
    viewFileContent.replace(/<%setCss.*?\[?([',"].*[',"]).*?%>|<link.*?rel=["']stylesheet["'].*?href=['"](.*?)[\?'"]/g, function() {
        var e = arguments[1] || arguments[2];
        e = e.replace(/['" ]/g,"").split(",");
        e.forEach(function(cssPath) {
            map.entryCss[cssPath] || (map.entryCss[cssPath] = []);
            map.entryCss[cssPath].push(rpViewFilePath)
            //递归分析less
            if (/\.less$/.test(cssPath)) {
                analyzeLess(cssPath, cssPath);
            }
        })
    });
    //找到js引用
    viewFileContent.replace(/<%setJs.*?\[?([',"].*[',"]).*?%>|<script.*?src=["'](.*?)[\?"']/g, function() {
        var e = arguments[1] || arguments[2];
        e = e.replace(/['" ]/g,"").split(",");
        e.forEach(function(jsPath) {

            map.entryJs[jsPath] ||  (map.entryJs[jsPath] = []);
            map.entryJs[jsPath].push(rpViewFilePath);
            //递归分析js
            if (!/^\/common\/lib\//.test(jsPath)) {
                analyzeJs(jsPath, jsPath);
            }
        })
    });
    //找到include引用
    viewFileContent.replace(/<%[ ]*include[ ]+(.*?)%>/g, function() {
        var includeFilePath = arguments[1];
        //将相对路径转成绝对路径
        map.chunk[includeFilePath] || (map.chunk[includeFilePath] = []) ;
        map.chunk[includeFilePath].push(viewFilePath);
        //递归分析include  暂略
    });
}

//递归分析less中的import
function analyzeLess(entryFilePath, parentFilePath) {
    var realParentFilePath = cssSrcRootPath + parentFilePath;
    var _args = arguments;
    var content = fs.readFileSync(realParentFilePath, {encoding : "utf8"});
    //找到父文件中引用的文件
    content.replace(/@import\s*[",'](.*?)[",'][;]?/g, function() {
        var subFilePath = arguments[1];
        //存到映射中
        !map.css[subFilePath] ? (map.css[subFilePath] = [entryFilePath]) : map.css[subFilePath].push(entryFilePath);
        _args.callee(entryFilePath, subFilePath);
    });

}



//递归分析js 中的require，放到js
function analyzeJs(entryFilePath, parentFilePath) {
    var realParentFilePath = jsSrcRootPath + parentFilePath;
    var _args = arguments;
    var content;
    try {
        content = fs.readFileSync(realParentFilePath, {encoding : "utf8"});
    } catch(e) {
        console.log("js文件require错误：" +　e);
        return;
    }
    //找到父文件中引用的文件
    content.replace(/require\(["'](.*?)["']\)/g, function() {
        var subFilePath = arguments[1];
        //存到映射中
        !map.js[subFilePath] ? (map.js[subFilePath] = [entryFilePath]) : map.js[subFilePath].push(entryFilePath);
        _args.callee(entryFilePath, subFilePath);
    });
}


//递归找到include，放到html

function analyzeAll() {
    mapDir(htmlSrcRootPath);
    output();
}

function mapDir (dir) {
    var files;
    try {
        var files = fs.readdirSync (dir);
    } catch(e) {
        console.log(e);
        return;
    }
    files.forEach(function(file){
        file = dir + '/' + file;
        var stats = fs.lstatSync (file);
        if (stats.isDirectory()) {
            mapDir(file);
        }else if (stats.isFile() && (path.extname(file) == '.html' || path.extname(file) == '.chtml')){ //分析
            file = file.replace(htmlSrcRootPath,'');
            analyzeQuote(file);
        }
    });

}

function batchAnalyzeReference(htmlFileArr) {
    map = require(process.cwd() + '/mapping.json');
    htmlFileArr.forEach(function(filePath) {
        analyzeQuote(filePath)
    });
    output();
}

/**
 * 输出为json文件
 */
function output() {
    var outputFilename = process.cwd() + '/mapping.json';
    fs.writeFileSync(outputFilename, JSON.stringify(map, null, 4));
    console.log(chalk.blue("新生成的关系映射文件被保存到：" + outputFilename));
}

exports.batchAnalyzeReference = batchAnalyzeReference;
exports.analyzeAll = analyzeAll;
exports.analyzeQuote = analyzeQuote;
exports.analyzeLess = analyzeLess;
exports.analyzeJs = analyzeJs;