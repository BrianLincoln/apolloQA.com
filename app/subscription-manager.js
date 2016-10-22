var config = require('./../config/config.js');
var User = require('./models/user');
var stripe = require("stripe")(
    config.stripeSecretKey
);

module.exports = {
    getStripeCustomer: function(stripeCustomerId) {
        console.log("get customer");
        console.log(stripeCustomerId);
        return new Promise(function(resolve, reject) {
            stripe.customers.retrieve(
                stripeCustomerId,
                function(err, customer) {
                    if (!err) {
                        resolve(customer);
                    } else {
                        resolve(err);
                        console.log("ERROR -- Couldn't get stripe customer for id: " + stripeCustomerId)
                    }
                }
            );
        });
    },

    getStripeCustomerSubscription: function(customer) {
        console.log("getStripeCustomerSubscription");
        console.log("---1");
        if (customer && customer.subscriptions) {
            console.log("---2");
            if (customer.subscriptions.data.length > 1) {
                console.log();
                console.log("ERROR: Found more than one user for this customer");
            } else if (customer.subscriptions.data.length === 1) {
                console.log("---3");
                return customer.subscriptions.data[0];
            }
        }
        console.log("---4");
        return;
    },

    getStripeCustomerMaskedPaymentMethod: function(customer) {
        if (customer && customer.sources) {
            if (customer.sources.data.length > 1) {
                console.log("ERROR: Found more than one card for this customer");
            } else if (customer.sources.data.length === 1) {
                return "**** **** **** " + customer.sources.data[0].last4;
            }
        }
        return;
    },

    subscribeUser: function(userId, existingCustomerId, token, email) {
        var scope = this;
        var result = {
            status: "fail"
        };

        return new Promise(function(resolve, reject) {
            scope.getStripeCustomer(existingCustomerId)
            .then(function(customer) {
                if (customer.subscriptions.data.length > 0) {
                    //customer exists, and they have an active subscription.
                    result.reasonCode = "duplicate-subscription";
                    resolve(result);
                } else {
                    stripe.customers.create({
                        source: token,
                        plan: "basic",
                        email: email
                    }, function(err, customer) {
                        if (!err) {
                            result.status = "success";
                            result.customerId = customer.id

                            resolve(result);
                        }
                        else {
                            switch (err.rawType) {
                                case 'card_error':
                                    result.status = "fail";
                                    result.reaonCode = "card-error";

                                    resolve(result);
                                    break;
                                default:
                                    result.status = "fail";
                                    result.reaonCode = "server-error";

                                    resolve(result);
                                    break;
                            }
                            reject(err);
                            console.log("ERROR: failed to create stripe customer");
                        }
                    });
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

    renewCanceledSubscriptions: function(stripeCustomerId) {
        console.log("~~~~~~~~~~~renewCanceledSubscriptions");
        var scope = this;

        return new Promise(function(resolve, reject) {
            scope.getStripeCustomer(stripeCustomerId)
            .then(function(customer) {

                console.log(customer);
                if (customer) {
                    console.log("~~~~~~~~ 1");
                    var subscription = scope.getStripeCustomerSubscription(customer);
                        console.log("~~~~~~~~ 2");

                    if (subscription && subscription.cancel_at_period_end) {
                        console.log("~~~~~~~~ 3");

                        stripe.subscriptions.update(
                            subscription.id,
                            function(err, subscription) {

                                    console.log("~~~~~~~~ 4");
                                    console.log(err);
                                    console.log(subscription);
                                    console.log(subscription.cancel_at_period_end);
                                if (!err && subscription) {

                                        console.log("~~~~~~~~ 5");
                                    resolve(subscription);
                                } else {
                                    console.log("ERROR: failed to renew cancelled subscription: " + subscription.id);
                                    reject(err);
                                }
                            }
                        );
                    }
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
                {
                    at_period_end: true
                }, function(err, confirmation) {
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

    updateUserWithStripeCustomerId: function(userId, stripeCustomerId) {
        return new Promise(function(resolve, reject) {
            User.findById(userId, function (err, user) {
                user.stripeCustomerId = stripeCustomerId;

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
