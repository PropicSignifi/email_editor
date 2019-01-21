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
    var AWS = require('aws-sdk');
    var express = require('express');
    var session = require('express-session');
    var bodyParser = require('body-parser');
    var salesforce = require('./salesforce');

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.use(express.static(__dirname + '/public'));
    app.use(session({secret: "Secret"}));
    app.use(bodyParser.urlencoded({extended:false}));

    const checkAuth = (req, res, next) => {
        if (!req.session.authenticated) {
            res.redirect(salesforce
                .oAuth()
                .getAuthorizationUrl({
                    scope: "api id web refresh_token"}));
        } else {
            next();
        }
    };

    app.get("/token", (req, res) => {
        salesforce.authorize(req.query.code)
        .then(() => {
            req.session.authenticated = true;
            res.redirect('/');
        })
        .catch(() => {
        });
    });

    app.get('/', checkAuth, (req, res) => {
        res.render("editor");
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, () => {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
