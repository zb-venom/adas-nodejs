const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')

const usersSchema = require('../models/users');
const sidSchema = require('../models/sid');

async function check(req, res) {
    var user = await usersSchema.findOne({_id: req.cookies._id});
    var result = {
        online: false,
        admin: false,
    }
    if (user) {
        var sid = await sidSchema.findOne({user_id: user._id, sid: req.cookies.sid});
        if (sid) {
            result.online = sid.online;
            result.admin = (user.type == 1);
            result.none = (user.type == 0);
        } else {
            if (!req.params.hash)  res.clearCookie('_id');
            res.clearCookie('sid');
        }
    }
    return result;
}

module.exports.check = check;