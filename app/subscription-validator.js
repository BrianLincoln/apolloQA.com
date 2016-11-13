var config = require('./../config/config.js');
var subscriptionManager = require('./subscription-manager.js');

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
                }
            } else {
                res.redirect("/profile");
            }
        });
    } else {
        res.redirect("/profile");
    }
}
