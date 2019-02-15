var crypto = require('crypto');
var _ = require('lodash');
var config = require('./config');

const decrypt = (cipher) => {
    var decipher = crypto.createDecipheriv('aes-256-cbc',
        Buffer.from(config.aesKey, 'hex'),
        Buffer.from(config.aesIv, 'hex')
    );

    var clear;

    try {
        clear = decipher.update(cipher, 'hex', 'utf8');
        clear += decipher.final('utf8');
    } catch(err) {
        console.log('Decryption Error', err.message);
    }

    return clear;
};

const saveSession = (req) => {
    _.defaults(req.session, {
        bucket: decrypt(req.query.bucket),
        path: req.query.path,
        templateId: req.query.templateId,
    });
    req.session.save();
};

const logout = (session) => {
    session.bucket = undefined;
    session.save();
};

const readOnly = (session) => !session.bucket;

const sessionService = {
    saveSession: saveSession,
    logout: logout,
    readOnly: readOnly,
};

module.exports = sessionService;
