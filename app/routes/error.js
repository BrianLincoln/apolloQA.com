module.exports = function(app) {
    app.get('/error', function(req, res) {
        res.render('error.ejs', {
            isLoggedInUser: req.isAuthenticated(),
        });
    });
}
