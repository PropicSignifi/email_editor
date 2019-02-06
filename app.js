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
    var cookieSession = require('cookie-session');
    var cookieParser = require('cookie-parser');
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
    app.use(cookieSession({name: "session", keys: ['secret']}));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:false}));

    const saveSession = (req, res, next) => {
        if (req.query.bucket) {
            req.session.bucket = req.query.bucket;
        }
        if (req.query.templateId) {
            req.session.templateId = req.query.templateId;
        }
        if (req.query.loginUrl) {
            req.session.loginUrl = req.query.loginUrl;
        }
        next();
    };

    const checkAuth = (req, res, next) => {
        //next();
        //return;

        if (!req.session.authenticated) {
            res.redirect(salesforce
                .oAuth(req.session.loginUrl)
                .getAuthorizationUrl({
                    scope: "api id web refresh_token"}));
        } else {
            next();
        }
    };

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
        var s3 = new AWS.S3();

        s3.getObject({Bucket: req.session.bucket, Key: "test"}, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else {
                res.render("editor", {
                    template: data.Body,
                });
            }
        });
    });

    app.post("/save", (req, res) => {
        var s3 = new AWS.S3();
        var template = req.body.code;

        var uploadParams = {Bucket: req.session.bucket, Body: template, Key: "test"};
        s3.upload(uploadParams, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Upload Success", data.Location);
            }
        })
        res.send("OK");
    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, () => {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
