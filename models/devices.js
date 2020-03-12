const {Schema, model} = require('mongoose')

const deviceSchema = new Schema({
    name: String,
    about: String,
    type: String
})

module.exports = model('device', deviceSchema)