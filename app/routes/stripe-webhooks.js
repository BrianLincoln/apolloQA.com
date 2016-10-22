module.exports = function(app, sendEmail, User) {
    app.post("/stripe-test-webhooks", function(req, res) {
		var event = req.body;

		switch(event.type) {
			case "invoice.payment_succeeded":
                if (event && event.data && event.data.object && event.data.customer) {
                    var query = {
                        "stripeCustomerId": event.data.customer
                    };

                    User.findOne(query).exec(function(error, user) {
                        if (user && user.local.email) {
                            var emailBodyContent = "\
                                <p>Your subscription to Apollo has renewed</p>\
                                <a href=\"https://apolloqa.com/profile\">Manage your subscription</a>\
                            ";

                            sendEmail(user.local.email, config.emailDefaultFromAddress, "Payment Confirmation", "Thank you.", emailBodyContent);
                            res.send(200);
                        } else {
                            res.send(500);
                        }
                    });
        		}
				break;
		}

        res.send(500);
    });

    app.post("/stripe-webhooks", function(req, res) {
        var event = req.body;

		switch(event.type) {
			case "invoice.payment_succeeded":
                if (event && event.data && event.data.object && event.data.customer) {
                    var query = {
                        "stripeCustomerId": event.data.customer
                    };

                    User.findOne(query).exec(function(error, user) {
                        if (user && user.local.email) {
                            var emailBodyContent = "\
                                <p>Your subscription to Apollo has renewed</p>\
                                <a href=\"https://apolloqa.com/profile\">Manage your subscription</a>\
                            ";

                            sendEmail(user.local.email, config.emailDefaultFromAddress, "Payment Confirmation", "Thank you.", emailBodyContent);
                            res.send(200);
                        } else {
                            res.send(500);
                        }
                    });
        		}
				break;
		}

        res.send(500);
    });
}
