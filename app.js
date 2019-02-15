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
    var bodyParser = require('body-parser');
    var cookieSession = require('cookie-session');
    var cookieParser = require('cookie-parser');
    var _ = require('lodash');
    var sessionService = require('./session-service');
    var templateService = require('./template-service');
    var config = require('./config');

    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + '/public'));
    app.use(cookieSession({
        name: 'session',
        keys: ['secret'],
        cookie: {
            secure: true,
            expires: new Date(Date.now() + 60 * 60 * 1000),
        },
    }));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:false}));

    const saveSession = (req, res, next) => {
        sessionService.saveSession(req);
        next();
    };

    app.get('/', saveSession, (req, res) => {
        var getTemplate = templateService.getTemplate(req.session);
        var getUserContext = templateService.getUserContext(req.session);
        var getUserBlocks = templateService.getUserBlocks(req.session);

        Promise.all([getTemplate, getUserContext, getUserBlocks])
        .then((data) => {
            res.render('editor', {
                template: data[0],
                userContext: JSON.stringify(data[1]),
                userBlocks: JSON.stringify(data[2]),
                readOnly: sessionService.readOnly(req.session),
            });
        });
    });

    app.post('/save', (req, res) => {
        var data = req.body.data;
        templateService.saveTemplate(req.session, data)
        .then(() => {
            res.send('OK');
        })
        .catch((err) => {
            console.log('Saving Template Error', err.message);
        });
    });

    app.post('/saveUserContext', (req, res) => {
        var data = req.body.data;

        templateService.saveUserContext(req.session, data)
        .then(() => {
            res.send('OK');
        })
        .catch((err) => {
            console.log('Saving User Context Error', err.message);
        });
    });

    app.post('/saveUserBlock', (req, res) => {
        var block = req.body.data;

        templateService.getUserBlocks(req.session, block)
        .then(data => {
            // Merge blocks
            var blocks = data;

            blocks = _.concat(block, blocks);

            templateService.saveUserBlocks(req.session, blocks)
            .then(() => {
                res.send('OK');
            });
        })
        .catch((err) => {
            console.log('Saving User Block Error', err.message);
        });

    });

    app.post('/deleteUserBlock', (req, res) => {
        var name = req.body.data;

        templateService.getUserBlocks(req.session)
        .then(data => {
            // Delete block
            var blocks = data;

            _.remove(blocks, {name: name});

            templateService.saveUserBlocks(req.session, blocks)
            .then(() => {
                res.send('OK');
            });
        })
        .catch((err) => {
            console.log('Deleting User Block Error', err.message);
        });
    });

    app.get('/logout', (req, res) => {
        sessionService.logout(req.session);
        res.redirect('back');
    });

    var port = config.port;

    var server = app.listen(port, () => {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
