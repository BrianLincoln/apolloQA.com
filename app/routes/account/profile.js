module.exports = function(app, config, subscriptionManager, UserSchema) {
    app.get('/profile', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var stripeCustomerId = req.user.stripeCustomerId;
        var copy = {}

        //no stripeCustomerId, assume trial user
        if (!stripeCustomerId) {
            var trialDaysRemaining = req.user.trialDaysRemaining(req.user.trialExpirationDate, new Date());

            if (trialDaysRemaining > 0) {
                copy.title = trialDaysRemaining + " days remaining in your trial";
            } else {
                copy.title = "Trial Expired";
                copy.subTitle = "Get full access for just $25 /month.";
            }

            res.render('profile.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                copy: copy,
                email: req.user.local.email,
                isTrialUser: true,
                trialDaysRemaining: trialDaysRemaining,
                showSubscribeButton: true
            });
        } else {
            //stripeCustomerId found, get customer and check subscription
            subscriptionManager.getStripeCustomer(stripeCustomerId)
            .then(function(customer) {
                console.log(customer);
                var subscription = subscriptionManager.getStripeCustomerSubscription(customer);
                var showSubscribeButton = true;
                var showSubscriptionSection = false;
                var cancelAtPeriodEnd = false;

                if (subscription) {
                    console.log(subscription);

                    var periodEndDate = new Date(subscription.current_period_end * 1000).toDateString();
                    //cancelled but waiting for period to expire
                    if (subscription.cancel_at_period_end) {
                        copy.title = "Cancelled Subscription";
                        copy.subTitle = "You have access to your account until: " + periodEndDate;

                        showSubscribeButton = false;
                        cancelAtPeriodEnd = true;
                    } else {
                        //normal, active account
                        copy.title = "Active Subscription";
                        showSubscribeButton = false;
                        showSubscriptionSection = true;
                        nextPaymentDate = periodEndDate;
                        maskedLast4 = subscriptionManager.getStripeCustomerMaskedPaymentMethod(customer);
                    }
                } else {
                    copy.title = "Expired Subscription";
                }

                res.render('profile.ejs', {
                    isLoggedInUser: req.isAuthenticated(),
                    copy: copy,
                    email: req.user.local.email,
                    stripeCustomerId: stripeCustomerId,
                    showSubscribeButton: showSubscribeButton,
                    showSubscriptionSection: showSubscriptionSection,
                    cancelAtPeriodEnd: cancelAtPeriodEnd
                });
            });
        }
    });
}
