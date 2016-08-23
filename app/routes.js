var Flow = require('./models/flow');
var Step = require('./models/step');

// app/routes.js
module.exports = function(app, passport) {
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
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
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // FLOW LIST =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/flows', isLoggedIn, function(req, res) {
        var user = req.user;

        Flow.find({userId: req.user._id}).exec(function(error, flows) {
            if (error) {
                return next(error)
            }
            res.render('flows.ejs', {
                user : req.user, // get the user out of session and pass to template
                flows: flows
            });
        });

    });

    //flow page
    app.get('/flow/:flowId', isLoggedIn, function(req, res) {
        var user = req.user;

        Flow.findOne({_id: req.params.flowId}).exec(function(error, flow) {
            if (error) {
                return next(error)
            }
            res.render('flow.ejs', {
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
            res.render('flow.ejs', {
                flow: flow,
                user: req.user
            })
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
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
                return next(error)
            }
            return res.json({
                flow: flow
            });
        });
    });

    //update a flow
    app.post('/api/flows/:flowId', function (req, res, next) {
        console.log(req.body);
        console.log(req.user);

        //todo check user and flow
        var query = {_id: req.params.flowId};
        var update = {steps: {stepType: "pageLoad", url: "http://localhost:8080"}};
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
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    console.log("isLoggedIn");
    console.log(req.user);
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
