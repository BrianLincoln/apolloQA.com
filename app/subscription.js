var config = require('./../config/config.js');
var User = require('./models/user');
var stripe = require("stripe")(
    config.stripeSecretKey
);

module.exports = {

    subscribeNewCustomer: function(userId, token, subscription, email) {
        return new Promise(function(resolve, reject) {
            stripe.customers.create({
                source: token,
                plan: subscription,
                email: email
            }, function(err, customer) {
                if (!err) {
                    var result = {
                        status: "success",
                        customerId: customer.id
                    }
                    resolve(result);
                }
                else {
                    switch (err.rawType) {
                        case 'card_error':
                            var result = {
                                status: "fail",
                                reaonCode: "card-error"
                            }
                            resolve(result);
                            break;
                        default:
                            var result = {
                                status: "fail",
                                reaonCode: "server-error"
                            }
                            resolve(result);
                            break;
                    }
                    reject(err);
                    console.log("ERROR: failed to create stripe customer");
                }
            });
        });
    },

    changePaymentMethod: function(stripeCustomerId, token) {
        return new Promise(function(resolve, reject) {
            stripe.customers.update(stripeCustomerId, {
                source: token
            }, function(err, customer) {
                if (!err) {
                    var result = {
                        status: "success",
                        customerId: customer.id
                    }
                    resolve(result);
                }
                else {
                    switch (err.rawType) {
                        case 'card_error':
                            var result = {
                                status: "fail",
                                reaonCode: "card-error"
                            }
                            resolve(result);
                            break;
                        default:
                            var result = {
                                status: "fail",
                                reaonCode: "server-error"
                            }
                            resolve(result);
                            break;
                    }
                    reject(err);
                    console.log("ERROR: failed to update payment method");
                }
            });
        });
    },

    cancelSubscriptions: function(userId, stripeCustomerId) {
        var scope = this;

        return new Promise(function(resolve, reject) {
            //get stripe customer
            stripe.customers.retrieve (
                stripeCustomerId,
                function(err, customer) {
                    if (!err && customer) {
                        var subscriptions = customer.subscriptions.data;
                        var deletions = subscriptions.map(scope.deleteSubscription);

                        var results = Promise.all(deletions);
                        results.then(function() {
                            resolve();
                        });
                    } else {
                        console.log("ERROR: failed to fetch stripe customer");
                    }
                }
            );
        });
    },

    deleteSubscription: function(subscription) {
        return new Promise(function(resolve, reject) {
            stripe.subscriptions.del(
                subscription.id,
                function(err, confirmation) {
                    if (!err) {
                        resolve(confirmation);
                    } else {
                        console.log("ERROR: failed to delete subscription: " + subscription.id);
                        reject(err);
                    }
                }
            );
        });
    },

    updateUser: function(userId, stripeCustomerId, subscription, status) {
        return new Promise(function(resolve, reject) {
            User.findById(userId, function (err, user) {
                user.stripeCustomerId = stripeCustomerId;
                if (status) {
                    user.accountStatus = status;
                }
                if (subscription) {
                    user.subscription = subscription;
                }

                user.save(function (err) {
                    if (!err) {
                        resolve();
                    } else {
                        console.log("ERROR: failed to update user");
                    }
                });
            });
        });
    }
}
