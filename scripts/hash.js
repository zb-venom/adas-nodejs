const md5 = require('js-md5');
const nodeSid = require('node-sid');

function getHash(pass, salt) {
    return (md5(salt) + md5(pass) + md5(salt).split('').reverse().join('')).split('').reverse().join('');
}

function getSalt(string, lenght) {
    return nodeSid().create(string, lenght);
}

module.exports.getHash = getHash;
module.exports.getSalt = getSalt;