var AWS = require('aws-sdk');

AWS.config.region = process.env.REGION;

var s3 = new AWS.S3();

const upload = (bucket, key, data) =>
    new Promise((resolve, reject) => {
        s3.upload({Bucket: bucket, Key: key, Body: data}, (err, data) => {
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
                console.log('Download Sucess');
                resolve(data);
            }
        });
    });

const saveTemplate = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.mjml';
    return upload(req.bucket, key, req.data);
};

const getTemplate = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.mjml';
    return download(req.bucket, key)
        .catch(() => {
            console.log('Try a demo template');
            return download(req.bucket, 'edm/demo.mjml');
        }).then(data => data.Body);
};

const saveUserContext = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.data.json';
    return upload(req.bucket, key, JSON.stringify(req.data));
};

const getUserContext = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.data.json';
    return download(req.bucket, key)
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

const saveUserBlocks = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.block.json';
    return upload(req.bucket, key, JSON.stringify(req.data));
};

const getUserBlocks = (req) => {
    var key = 'edm/' + req.path + '/' + req.templateId + '.block.json';
    return download(req.bucket, key)
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
