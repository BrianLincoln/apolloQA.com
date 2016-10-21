module.exports = function(app, config, subscriptionManager, User) {
    //subscribe page
    app.get('/subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var failMessage;

        switch (req.query.fail) {
            case 'card-error':
                failMessage = "We weren't able to update your card, try a different card or contact us.";
                break;
            case 'server-error':
                failMessage = "Something went wrong on our side. Your card was not updated, try again in a bit.";
                break;
            case 'duplicate-subscription':
                failMessage = "It looks like you are already subscribed... This seems weird, contact us if you are having an issue";
                break;
        }

        res.render('subscription.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            email : req.user.local.email,
            stripePublicKey: config.stripePublicKey,
            failMessage: failMessage ? failMessage : undefined
        });
    });

    // process the payment form
    app.post('/subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var token = req.body.stripeToken;

        subscriptionManager.subscribeUser(req.user._id, req.user.stripeCustomerId, token, req.body.email)
        .then(function(result) {
            switch(result.status) {
                case 'success':
                    subscriptionManager.updateUserWithStripeCustomerId(req.user._id, result.customerId)
                    .then(function() {
                        res.redirect("/profile");
                    });
                    break;
                case 'fail':
                default:
                    res.redirect("/subscription?fail=" + result.reasonCode);
                    break;
            }
        });
    });
}
