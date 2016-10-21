module.exports = function(app, subscriptionManager) {
    app.get('/cancel-subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
        res.render('cancel-subscription.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            user : req.user // get the user out of session and pass to template
        });
    });
    app.post('/cancel-subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
        var submitButton = req.body.submitButton;

        if (submitButton === "cancel") {
            subscriptionManager.cancelSubscriptions(req.user._id, req.user.stripeCustomerId);
            subscriptionManager.updateUser(req.user._id, req.user.stripeCustomerId, undefined, 'cancelled');
            res.redirect("/profile");
        } else {
            res.redirect("/profile");
        }
    });
}
