
var moment = require('moment');
var config = require('./../config/config.js');
var Flow = require('./models/flow');
var Step = require('./models/step');
var Test = require('./models/test');
var User = require('./models/user');
var stripe = require("stripe")(
    config.stripeSecretKey
);
var subscriptionManager = require('./subscription.js');


// app/routes.js
module.exports = function(app, passport) {




};
