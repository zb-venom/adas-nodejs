const {Schema, model} = require('mongoose');

const sidSchema = new Schema({    
    user_id: String,
    sid: String,
    online: {
        type: Boolean,
        default: true
    },
    create: {
        type: Date,
        default: new Date()
    },
    close: Date,
});

module.exports = model('sid', sidSchema);