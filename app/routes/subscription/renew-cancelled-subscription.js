module.exports = function(app, subscriptionManager) {
    app.get('/renew-cancelled-subscription', function(req, res) {
        //not a thing, just kick them
        res.redirect("/profile");
    });

    app.post('/renew-cancelled-subscription', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }

        subscriptionManager.renewCanceledSubscriptions(req.user.stripeCustomerId)
        .then(function() {
            res.redirect("/profile");
        });

    });
}
