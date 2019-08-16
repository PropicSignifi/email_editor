# Email Editor

## Build

Run `npm install`.

## Setup AES keys

These environment variables needs to be setup to support correct
authentication.

```
AES_KEY
AES_IV
```

If you are running the server in your local machine, you can create a file
named `.env` initializing the variable, and save it in the same folder.

For example:

```
AES_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
AES_IV=0123456789abcdef0123456789abcdef
```

If you are running in elastic beanstalk, you can setup the variables in the
web configuration.

## Start the server

Run `node app.js`. This will start an HTTP server binding the 3000 TCP port.

Changing the port number, to 443 for example, you can run `export PORT=443`.

## Deploy to elastic beanstalk

If you haven't, do `eb init`, `eb create` and follow its instructions.

Then run `eb deploy` and deploy it to the associated elastic beanstalk.
