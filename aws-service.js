var AWS = require('aws-sdk');
var fs = require('fs');

AWS.config.region = process.env.REGION;

var s3 = new AWS.S3();

const upload = (bucket, key, data) =>
    new Promise((resolve, reject) => {
        s3.upload({Bucket: bucket, Key: key, Body: data, ACL: 'public-read'}, (err, data) => {
            if (err) {
                console.log('Upload Error', err.message);
                reject(err);
            } else {
                console.log('Upload Success', data.Location);
                resolve(data);
            }
        });
    });

const download = (bucket, key) =>
    new Promise((resolve, reject) => {
        s3.getObject({Bucket: bucket, Key: key}, (err, data) => {
            if (err) {
                console.log('Download Error', err.message);
                reject(err);
            } else {
                console.log('Download Success');
                resolve(data);
            }
        });
    });

const saveTemplate = (session, data) => {
    var key = session.path + '/' + session.templateId + '.mjml';
    console.log('Saving to: ', session.bucket, key);
    return upload(session.bucket, key, data);
};

const getTemplate = (session) => {
    var key = session.path + '/' + session.templateId + '.mjml';
    console.log('Retrieving from: ', key);
    return download(session.bucket, key)
        .catch(() => {
            console.log('Try a demo template');
            return new Promise((resolve, reject) => {
                fs.readFile('public/demo.mjml', 'utf8', (err, data) => {
                    if (err) {
                        console.log('Reading demo template error', err.message);
                        reject(err);
                    } else {
                        console.log('Reading demo template success');
                        resolve({Body: data});
                    }
                });
            });
        }).then(data => data.Body);
};

const saveUserContext = (session, data) => {
    var key = session.path + '/' + session.templateId + '.data.json';
    console.log('Saving to: ', key);
    return upload(session.bucket, key, JSON.stringify(data));
};

const getUserContext = (session) => {
    var key = session.path + '/' + session.templateId + '.data.json';
    console.log('Retrieving from: ', key);
    return download(session.bucket, key)
        .catch(() => {
            console.log('Use the demo data');
            var userContext = [
                    {
                        'name': 'title',
                        'label': 'Title',
                        'type': 'Text',
                        'value': 'Sample Title'
                    }
                ];
            return {Body: JSON.stringify(userContext)};
        }).then(data => JSON.parse(data.Body));
};

const saveUserBlocks = (session, data) => {
    var key = session.path + '/block.json';
    console.log('Saving to: ', key);
    return upload(session.bucket, key, JSON.stringify(data));
};

const getUserBlocks = (session) => {
    var key = session.path + '/block.json';
    console.log('Retrieving from: ', key);
    return download(session.bucket, key)
        .catch(() => {
            console.log('Use the demo block');
            var userBlocks = [
                {
                    id: '1',
                    name: 'Title',
                    content: '<mj-raw><h1>Title</h1></mj-raw>',
                },
            ];

            return {Body: JSON.stringify(userBlocks)};
        }).then(data => JSON.parse(data.Body));
};

const aws = {
    saveTemplate: saveTemplate,
    getTemplate: getTemplate,
    saveUserContext: saveUserContext,
    getUserContext: getUserContext,
    saveUserBlocks: saveUserBlocks,
    getUserBlocks: getUserBlocks,
};

module.exports = aws;
