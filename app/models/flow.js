var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Steps = require('./step');

// define the schema for our user model
var flowSchema = mongoose.Schema({
    name: String,
    steps: [Steps],
    userId: String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Flow', flowSchema);
