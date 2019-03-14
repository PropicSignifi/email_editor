var dotenv = require('dotenv');

dotenv.config();

const config = {
    aesKey: process.env.AES_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    aesIv: process.env.AES_IV || '0123456789abcdef0123456789abcdef',
};

module.exports = config;
