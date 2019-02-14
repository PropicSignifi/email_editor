const config = {
    aesKey: process.env.AES_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    aesIv: process.env.AES_IV || 'aaaaaaaaaaaaaaaa',
    port: process.env.PORT || 3000
};

module.exports = config;
