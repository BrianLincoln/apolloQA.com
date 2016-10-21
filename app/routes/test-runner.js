module.exports = function(app, http, Test) {
    //start test
    app.post('/api/test-runner', function (req, res, next) {
        var postData = JSON.stringify(req.body);
        var options = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            host: 'localhost',
            port: 8181,
            path: '/',
            method: 'POST'
        };
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
        });
        req.on('error', function(e) {
            res.send(e);
        });
        req.write(postData);
        req.end();
        res.send("success");
    });

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
