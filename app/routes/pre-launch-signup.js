module.exports = function(app, PreLaunchSignup) {
    //process form
    app.post('/pre-launch-signup', function (req, res, next) {
        var preLaunchSignup = new PreLaunchSignup({
            email: req.body.email,
            date: new Date()
        });
        preLaunchSignup.save(function (error, signup) {
            if (error) {
                return next(error)
            }

            res.redirect('/?earlyAccessSignupComplete=true#pre-launch');
        });
    });
}
