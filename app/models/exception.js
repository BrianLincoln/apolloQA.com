var mongoose = require('mongoose');;

// define the schema for our user model
var errorSchema = mongoose.Schema({
    description: String,
    stack: String,
    date: Date
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Error', errorSchema);
