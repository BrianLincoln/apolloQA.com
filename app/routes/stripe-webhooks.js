module.exports = function(app) {
    app.post("/stripe-test-webhooks", function(req, res) {
        console.log("______________~~~~~~~~~~~~~~EVENT");
        console.log(req.body);
        // Retrieve the request's body and parse it as JSON
        var event_json = JSON.parse(req.body);


        console.log(event_json);
        // Do something with event_json

        res.send(200);
    });

    app.post("/stripe-webhooks", function(req, res) {
        console.log("______________~~~~~~~~~~~~~~EVENT");
        console.log(req.body);
        // Retrieve the request's body and parse it as JSON
        var event_json = JSON.parse(req.body);


        console.log(event_json);
        // Do something with event_json

        res.send(200);
    });
}
