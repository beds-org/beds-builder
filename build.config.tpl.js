/**
 * 构建路径配置文件
 * 要求：
 * 1、 sourcePath里所有路径都必须相对于业务项目根路径开始配置
 * 2、 distDir路径必须为绝对路径
 */
module.exports = {
    sourcePath : { //源文件构建路径配置。路径为string或string array。 支持globs。
        jsWithoutModulePath: '',
        jsEntryModulePath: '',
        cssPath: '',
        lessEntryModulePath: '',
        htmlPath: '',
        imgPath: '', //仅作拷贝处理
        otherFilesPath: '', //仅作拷贝处理
    },
    distDir: '' //构建后文件的存放目录
}