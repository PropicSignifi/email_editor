const jsforce = require('jsforce');

const oAuth = () =>
    new jsforce.OAuth2({
        loginUrl: "https://test.salesforce.com",
        clientId: "3MVG9Y6d_Btp4xp5oxhilfVUQdRv0P0VtCVQwa7Yot9j057DYQA1uV6CFnBlexgc4MSV5pUOPmFVwOs43992n",
        clientSecret: "94016072357533219",
        redirectUri: "https://email-editor.clicktocloud.com/token",
    });

const authorize = (code) =>
    new Promise((resolve, reject) => {
        const conn = new jsforce.Connection({oauth2: oAuth()});
        conn.authorize(code, (err, userInfo) => {
            if (err) {
                console.error(err);
                reject();
            } else {
                resolve(userInfo);
            }
        });
    })


const salesforce = {
    oAuth: oAuth,
    authorize: authorize,
};

module.exports = salesforce;
