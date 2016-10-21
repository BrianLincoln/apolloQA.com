var mongoose = require('mongoose');
var moment = require('moment');
var bcrypt   = require('bcrypt-nodejs');
var config = require('./../../config/config.js');
var stripe = require("stripe")(
    config.stripeSecretKey
);

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    resetPasswordToken: String,
    resetPasswordExpiration: Date,
    trialExpirationDate: Date,
    stripeCustomerId: String
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.activeTrial = function() {
    return false;
};

userSchema.methods.trialDaysRemaining = function(endDate, currentDate) {
    var trialEndDate = moment(endDate);
    var currentDate = moment(currentDate);

    return trialEndDate.diff(currentDate, 'days');
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
