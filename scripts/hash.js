const md5 = require('js-md5');

function hash(pass) {
    var result = md5(pass)
    return result
}