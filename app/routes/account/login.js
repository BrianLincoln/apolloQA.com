module.exports = function(app, passport) {
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            message: req.flash('loginMessage')
        });
    });
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/flows', // redirect to the secure flows section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
}
