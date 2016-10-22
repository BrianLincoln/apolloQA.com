module.exports = function(app, passport, config) {
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists

        if (config.beta === true) {
            //TEMP BETA
            res.render('beta-user-signup.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                message: req.flash('signupMessage')
            });
        } else {
            res.render('signup.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                message: req.flash('signupMessage')
            });
        }

    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/flows', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // process the signup form
    app.post('/signup-beta', checkBetaValue, passport.authenticate('local-signup', {
        successRedirect : '/flows', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    function checkBetaValue(req, res, next) {
        if (req.body.betaKey === config.betaSecret) {
            return next();
        }

        //wrong beta key, no no no no
        res.redirect('https://gfycat.com/AmpleActualEasteuropeanshepherd');
    }    
}
