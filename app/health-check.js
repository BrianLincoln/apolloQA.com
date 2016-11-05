module.exports = function(app) {
    //health check for aws
    app.get('/health-check', function(req, res) {
        res.status(200).json({status:"ok"})
    });
}
