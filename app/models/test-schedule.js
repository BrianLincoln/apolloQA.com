var mongoose = require('mongoose');

// define the schema for our user model
var testScheduleSchema = mongoose.Schema({
    flowId: String,
    frequency: String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('TestSchedule', testScheduleSchema);
