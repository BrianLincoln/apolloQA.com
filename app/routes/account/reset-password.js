module.exports = function(app, config, sendEmail, UserSchema) {
    //intial page
    app.get('/reset-password', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('reset-password.ejs', {
            isLoggedInUser: req.isAuthenticated(),
        });
    });

    //page linked from email
    app.get('/reset-password/:guid', function(req, res) {
        var validResetPasswordRequest = false;
        var currentDateTime = new Date();
        var query = {
            "resetPasswordToken": req.params.guid
        };

        User.findOne(query).exec(function(error, user) {
            if (user && user.resetPasswordExpiration && (currentDateTime <= user.resetPasswordExpiration)) {
                res.render('reset-password-valid.ejs', {
                    isLoggedInUser: false,
                    guid: req.params.guid
                });
            } else {
                res.render('reset-password-expired.ejs', {
                    isLoggedInUser: false
                });
            }
        });
    });

    // process the email address, send email if legit
    app.post('/reset-password', function(req, res) {
        var guid = guidGenerator();
        var link = config.url + '/reset-password/' + guid;
        var expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + config.passwordResetExpirationMintes);
        var query = {
            "local.email": req.body.email
        };
        var update = {
            'resetPasswordToken': guid,
            'resetPasswordExpiration': expiration
        };
        User.update (
            query,
            update,
            function(err, userExists) {
                if (err) {
                    res.send(err);
                } else if(userExists) {
                    sendEmail(req.body.email, config.emailDefaultFromAddress, 'Apollo - Password Reset', 'Rest your password', 'Reset your password here: ' + link);
                }
            }
        );

        res.render('reset-password-sent.ejs', {
            isLoggedInUser: req.isAuthenticated()
        });
    });


    // process actual reset form
    app.post('/reset-password-submit', function(req, res) {
        var query = {
            "resetPasswordToken": req.body.guid
        };

        User.findOne(query, function (err, user) {
            var currentDateTime = new Date();
            if (user && user.resetPasswordExpiration && (currentDateTime <= user.resetPasswordExpiration)) {
                var hashedPassword = user.generateHash(req.body.password);
                user.local.password = hashedPassword;
                user.save(function (err) {
                    if (err) {
                        res.send(err);
                    }
                    res.redirect('/login');
                });
            }
            else {
                res.render('reset-password-expired.ejs', {
                    isLoggedInUser: false
                });
            }
        });
    });
}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
