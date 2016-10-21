module.exports = function(app) {
    app.get('/help/selectors', function(req, res) {
        res.render('help/selectors.ejs', {
            isLoggedInUser: isLoggedInUser,
        });
    });
}
