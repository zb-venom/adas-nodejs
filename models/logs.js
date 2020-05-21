const {Schema, model} = require('mongoose');

const logsSchema = new Schema({    
    user_id: String,
    device_id: String,
    received: {
        type: Date,
        default: new Date()
    },
    returned: Date

});

module.exports = model('logs', logsSchema);