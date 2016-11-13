var moment = require('moment');
var config = require('./../config/config.js');
var subscriptionManager = require('./subscription-manager.js');
var Exception = require('./models/exception');

module.exports = function(req, res, next) {
    if (req.user) {
        var today = new Date();

        if (req.user.subscriptionExpirationDate) {
            var subscriptionDaysRemaining = daysRemaininginPeriod(req.user.subscriptionExpirationDate, today);

            if (subscriptionDaysRemaining > 0) {
                console.log("active sub");
                return next();
            }
        }
        if (req.user.pendingPaymentGracePeriodExpirationDate) {
            var gracePeriodDaysRemaining = daysRemaininginPeriod(req.user.pendingPaymentGracePeriodExpirationDate, today);

            if (gracePeriodDaysRemaining > 0) {
                console.log("grace period");
                return next();
            }
        }
        if (req.user.trialExpirationDate) {
            var trialPeriodDaysRemaining = daysRemaininginPeriod(req.user.trialExpirationDate, today);

            if (trialPeriodDaysRemaining > 0) {
                console.log("trial period");
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
