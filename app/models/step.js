var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var stepSchema = mongoose.Schema({
    stepType: String,
    url: String,
    inputType: String,
    inputValue: String,
    selector: String,
    stepNumber: Number
});

// methods ======================
// generating a hash
stepSchema.methods.generateHash = function(inputValue) {
    return bcrypt.hashSync(inputValue, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
stepSchema.methods.validPassword = function(inputValue) {
    return bcrypt.compareSync(inputValue, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Step', stepSchema);
