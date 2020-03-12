const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    login: String,
    password:  String,
    email: String,
    phone: String,
    about: String,
    type: Number,
    code: String,
    created: { 
        type: Date,
        default: Date.now
    }
})

module.exports = model('users', userSchema)