var AWS = require('aws-sdk');
var emailTemplate = require('./email-template.js');
var config = require('./../config/config.js');
var ses = new AWS.SES({
    accessKeyId: config.AWSAccessKeyId,
    secretAccessKey: config.AWSAsecretAccessKey,
    region: config.AWSAregion
});

// app/routes.js
module.exports = function(to, from, subject, bodyTitle, bodyMainContent) {

    var toFormatted = [];

    if (config.emailTestMode === true) {
            toFormatted.push(config.emailTestAddress);
    } else {
        if (to.isArray) {
            toFormatted = to;
        } else {
            toFormatted.push(to);
        }
    }

    var body = emailTemplate;
    body = body.replace("^TITLE^", bodyTitle);
    body = body.replace("^MAIN_CONTENT^", bodyMainContent);

    ses.sendEmail( {
        Source: from,
        Destination: { ToAddresses: toFormatted },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Html: {
                    Data: body
                }
            }
        }
    }, function(err, data) {
        if(err) {
            console.log(err);
        }
    });

    var templay = "";
}
