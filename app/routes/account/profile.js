module.exports = function(moment, app, config, subscriptionValidator, subscriptionManager, UserSchema) {
    app.get('/profile', function(req, res) {
        if (!req.isAuthenticated()) {
            return res.redirect('/');
        }

        var today = new Date();
        var stripeCustomerId = req.user.stripeCustomerId;
        var properties = {
            isLoggedInUser: req.isAuthenticated(),
            copy: {
                title: "",
                subTitle: ""
            },
            email: req.user.local.email,
            isTrialUser: false,
            trialDaysRemaining: 0,
            showSubscribeButton: true,
            showSubscriptionSection: false,
            cancelAtPeriodEnd: false,
            maskedLast4: undefined
        };

        //subscription exists or existed at some point
        if (req.user.subscriptionExpirationDate) {
            var subscriptionDaysRemaining = daysRemaininginPeriod(req.user.subscriptionExpirationDate, today);

            if (subscriptionDaysRemaining > 0) {
                subscriptionManager.getStripeCustomer(stripeCustomerId)
                .then(function(customer) {
                    var subscription = subscriptionManager.getStripeCustomerSubscription(customer);

                    if (subscription) {
                        if (subscription.cancel_at_period_end) {
                            properties = getPropertiesForCancelledButStillActiveUser(properties);
                            return res.render('profile.ejs', properties);
                        } else {
                            var payPeriodEndDate = new Date(subscription.current_period_end * 1000).toDateString();

                            properties = getPropertiesForSubscribedUser(properties, payPeriodEndDate, customer);
                            return res.render('profile.ejs', properties);
                        }
                    } else {
                        properties.copy.title = "Expired Subscription";
                        return res.render('profile.ejs', properties);
                    }

                    properties = getPropertiesForSubscribedUser(properties, subscription);
                    return res.render('profile.ejs', properties);
                });
            } else {
                properties = getPropertiesForExpiredSubscriptionUser(properties);
                return res.render('profile.ejs', properties);
            }

        } else {
            if (req.user.pendingPaymentGracePeriodExpirationDate) {
                var gracePeriodDaysRemaining = daysRemaininginPeriod(req.user.pendingPaymentGracePeriodExpirationDate, today);

                if (gracePeriodDaysRemaining > 0) {
                    properties = getPropertiesForGracePeriodUser(properties);

                    return res.render('profile.ejs', properties);
                } else {
                    //failed payment -- what should I do with this?
                }
            }

            if (req.user.trialExpirationDate) {
                properties = getPropertiesForTrialUser(properties, req.user);
                return res.render('profile.ejs', properties);
            }
        }
    });

    function getPropertiesForSubscribedUser(properties, payPeriodEndDate, customer) {
        //normal, active account
        var newproperties = properties;

        newproperties.copy.title = "Active Subscription";
        newproperties.showSubscribeButton = false;
        newproperties.showSubscriptionSection = true;
        newproperties.nextPaymentDate = payPeriodEndDate;
        newproperties.maskedLast4 = subscriptionManager.getStripeCustomerMaskedPaymentMethod(customer);

        return newproperties;
    }

    function getPropertiesForGracePeriodUser(properties) {
        //normal, active account
        var newproperties = properties;

        newproperties.copy.title = "Active Subscription";
        newproperties.copy.subTitle = "Processing your payment";
        newproperties.showSubscribeButton = false;
        newproperties.showSubscriptionSection = false;

        return newproperties;
    }

    function getPropertiesForCancelledButStillActiveUser(properties) {
        //cancelled but valid until pay period expires
        var newproperties = properties;

        newproperties.copy.title = "Cancelled Subscription";
        newproperties.copy.subTitle = "You have access to your account until: " + periodEndDate;
        newproperties.showSubscribeButton = false;
        newproperties.cancelAtPeriodEnd = true;

        return newproperties;
    }

    function getPropertiesForExpiredSubscriptionUser(properties) {
        var newproperties = properties;

        newproperties.copy.title = "Expired Subscription";
        newproperties.showSubscribeButton = true;

        return newproperties;
    }

    function getPropertiesForTrialUser(properties, user) {
        var newproperties = properties;
        var trialDaysRemaining = user.trialDaysRemaining(user.trialExpirationDate, new Date());

        if (trialDaysRemaining > 0) {
            //active trial
            newproperties.copy.title = trialDaysRemaining + " days remaining in your trial";
        } else {
            //expired trial
            newproperties.copy.title = "Trial Expired";
            newproperties.copy.subTitle = "Get full access for just $25 /month.";
        }
        return newproperties;
    }

    function getPropertiesForInactiveUser(properties) {
        var newproperties = properties;
        newproperties.copy.title = "Expired Subscription";

        return newproperties;
    }

    function daysRemaininginPeriod(endDate, currentDate) {
        var periodEndDate = moment(endDate);
        var currentDate = moment(currentDate);

        return periodEndDate.diff(currentDate, 'days');
    };
}
