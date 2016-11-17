var moment = require('moment');
var config = require('./../config/config.js');
var subscriptionManager = require('./subscription-manager.js');
var Exception = require('./models/exception');

module.exports = function(req, res, next) {
    if (req.user) {
        var today = new Date();
        var failedPayment = false;

        //Active by valid subscription
        if (req.user.subscriptionExpirationDate) {
            var subscriptionDaysRemaining = daysRemaininginPeriod(req.user.subscriptionExpirationDate, today);

            if (subscriptionDaysRemaining > 0) {
                req.userStatus = "subscriptionActive";
                req.subscriptionDaysRemaining = subscriptionDaysRemaining;
                return next();
            }
        }
        //Active by grace period after first payment
        if (req.user.pendingPaymentGracePeriodExpirationDate) {
            var gracePeriodDaysRemaining = daysRemaininginPeriod(req.user.pendingPaymentGracePeriodExpirationDate, today);

            if (gracePeriodDaysRemaining > 0) {
                req.userStatus = "gracePeriodActive";
                req.trialPeriodDaysRemaining = trialPeriodDaysRemaining;
                return next();
            } else {
                req.user.failedPayment = true;
            }
        }
        //Active by trial period
        if (req.user.trialExpirationDate) {
            var trialPeriodDaysRemaining = daysRemaininginPeriod(req.user.trialExpirationDate, today);

            if (trialPeriodDaysRemaining > 0) {
                req.userStatus = "trialPeriodActive";
                req.trialPeriodDaysRemaining = trialPeriodDaysRemaining;
                req.failedPayment = true;
                return next();
            }
        }
        res.redirect("/profile");
    } else {
        res.redirect("/login");
    }

    function daysRemaininginPeriod(endDate, currentDate) {
        var periodEndDate = moment(endDate);
        var currentDate = moment(currentDate);

        return periodEndDate.diff(currentDate, 'days');
    };
}
