var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Step = require('./step').schema;
var TestSchedule = require('./test-schedule').schema;

// define the schema for our user model
var flowSchema = mongoose.Schema({
    name: String,
    steps: [Step],
    userId: String,
    testSchedule: [TestSchedule]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Flow', flowSchema);
