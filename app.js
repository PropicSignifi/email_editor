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
    var templateService = require('./template-service');
    var config = require('./config');
    var _ = require('lodash');
    var crypto = require('crypto');

    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + '/public'));
    app.use(cookieSession({name: 'session', keys: ['secret']}));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:false}));

    const saveSession = (req, res, next) => {
        _.defaults(req.session, {
            bucket: decrypt(req.query.bucket),
            path: req.query.path,
            templateId: req.query.templateId,
        });
        next();
    };

    const checkAuth = (req, res, next) => {
        if (!req.session.authenticated) {
            var bucket = req.session.bucket;
            if (bucket && /^[0-9A-Za-z]+/.test(bucket)) {
                req.session.authenticated = true;
                req.session.save();
                next();
            } else {
                console.log('Authentication failed');
                res.status(401).send('Authentication failed')
            }
        } else {
            next();
        }
    };

    const formRequestHeader = (req) => Object({
        bucket: req.session.bucket,
        path: req.session.path,
        templateId: req.session.templateId,
    });

    const decrypt = (cipher) => {
        if (!cipher) return undefined;

        var decipher = crypto.createDecipheriv('aes-256-cbc',
            Buffer.from(config.aesKey, 'hex'),
            Buffer.from(config.aesIv, 'hex'));
        var clear = decipher.update(cipher, 'hex', 'utf8') + decipher.final('utf8');

        return clear;
    };

    app.get('/', saveSession, checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);
        var getTemplate = templateService.getTemplate(requestHeader);
        var getUserContext = templateService.getUserContext(requestHeader);
        var getUserBlocks = templateService.getUserBlocks(requestHeader);

        Promise.all([getTemplate, getUserContext, getUserBlocks])
        .then((data) => {
            res.render('editor', {
                template: data[0],
                userContext: JSON.stringify(data[1]),
                userBlocks: JSON.stringify(data[2]),
            });
        });
    });

    app.post('/save', checkAuth, (req, res) => {
        var data = req.body.data;
        var requestHeader = _.set(formRequestHeader(req), 'data', data);

        templateService.saveTemplate(requestHeader)
        .then(() => {
            res.send('OK');
        });
    });

    app.post('/saveUserContext', checkAuth, (req, res) => {
        var data = req.body.data;
        var requestHeader = _.set(formRequestHeader(req), 'data', data);

        templateService.saveUserContext(requestHeader)
        .then(() => {
            res.send('OK');
        });
    });

    app.post('/saveUserBlock', checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);
        var block = req.body.data;

        templateService.getUserBlocks(requestHeader)
        .then(data => {
            // Merge blocks
            var blocks = data;

            blocks = _.concat(block, blocks);

            templateService.saveUserBlocks(_.set(requestHeader, 'data', blocks))
            .then(() => {
                res.send('OK');
            });
        });

    });

    app.post('/deleteUserBlock', checkAuth, (req, res) => {
        var requestHeader = formRequestHeader(req);

        var name = req.body.data;

        templateService.getUserBlocks(requestHeader)
        .then(data => {
            // Delete block
            var blocks = data;

            _.remove(blocks, {name: name});

            templateService.saveUserBlocks(_.set(requestHeader, 'data', blocks))
            .then(() => {
                res.send('OK');
            });
        });
    });

    app.get('/logout', (req, res) => {
        req.session.authenticated = false;
        req.session.bucket = undefined;
        req.session.save();
        res.redirect('back');
    });

    var port = config.port;

    var server = app.listen(port, () => {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
