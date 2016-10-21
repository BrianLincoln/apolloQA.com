module.exports = function(app) {
    app.get('/pricing', function(req, res) {
        res.render('pricing.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            message: req.flash('signupMessage')
        });
    });
}
