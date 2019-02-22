var crypto = require('crypto');
var _ = require('lodash');
var config = require('./config');
var moment = require('moment');

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

    _.assign(req.session, {
        bucket: query.bucket,
        path: query.path,
        templateId: query.templateId,
        userId: query.userId,
        timestamp: query.timestamp,
        ttl: query.ttl,
    });
    req.session.save();
};

const logout = (session) => {
    session.bucket = undefined;
    session.path = undefined;
    session.templateId = undefined;
    session.userId = undefined;
    session.timestamp = undefined;
    session.ttl = undefined;
    session.save();
};

const readOnly = (session) => {
    var timeout = moment(parseInt(session.timestamp)).add(session.ttl, 'seconds') < moment();
    console.log(timeout);
    return !session.bucket || !session.path || !session.templateId || timeout;
};

const sessionService = {
    saveSession: saveSession,
    logout: logout,
    readOnly: readOnly,
};

module.exports = sessionService;
