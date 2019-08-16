# Email Editor

## Build

Run `npm install`.

## Start the server

Run `node app.js`. This will start an HTTP server binding the 3000 TCP port.

Changing the port number, to 443 for example, you can run `export PORT=443`.

## Deploy to elastic beanstalk

If you haven't, do `eb create` and follow its instructions.

Then run `eb deploy` to the associated elastic beanstalk.
