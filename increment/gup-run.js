/**
 * 运行gulp任务
 */
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
var chalk = require('chalk');
var gulpInst = require('gulp');
var gf = require('../gulpfile');

function run(buildData) {
    gf.setBuildData(buildData);
    logEvents(gulpInst);
    gulpInst.start.apply(gulpInst, ['default']);
}

/**
 * gulp 任务执行日志
 * copy by bin/gulp.js
 * @param gulpInst
 */
function logEvents(gulpInst) {
    // Total hack due to poor error management in orchestrator
    gulpInst.on('err', function() {
        failed = true;
    });

    gulpInst.on('task_start', function(e) {
        // TODO: batch these
        // so when 5 tasks start at once it only logs one time with all 5
        gutil.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
    });

    gulpInst.on('task_stop', function(e) {
        var time = prettyTime(e.hrDuration);
        gutil.log(
            'Finished', '\'' + chalk.cyan(e.task) + '\'',
            'after', chalk.magenta(time)
        );
        if (e.task == 'default') {
            gutil.log('build complete! without errors!');
        }
    });

    gulpInst.on('task_err', function(e) {
        var msg = formatError(e);
        var time = prettyTime(e.hrDuration);
        gutil.log(
            '\'' + chalk.cyan(e.task) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );
        gutil.log(msg);
    });

    gulpInst.on('task_not_found', function(err) {
        gutil.log(
            chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
        );
        gutil.log('Please check the documentation for proper gulpfile formatting');
        process.exit(1);
    });
}

exports.run = run;