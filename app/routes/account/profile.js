module.exports = function(app, config, subscriptionManager, UserSchema) {
    app.get('/profile', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var stripeCustomerId = req.user.stripeCustomerId;
        var copy = {}
        var properties = {
            isLoggedInUser: req.isAuthenticated(),
            copy: {},
            email: req.user.local.email,
            isTrialUser: true,
            trialDaysRemaining: trialDaysRemaining,
            showSubscribeButton: true,
            showSubscriptionSection: false,
            cancelAtPeriodEnd: false,
            maskedLast4: undefined
        }

        if (!stripeCustomerId) {
            //no stripeCustomerId, assume trial user
            var trialDaysRemaining = req.user.trialDaysRemaining(req.user.trialExpirationDate, new Date());

            if (trialDaysRemaining > 0) {
                //active trial
                properties.copy.title = trialDaysRemaining + " days remaining in your trial";
            } else {
                //expired trial
                properties.copy.title = "Trial Expired";
                properties.copy.subTitle = "Get full access for just $25 /month.";
            }

            res.render('profile.ejs', properties);
        } else {
            //stripeCustomerId found, get customer and check subscription
            subscriptionManager.getStripeCustomer(stripeCustomerId)
            .then(function(customer) {
                var subscription = subscriptionManager.getStripeCustomerSubscription(customer);

                if (subscription) {
                    var periodEndDate = new Date(subscription.current_period_end * 1000).toDateString();

                    if (subscription.cancel_at_period_end) {
                        //cancelled but valid until pay period expires
                        properties.copy.title = "Cancelled Subscription";
                        properties.copy.subTitle = "You have access to your account until: " + periodEndDate;
                        properties.showSubscribeButton = false;
                        properties.cancelAtPeriodEnd = true;
                    } else {
                        //normal, active account
                        properties.copy.title = "Active Subscription";
                        properties.showSubscribeButton = false;
                        properties.showSubscriptionSection = true;
                        properties.nextPaymentDate = periodEndDate;
                        properties.maskedLast4 = subscriptionManager.getStripeCustomerMaskedPaymentMethod(customer);
                    }
                } else {
                    copy.title = "Expired Subscription";
                }

                res.render('profile.ejs', properties);
            });
        }
    });
}
