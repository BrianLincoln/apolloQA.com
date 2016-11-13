var config = require('./../config/config.js');
var subscriptionManager = require('./subscription-manager.js');
var Exception = require('./models/exception');

// app/routes.js
module.exports = function(req, res, next) {
    if (req.user && req.user.trialDaysRemaining(req.user.trialExpirationDate, new Date()) > 0) {
        return next();
    } else if (req.user && req.user.stripeCustomerId) {
        //this should really not happen on every request.
        //eventually set up some way to check on a timer or something
        subscriptionManager.getStripeCustomer(req.user.stripeCustomerId)
        .then(function(customer){
            if (customer) {
                var subscription = subscriptionManager.getStripeCustomerSubscription(customer);

                if (subscription) {
                    return next();
                } else {
                    var exception = new Exception({
                        description: "Stripe customerID not found: " + req.user.stripeCustomerId,
                        date: new Date()
                    });
                    exception.save(function (error, exception) {
                        res.redirect("/error");
                    });
                }
            } else {
                res.redirect("/profile");
            }
        });
    } else {
        res.redirect("/profile");
    }
}
