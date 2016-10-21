module.exports = function(app) {
    app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/flows');
        }
        else {
            res.render('index.ejs', {
                isLoggedInUser: req.isAuthenticated(),
            });
        }
    });
}
