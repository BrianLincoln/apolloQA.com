module.exports = function(app, config, subscriptionManager, UserSchema) {
    app.get('/profile', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var stripeCustomerId = req.user.stripeCustomerId;
        var trialDaysRemaining = req.user.trialDaysRemaining(req.user.trialExpirationDate, new Date());
        var copy = {
            title: "Profile"
        }

        //no stripeCustomerId, assume trial user
        if (!stripeCustomerId) {
            if (trialDaysRemaining > 0) {
                copy.title = trialDaysRemaining + "days remaining in your trial";
            } else {
                copy.title = "Trial Expired";
                copy.subTitle = "Get full access for just $25 /month.";
            }

            res.render('profile/index.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                copy: copy,
                email: req.user.local.email,
                isTrialUser: true,
                trialDaysRemaining: trialDaysRemaining,
                showSubscribeButton: true
            });
        } else {
            var stripeCustomer = stripeCustomerId ? subscriptionManager.getStripeCustomer(stripeCustomerId) : undefined;
            var subscriptions;
            var maskedDefaultCard;

            if (stripeCustomer) {
                subscriptions = subscriptionManager.getStripeCustomerSubscriptions(stripeCustomer);
                maskedDefaultCard = subscriptionManager.getStripeCustomerMaskedPaymentMethod(stripeCustomer);
            }

            console.log(stripeCustomerId);
            console.log(stripeCustomer);
            console.log(subscriptions);
            console.log(maskedDefaultCard);


            res.render('profile/index.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                copy: copy,
                email: req.user.local.email,
                stripeCustomerId: stripeCustomerId,
                subscriptions: subscriptions,
                maskedDefaultCard:  maskedDefaultCard,
                showSubscribeButton: true
            });
        }
    });
}
