const jsforce = require('jsforce');

const oAuth = (loginUrl) =>
    new jsforce.OAuth2({
        loginUrl: "https://" + loginUrl,
        clientId: "3MVG9Y6d_Btp4xp5oxhilfVUQdRv0P0VtCVQwa7Yot9j057DYQA1uV6CFnBlexgc4MSV5pUOPmFVwOs43992n",
        clientSecret: "94016072357533219",
        redirectUri: "https://email-editor.clicktocloud.com/token",
    });

const authorize = (loginUrl, code) =>
    new Promise((resolve, reject) => {
        const conn = new jsforce.Connection({oauth2: oAuth(loginUrl)});
        conn.authorize(code, (err, userInfo) => {
            if (err) {
                console.error("Authorization Error", err);
                reject();
            } else {
                resolve(userInfo);
            }
        });
    });


const salesforce = {
    oAuth: oAuth,
    authorize: authorize,
};

module.exports = salesforce;
