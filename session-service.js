var crypto = require('crypto');
var _ = require('lodash');
var config = require('./config');

const decrypt = (cipher) => {
    var decipher = crypto.createDecipheriv('aes-256-cbc',
        Buffer.from(config.aesKey, 'hex'),
        Buffer.from(config.aesIv, 'hex')
    );

    try {
        var clear = decipher.update(cipher, 'hex', 'utf8') + decipher.final('utf8');
        return clear;
    } catch(err) {
        console.log('Decryption Error', err.message);
        return undefined;
    }

};

const saveSession = (req) => {
    if (!req.query.query) {
        console.log('Bad request');
        return;
    }

    var query;

    try {
        query = JSON.parse(decrypt(req.query.query));
    } catch(err) {
        console.log('Bad JSON format', err.message);
        return;
    }

    _.defaults(req.session, {
        bucket: query.bucket,
        path: query.path,
        templateId: query.templateId,
    });
    req.session.save();
};

const logout = (session) => {
    session.bucket = undefined;
    session.path = undefined;
    session.templateId = undefined;
    session.save();
};

const readOnly = (session) => !session.bucket || !session.path || !session.templateId;

const sessionService = {
    saveSession: saveSession,
    logout: logout,
    readOnly: readOnly,
};

module.exports = sessionService;
