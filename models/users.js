const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    login: String,
    password:  String,
    salt: String,
    email: String,
    phone: String,
    about: String,
    new_password: Boolean,
    new_password_hash: String,
    vk_uid: {
        type: String,
        default: ''
    },
    google_uid: {
        type: String,
        default: ''
    },
    ya_uid: {
        type: String,
        default: ''
    },
    type: {
        type: Number,
        default: 0
    },
    token: String,
    code: String,
    created: { 
        type: Date,
        default: Date.now
    }
})

module.exports = model('users', userSchema)