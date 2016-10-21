var http = require('http');
var moment = require('moment');
var config = require('./../config/config.js');
var sendEmail = require('./send-email.js');
var Flow = require('./models/flow');
var Step = require('./models/step');
var Test = require('./models/test');
var User = require('./models/user');
var stripe = require("stripe")(
    config.stripeSecretKey
);
var subscriptionManager = require('./subscription.js');

// app/routes.js
module.exports = function(app, passport) {

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

    //health check for aws
    app.get('/health-check', function(req, res) {
        res.status(200).json({status:"ok"})
    });




    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        var isLoggedInUser = req.isAuthenticated();

        if (isLoggedInUser) {
            res.redirect('/flows');
        }
        else {
            res.render('index.ejs', {
                isLoggedInUser: req.isAuthenticated(),
            });
        }
    });





    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            message: req.flash('loginMessage')
        });
    });
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/flows', // redirect to the secure flows section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));





    // =====================================
    // RESET PASSWORD ===============================
    // =====================================

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

    // reset pw - process entered email
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
                    sendEmail(req.body.email, '\"Apollo QA\" <support@apolloqa.com>', 'Apollo - Password Reset', 'Rest your password', 'Reset your password here: ' + link);
                }
            }
        );

        res.render('reset-password-sent.ejs', {
            isLoggedInUser: req.isAuthenticated()
        });
    });


    // reset pw - process actual reset form
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





    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists

        if (config.beta === true) {
            //TEMP BETA
            res.render('beta-user-signup.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                message: req.flash('signupMessage')
            });
        } else {
            res.render('signup.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                message: req.flash('signupMessage')
            });
        }

    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/flows', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // process the signup form
    app.post('/signup-beta', checkBetaValue, passport.authenticate('local-signup', {
        successRedirect : '/flows', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));



    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });



    // =====================================
    // Pricing Page ========================
    // =====================================
    app.get('/pricing', function(req, res) {
        res.render('pricing.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            message: req.flash('signupMessage')
        });
    });


    // =====================================
    // Help Center =========================
    // =====================================
    app.get('/help/selectors', function(req, res) {
        res.render('help/selectors.ejs', {
            isLoggedInUser: isLoggedInUser,
        });
    });





    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        var accountStatus = req.user.accountStatus;
        var trialPeriodRemaining = null;
        var accountStatusDisplayName = null;
        var subscriptionDisplayName = null;

        switch (accountStatus) {
            case "trial":
                trialPeriodRemaining = calculateTrialPeriodInDays(req.user.trialExpirationDate, new Date());
                accountStatus = trialPeriodRemaining > 0 ? "trial" : "trialExpired";
                subscriptionDisplayName = trialPeriodRemaining > 0 ? "Trial" : "Trial Expired";
                break;
            case "active":
                subscriptionDisplayName = req.user.subscription + " $25/month";
                break;
            case "cancelled":
                subscriptionDisplayName = "Cancelled";
                break;
            default:
                subscriptionDisplayName = req.user.subscription;
                break;
        }

        if (accountStatus === 'active' && req.user.stripeCustomerId) {

            stripe.customers.retrieve( req.user.stripeCustomerId, function(err, customer) {
                if (!err && customer) {
                    var subscriptions = customer.subscriptions.data;

                    res.render('profile.ejs', {
                        isLoggedInUser: req.isAuthenticated(),
                        user : req.user, // get the user out of session and pass to template
                        trialPeriodRemaining: trialPeriodRemaining,
                        accountStatus: accountStatus,
                        subscriptions: customer.subscriptions.data,
                        cardOnFile: "**** **** **** " + customer.sources.data[0].last4
                    });
                } else {
                    res.render('profile.ejs', {
                        isLoggedInUser: req.isAuthenticated(),
                        user : req.user, // get the user out of session and pass to template
                        trialPeriodRemaining: trialPeriodRemaining,
                        accountStatus: accountStatus,
                        subscriptionDisplayName: subscriptionDisplayName,
                    });
                }
            });
        }
    });



    // =====================================
    // SUBSCRIPTION PAGE =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/subscription', isLoggedIn, function(req, res) {
        var failMessage;

        switch (req.query.fail) {
            case 'card-error':
                failMessage = "We weren't able to update your card, try a different card or contact us.";
                break;
            case 'server-error':
                failMessage = "Something went wrong on our side. Your card was not updated, try again in a bit.";
                break;
        }

        User.findById(req.user._id, function (err, user) {
            if (user && user.accountStatus && user.accountStatus === 'active' && user.subscription === 'basic') {
                res.redirect("/profile");
                return;
            } else {
                res.render('subscription.ejs', {
                    isLoggedInUser: req.isAuthenticated(),
                    user : req.user, // get the user out of session and pass to template
                    stripePublicKey: config.stripePublicKey,
                    failMessage: failMessage ? failMessage : undefined
                });
            }
        });
    });
    // process the payment form
    app.post('/subscription', isLoggedIn, function(req, res) {
        var token = req.body.stripeToken;
        var subscription = 'basic'; //eventually will be passed in via form

        subscriptionManager.subscribeNewCustomer(req.user._id, token, subscription, req.body.email)
        .then(function(result) {
            switch(result.status) {
                case 'success':
                    subscriptionManager.updateUser(req.user._id, result.customerId, subscription, 'active')
                    .then(function() {
                        res.redirect("/profile");
                    });
                    break;
                case 'fail':
                default:
                    res.redirect("/subscription?fail=" + result.reaonCode);
                    break;

            }
        });
    });


    // =====================================
    // UNSUBSCRIBE PAGE =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/cancel-subscription', isLoggedIn, function(req, res) {
        res.render('cancel-subscription.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            user : req.user // get the user out of session and pass to template
        });
    });
    app.post('/cancel-subscription', isLoggedIn, function(req, res) {
        var submitButton = req.body.submitButton;

        if (submitButton === "cancel") {
            subscriptionManager.cancelSubscriptions(req.user._id, req.user.stripeCustomerId);
            subscriptionManager.updateUser(req.user._id, req.user.stripeCustomerId, undefined, 'cancelled');
            res.redirect("/profile");
        } else {
            res.redirect("/profile");
        }
    });








        // =====================================
        // CHANGE PAYMENT PAGE =====================
        // =====================================
        // we will want this protected so you have to be logged in to visit
        // we will use route middleware to verify this (the isLoggedIn function)
        app.get('/change-payment', isLoggedIn, function(req, res) {
            var failMessage;

            switch (req.query.fail) {
                case 'card-error':
                    failMessage = "We weren't able to charge your card, try a different card or contact us.";
                    break;
                case 'server-error':
                    failMessage = "Something went wrong on our side. Your card was not charged, try again in a bit.";
                    break;
            }

            User.findById(req.user._id, function (err, user) {
                if (user && user.accountStatus && user.accountStatus === 'active' && user.subscription === 'basic') {

                    stripe.customers.retrieve(
                        user.stripeCustomerId,
                        function(err, customer) {
                            if (!err && customer) {
                                res.render('change-payment.ejs', {
                                    isLoggedInUser: req.isAuthenticated(),
                                    user : req.user, // get the user out of session and pass to template
                                    stripePublicKey: config.stripePublicKey,
                                    stripeCustomer: customer,
                                    failMessage: failMessage ? failMessage : undefined
                                });
                            } else {
                                res.redirect("/profile");
                            }
                        }
                    );
                } else {
                    res.redirect("/profile");
                }
            });
        });
        app.post('/change-payment', isLoggedIn, function(req, res) {
            var token = req.body.stripeToken;
            subscriptionManager.changePaymentMethod(req.user.stripeCustomerId, token)
            .then(function(result) {
                switch(result.status) {
                    case 'success':
                        res.redirect("/profile");
                        break;
                    case 'fail':
                    default:
                        res.redirect("/change-payment?fail=" + result.reaonCode);
                        break;

                }
            });
        });




    // =====================================
    // FLOW LIST =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/flows', isLoggedIn, checkSubscriptionStatus, function(req, res) {
        Flow.find({userId: req.user._id}).exec(function(error, flows) {
            if (error) {
                return next(error)
            }
            res.render('flows.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                user : req.user, // get the user out of session and pass to template
                flows: flows
            });
        });
    });

    //flow page
    app.get('/flow/:flowId', isLoggedIn, checkSubscriptionStatus, function(req, res) {
        Flow.findOne({_id: req.params.flowId}).exec(function(error, flow) {
            if (error) {
                return next(error)
            }
            res.render('flow.ejs', {
                isLoggedInUser: req.isAuthenticated(),
                user : req.user, // get the user out of session and pass to template
                flow: flow
            });
        });
    });

    // write new flow
    app.post('/flow', checkSubscriptionStatus, function (req, res, next) {
        var flow = new Flow({
            name: req.body.name,
            steps: req.body.steps,
            userId: req.user._id
        });
        flow.save(function (error, flow) {
            if (error) {
                return next(error)
            }
            res.redirect("/flow/" + flow._id);
        });
    });

//TODO --------------- this probably doesn't make sense as a get. refactor at some point
    app.get('/flow/:flowId/delete', checkSubscriptionStatus, function (req, res, next) {
        var query = {_id: req.params.flowId};
        Flow.remove(query,
            function(err) {
                if (err) {
                    res.send(err);
                }
                res.redirect("/flows");
            }
        );
    });








    // =====================================
    // API ==============================
    // =====================================
    //get flow
    app.get('/api/flows/:flowId', checkSubscriptionStatus, function(req, res) {
        //todo: check user
        Flow.findOne({_id: req.params.flowId}).exec(function(error, flow) {
            if (error) {
                res.send(error);
            }
            res.send(flow);
        });
    });

//TODO ---- this is really adding a step, should not be a POST on the /flows/ level -- should be totally rethought out
    app.post('/api/flows/:flowId', checkSubscriptionStatus, function (req, res, next) {
        //todo check user and flow
        var query = {_id: req.params.flowId};
        var update = {steps: {stepType: "pageLoad", url: "http://example.com"}};
        Flow.update (
            query,
            {$push: update},
            function(err) {
                if (err) {
                    res.send(err);
                }
                res.send("updated");
            }
        );
    });

    //update a flow
    app.put('/api/flows/:flowId', checkSubscriptionStatus, function (req, res, next) {

        Flow.findById(req.params.flowId, function (err, flow) {

            var name = flow.name;
            flow.name = req.body.name;
            flow.save(function (err) {
                if (err) {
                    res.send(err);
                }
                res.send("updated");
            });
        });
    });

    app.delete('/api/flows/:flowId', checkSubscriptionStatus, function (req, res) {
        var query = {_id: req.params.flowId};
        Flow.remove(query,
            function(err) {
                if (err) {
                    res.send(err);
                }
                res.send("deleted");
            });
    });





    //-------------steps api-----

    //update step
    app.put('/api/flows/:flowId/steps/:stepId', checkSubscriptionStatus, function (req, res) {
        Flow.findById(req.params.flowId, function (err, flow) {
            var step = flow.steps.id(req.params.stepId);
            step.stepType = req.body.stepType;

            switch (step.stepType) {
                case 'pageLoad':
                    step.inputValue = undefined;
                    step.selector = undefined;
                    step.url = req.body.url || '';
                    break;
                case 'confirmElementExists':
                case 'click':
                case 'hover':
                    step.inputValue = undefined;
                    step.selector = req.body.selector || '';
                    step.url = undefined;
                    break;
                case 'input':
                    step.inputValue = req.body.inputValue || '';
                    step.selector = req.body.selector || '';
                    step.url = undefined;
                    break;
            }

            flow.save(function (err) {
                if (err) {
                    res.send(err);
                }
                res.send("updated");
            });
        });
    });

    //reorder steps
    app.put('/api/flows/:flowId/reorder/:stepId', checkSubscriptionStatus, function (req, res) {
        Flow.findById(req.params.flowId, function (err, flow) {
            var step = flow.steps.id(req.params.stepId);
            var originalIndex = flow.steps.indexOf(step);
            var newIndex = originalIndex;

            if (req.body.direction === "down" && originalIndex < flow.steps.length) {
                newIndex++;
            }
            else if (req.body.direction === "up" && originalIndex > 0) {
                newIndex--;
            }
            else {
                res.send("not updated");
            }

            var stepsClone = moveStep(flow.steps, originalIndex, newIndex);
            flow.steps = stepsClone;

            flow.save(function (err) {
                if (err) {
                    res.send(err);
                }
                res.send("updated");
            });
        });
    });

    //delete step
    app.delete('/api/flows/:flowId/steps/:stepId', checkSubscriptionStatus, function (req, res) {
        var query = {_id: req.params.flowId};
        var update = {steps: {_id: req.params.stepId}};

        Flow.update(
            query,
            {$pull: update},
            function(err) {
                if (err) {
                    res.send(err);
                }
                res.send("deleted");
            }
        );
    });





    //-------------Test runner API

    //start test
    app.post('/api/test-runner', checkSubscriptionStatus, function (req, res, next) {
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
    app.get('/api/tests/:flowId', checkSubscriptionStatus, function(req, res) {
        Test.findOne({flowId: req.params.flowId}, {}, {sort: {'start': 1}}).exec(function(error, test) {
            if (error) {
                res.send(error);
            }

            res.send(test);
        });
    });

};


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function checkBetaValue(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.body.betaKey === config.betaSecret) {
        return next();
    }

    // if they aren't redirect them
    res.redirect('https://gfycat.com/AmpleActualEasteuropeanshepherd');
}

function checkSubscriptionStatus(req, res, next) {

    //switch: trial, basic, etc.
    if (!config.beta && req.user && req.user.accountStatus) {
        switch(req.user.accountStatus) {
            case 'trial':
                trialPeriodRemaining = calculateTrialPeriodInDays(req.user.trialExpirationDate, new Date());
                if (trialPeriodRemaining > 0) {
                    return next();
                }
                break;
            case 'active':
                return next();
        }
        res.redirect('/profile');
    }

    //valid subscription
    return next();

}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function moveStep(arr, srcIndex, destIndex) {
    while (srcIndex < 0) {
        srcIndex += arr.length;
    }
    while (destIndex < 0) {
        destIndex += arr.length;
    }
    if (destIndex >= arr.length) {
        var k = destIndex - arr.length;
        while ((k--) + 1) {
            arr.push(undefined);
        }
    }
     arr.splice(destIndex, 0, arr.splice(srcIndex, 1)[0]);
   return arr;
}

function calculateTrialPeriodInDays(endDate, currentDate) {
    var trialEndDate = moment(endDate);
    var currentDate = moment(currentDate);

    return trialEndDate.diff(currentDate, 'days');
}
