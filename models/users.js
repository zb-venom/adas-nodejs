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
    type: {
        type: Number,
        default: 0
    },
    code: String,
    created: { 
        type: Date,
        default: Date.now
    }
})

module.exports = model('users', userSchema)