var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var http = require('http');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var config = require('./config/config.js');
var sendEmail = require('./app/send-email.js');
var subscriptionManager = require('./app/subscription-manager.js');
var subscriptionValidator = require('./app/subscription-validator.js');

var UserSchema = require('./app/models/user');
var FlowSchema = require('./app/models/flow');
var StepSchema = require('./app/models/step');
var TestSchema = require('./app/models/test');

// configuration ===============================================================
mongoose.connect(config.dbUrl); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: config.sessionSecret })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static('./flow-builder/dist'));
app.use(express.static('./resources'));

// routes ======================================================================

require('./app/routes/homepage.js')(app);
require('./app/routes/pricing.js')(app);
require('./app/routes/redirects.js')(app);
require('./app/routes/health-check.js')(app);
require('./app/routes/stripe-webhooks.js')(app);
require('./app/routes/help/selectors.js')(app);

//account management
require('./app/routes/account/login.js')(app, passport);
require('./app/routes/account/logout.js')(app, passport);
require('./app/routes/account/signup.js')(app, passport, config);
require('./app/routes/account/reset-password.js')(app, config, sendEmail, UserSchema);
require('./app/routes/account/profile.js')(app, config, subscriptionManager, UserSchema);

//subscription management
require('./app/routes/subscription/subscribe.js')(app, config, subscriptionManager, UserSchema);
require('./app/routes/subscription/change-payment-method.js')(app, config, subscriptionManager, subscriptionValidator, UserSchema);
require('./app/routes/subscription/unsubscribe.js')(app, subscriptionManager);
require('./app/routes/subscription/renew-cancelled-subscription.js')(app, subscriptionManager);

//flow manager
require('./app/routes/flow-management.js')(app, subscriptionValidator, FlowSchema, StepSchema);

//test runner
require('./app/routes/test-runner.js')(app, http, TestSchema);


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
