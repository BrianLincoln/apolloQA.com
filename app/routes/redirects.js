var config = require('./../../config/config.js');

module.exports = function(app) {
    //check for https and www -- redirect appropriately
    app.get('*', function(req, res, next) {
		var httpsUri = req.get('x-forwarded-proto') === "https";
		var wwwUri = req.headers.host.slice(0, 4) === 'www.';

        if ((!httpsUri || wwwUri) && config.httpsRedirection === true && req.url !== "/health-check") {
			var host = req.headers.host;
			if (wwwUri) {
				host = host.slice(4);
			}

			if (!httpsUri) {
				res.set('x-forwarded-proto', 'https');
			}

            res.redirect(301, 'https://' + host + req.url);
        } else {
            next();
        }

    });
}
