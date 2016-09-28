var http = require('http');
var config = require('./../config/config.js');
var Flow = require('./models/flow');
var Step = require('./models/step');
var Test = require('./models/test');

// app/routes.js
module.exports = function(app, passport) {
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
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists

        //TEMP BETA res.render('signup.ejs', {
        res.render('beta-user-signup.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            message: req.flash('signupMessage')
        });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            isLoggedInUser: req.isAuthenticated(),
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // FLOW LIST =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/flows', isLoggedIn, function(req, res) {
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
    app.get('/flow/:flowId', isLoggedIn, function(req, res) {
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
    app.post('/flow', function (req, res, next) {
        var flow = new Flow({
            name: req.body.name,
            steps: req.body.steps,
            userId: req.user._id
        });
        flow.save(function (error, flow) {
            if (error) {
                return next(error)
            }
            console.log(flow);

            res.redirect("/flow/" + flow._id);
        });
    });

//TODO --------------- this probably doesn't make sense as a get. refactor at some point
    app.get('/flow/:flowId/delete', function (req, res, next) {
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
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // process the signup form
    app.post('/signup', checkBetaValue, passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/flows', // redirect to the secure flows section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));




    // =====================================
    // API ==============================
    // =====================================
    //get flow
    app.get('/api/flows/:flowId', function(req, res) {
        //todo: check user
        Flow.findOne({_id: req.params.flowId}).exec(function(error, flow) {
            if (error) {
                res.send(error);
            }
            res.send(flow);
        });
    });

//TODO ---- this is really adding a step, should not be a POST on the /flows/ level -- should be totally redone
    app.post('/api/flows/:flowId', function (req, res, next) {
        //todo check user and flow
        var query = {_id: req.params.flowId};
        var update = {steps: {stepType: "pageLoad", url: "http://example.com"}};
        Flow.update(
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
    app.put('/api/flows/:flowId', function (req, res, next) {

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

    app.delete('/api/flows/:flowId', function (req, res) {
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
    app.put('/api/flows/:flowId/steps/:stepId', function (req, res) {
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
    app.put('/api/flows/:flowId/reorder/:stepId', function (req, res) {
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
    app.delete('/api/flows/:flowId/steps/:stepId', function (req, res) {
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
