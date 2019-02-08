// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    var express = require('express');
    var cookieSession = require('cookie-session');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var salesforce = require('./salesforce');
    var templateService = require('./template-service');
    var _ = require('lodash');

    var app = express();

    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.use(express.static(__dirname + '/public'));
    app.use(cookieSession({name: "session", keys: ['secret']}));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:false}));

    const saveSession = (req, res, next) => {
        _.defaultsDeep(req.session, req.query);
        next();
    };

    const checkAuth = (req, res, next) => {
        if (!req.session.authenticated) {
            res.redirect(salesforce
                .oAuth(req.session.loginUrl)
                .getAuthorizationUrl({
                    scope: "api id web refresh_token"}));
        } else {
            next();
        }
    };

    const formRequestHeader = (req) => Object({
        bucket: req.session.bucket,
        orgId: req.session.orgId,
        templateId: req.session.templateId,
    });

    app.get("/token", (req, res) => {
        console.log(req.query.code);
        salesforce.authorize(req.session.loginUrl, req.query.code)
        .then(() => {
            req.session.authenticated = true;
            req.session.save();
            res.redirect('/');
        })
        .catch(() => {
        });
    });

    app.get('/', saveSession, checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);
        var getTemplate = templateService.getTemplate(requestHeader);
        var getUserContext = templateService.getUserContext(requestHeader);
        var getUserBlocks = templateService.getUserBlocks(requestHeader);

        Promise.all([getTemplate, getUserContext, getUserBlocks])
        .then((data) => {
            res.render("editor", {
                template: data[0],
                userContext: JSON.stringify(data[1]),
                userBlocks: JSON.stringify(data[2]),
            });
        });
    });

    app.post("/save", checkAuth, (req, res) => {
        var data = req.body.data;
        var requestHeader = _.set(formRequestHeader(req), 'data', data);

        templateService.saveTemplate(requestHeader)
        .then(() => {
            res.send("OK");
        });
    });

    app.post("/saveUserContext", checkAuth, (req, res) => {
        var data = req.body.data;
        var requestHeader = _.set(formRequestHeader(req), 'data', data);

        templateService.saveUserContext(requestHeader)
        .then(() => {
            res.send("OK");
        });
    });

    app.post("/saveUserBlock", checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);
        var block = req.body.data;

        templateService.getUserBlocks(requestHeader)
        .then(data => {
            // Merge blocks
            var blocks = data;

            blocks = _.concat(block, blocks);

            templateService.saveUserBlocks(_.set(requestHeader, 'data', blocks))
            .then(() => {
                res.send("OK");
            });
        });

    });

    app.post("/deleteUserBlock", checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);

        var name = req.body.data;

        templateService.getUserBlocks(requestHeader)
        .then(data => {
            // Delete block
            var blocks = data;

            _.remove(blocks, {name: name});

            templateService.saveUserBlocks(_.set(requestHeader, 'data', blocks))
            .then(() => {
                res.send("OK");
            });
        });
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, () => {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
