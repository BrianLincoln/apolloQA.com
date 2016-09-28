var mongoose = require('mongoose');

// define the schema for our user model
var testSchema = mongoose.Schema({
    flowId: String,
    start: Date,
    finished: Date,
    status: String,
    result: String,
    screenshots: Array,
    failure: {
        stepId: String,
        reason: String
    }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Test', testSchema);
