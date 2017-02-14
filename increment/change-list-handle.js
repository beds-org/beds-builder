"use strict"
/**
* 根据git commit hash值。找出changelist,并筛选出需要映射,需要构建的内容
 */
var path = require('path');
var childProcess = require('child_process');
var chalk = require('chalk');
var projectSrcRootPath = require('../doumi_config').proSrcRootPath;

var commitHash = null;
var targetFiles  = {
    html : [],
    chunk : [],
    js : [],
    css : [],
    img : [],
    other : []
}

function run(_commitHash) {
    commitHash = _commitHash
    return new Promise(function(resolve, reject) {
        pull(commitHash).then(getChangeList).then(function() {
            resolve(targetFiles);
        })
    })
}
//getChangeList('7e511516152c917fd7809a72a4ee343e630bbd08');
function getChangeList() {
    console.log(chalk.blue('获取change list...'));
    return new Promise(function(resolve, reject) {
        childProcess.exec('git diff --name-status ' +  commitHash + '^ ' +  commitHash
            ,{cwd : projectSrcRootPath},
            function(err, stdout, stderr) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(stdout.split('\n'));
                    fileFilter(stdout.split('\n'));
                    resolve();
                }
            }
        );
    });
};

function pull() {
    console.log(chalk.blue('pull 项目...'));
    return new Promise(function(resolve, reject) {
        childProcess.exec('git pull',
            {cwd : projectSrcRootPath},
            function(err, stdout, stderr) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(stdout);
                resolve();
            });
    });
}

/**
 * 文件筛选
 * 筛选出html js css/less 图片
 */
function fileFilter(files) {
    console.log(chalk.blue('  过滤前changelist:'));
    console.log(files);
    files.forEach(function(filePath) {
        if (filePath.charAt(0) == 'D') { //不处理删除的文件
            return;
        }
        filePath = path.normalize('/' + filePath.replace(/^.\s/, '')); //去掉头部操作符类型标记
        switch(path.extname(filePath)) {
            case '.html' :
                targetFiles.html.push(filePath);
                break;
            case '.chtml' :
                targetFiles.chunk.push(filePath);
                break;
            case '.js' :
                targetFiles.js.push(filePath);
                break;
            case '.css' :
            case '.less' :
                targetFiles.css.push(filePath);
                break;
            case '.gif' :
            case '.png' :
            case '.jpg' :
                targetFiles.img.push(filePath);
                break;
            default  : //图片和swf。暂时不处理swf
                targetFiles.other.push(filePath);
        }
    })
}

exports.run = run;
exports.filter = function(files) {
    files = files.split('\n');
    fileFilter(files);
    return targetFiles;
}