/**
 * 构建路径配置
 */
var proSrcRootPath = '/Users/gy/WebstormProjects/c_m_doumi/';
var proDistRootPath = '/Users/gy/WebstormProjects/c_m_doumi/dist/';
var remoteStaticResDomain = 'http://192.168.45.182'; //如果是测试发布,不要用localhost。phantom不支持
var remoteApiDomain = '/virtual-api';
exports.buildRootPathConfig = {
    //资源根目录
    jsSrcRootPath : proSrcRootPath,
    cssSrcRootPath : proSrcRootPath,
    imgSrcRootPath : proSrcRootPath,
    htmlSrcRootPath : proSrcRootPath,
    //glob目录
    jsGlobPath : [proSrcRootPath + '/static/js/**/*.js', '!' + proSrcRootPath + '/static/js/**/widget/**/*.js'],
    jsLibGlobPath : proSrcRootPath + '/common/js_lib/**/*.js',
    cssGlobPath : [proSrcRootPath + '/static/css/**/*.css', proSrcRootPath + '/static/less/**/*.less', proSrcRootPath + '/common/css_lib/**/*.css'],
    imgGlobPath : proSrcRootPath + '/static/img/**/*.*',
    htmlGlobPath : proSrcRootPath + '/view/**/*.html',
    //发布目录
    jsDistRootPath : proDistRootPath,
    cssDistRootPath : proDistRootPath,
    imgDistRootPath : proDistRootPath,
    htmlDistRootPath : proDistRootPath
}

//远程根路径配置：线上静态文件的实际根目录。
exports.remoteRootPathConfig = {
        js : remoteStaticResDomain,
        css : remoteStaticResDomain,
        img : remoteStaticResDomain,
        beApiRootPath : remoteApiDomain
}

exports.proSrcRootPath = proSrcRootPath;