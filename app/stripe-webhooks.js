var config = require('./../config/config.js');
var stripe = require("stripe")(
    config.stripeSecretKey
);

app.post("/stripe/webhook/url", function(request, response) {
  // Retrieve the request's body and parse it as JSON
  var event_json = JSON.parse(request.body);

  // Do something with event_json

  response.send(200);
});
