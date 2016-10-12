var AWS = require('aws-sdk');
var config = require('./../config/config.js');
var ses = new AWS.SES({
    accessKeyId: config.AWSAccessKeyId,
    secretAccessKey: config.AWSAsecretAccessKey,
    region: config.AWSAregion
});

// app/routes.js
module.exports = function(to, from, subject, body) {

    var toFormatted = [];
    if (to.isArray) {
        toFormatted = to;
    } else {
        toFormatted.push(to);
    }

    ses.sendEmail( {
        Source: from,
        Destination: { ToAddresses: toFormatted },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Text: {
                    Data: body,
                }
            }
        }
    }, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log('Email sent:');
            console.log(data);
        }
    });
}
