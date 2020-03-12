const {Schema, model} = require('mongoose')

const auditorySchema = new Schema({
    taken: {
        type: String,
        default: '0'
    },
    device_id:  String,
    code: String,
    auditory: String,
    created: { 
        type: Date,
        default: Date.now
    }
})

module.exports = model('auditory', auditorySchema)