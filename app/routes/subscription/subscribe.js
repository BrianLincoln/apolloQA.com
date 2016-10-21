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
        }

        User.findById(req.user._id, function (err, user) {
            if (user && user.accountStatus && user.accountStatus === 'active' && user.subscription === 'basic') {
                res.redirect("/profile");
                return;
            } else {
                res.render('subscription.ejs', {
                    isLoggedInUser: req.isAuthenticated(),
                    user : req.user, // get the user out of session and pass to template
                    stripePublicKey: config.stripePublicKey,
                    failMessage: failMessage ? failMessage : undefined
                });
            }
        });
    });
    // process the payment form
    app.post('/subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        var token = req.body.stripeToken;
        var subscription = 'basic'; //eventually will be passed in via form

        subscriptionManager.subscribeNewCustomer(req.user._id, token, subscription, req.body.email)
        .then(function(result) {
            switch(result.status) {
                case 'success':
                    subscriptionManager.updateUser(req.user._id, result.customerId, subscription, 'active')
                    .then(function() {
                        res.redirect("/profile");
                    });
                    break;
                case 'fail':
                default:
                    res.redirect("/subscription?fail=" + result.reaonCode);
                    break;

            }
        });
    });
}
