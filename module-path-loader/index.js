/**
 * webpack loader
 * 将require或require.ensure的js路径前面的左斜杠(/)去掉。
 * 因为webpack默认会把/开头的路径当做系统根路径。而在项目中左斜杠应该代表项目的根路径
 * @param source
 * @returns {Buffer}
 */
module.exports = function(source) {
    source = source.toString().replace(/(require|ensure)\s*\(\s*["'](.*?)["']/g, function(p1,p2,p3) {
        var newP3 = p3;
        if (p3.indexOf('/') == 0) {
            newP3 = p3.substr(1);
        }
        return p1.replace(p3, newP3)
    });
    return new Buffer(source);
};

module.exports.raw = true;
