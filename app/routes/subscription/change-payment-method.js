module.exports = function(app, stripe, subscriptionManager, User) {
    app.get('/change-payment', function(req, res) {
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
                failMessage = "Something went wrong on our side. Your card was not changed, try again in a bit.";
                break;
        }

        User.findById(req.user._id, function (err, user) {
            if (user) {
                stripe.customers.retrieve(
                    user.stripeCustomerId,
                    function(err, customer) {
                        if (!err && customer) {
                            res.render('change-payment.ejs', {
                                isLoggedInUser: req.isAuthenticated(),
                                user : req.user, // get the user out of session and pass to template
                                stripePublicKey: config.stripePublicKey,
                                stripeCustomer: customer,
                                failMessage: failMessage ? failMessage : undefined
                            });
                        } else {
                            res.redirect("/profile");
                        }
                    }
                );
            } else {
                res.redirect("/profile");
            }
        });
    });
    app.post('/change-payment', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
        var token = req.body.stripeToken;
        subscriptionManager.changePaymentMethod(req.user.stripeCustomerId, token)
        .then(function(result) {
            switch(result.status) {
                case 'success':
                    res.redirect("/profile");
                    break;
                case 'fail':
                default:
                    res.redirect("/change-payment?fail=" + result.reaonCode);
                    break;

            }
        });
    });
}
