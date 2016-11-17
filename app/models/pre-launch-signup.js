var mongoose = require('mongoose');

// define the schema for our user model
var preLaunchSignupSchema = mongoose.Schema({
    email: String,
    date: Date
});

// create the model for users and expose it to our app
module.exports = mongoose.model('PreLaunchSignup', preLaunchSignupSchema);
