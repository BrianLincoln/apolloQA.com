module.exports = function(app, Test) {
    //get test status
    app.get('/api/tests/:flowId', function(req, res) {
        Test.findOne({flowId: req.params.flowId}, {}, {sort: {'start': 1}}).exec(function(error, test) {
            if (error) {
                res.send(error);
            }

            res.send(test);
        });
    });
}
