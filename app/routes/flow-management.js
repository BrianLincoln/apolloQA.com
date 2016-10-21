//TODO this should be broken down farther.
module.exports = function(app, Flow, Step) {
    app.get('/flows', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
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
    app.get('/flow/:flowId', function(req, res) {
        if (!req.isAuthenticated()) {
            res.redirect('/');
            return;
        }
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

//TODO ---- this is really adding a step, should not be a POST on the /flows/ level -- should be totally rethought out
    app.post('/api/flows/:flowId', function (req, res, next) {
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
