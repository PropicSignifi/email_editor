#!/bin/bash
cp -r ~/grapesjs/dist/* ~/email_editor/public
cp -r ~/grapesjs-mjml/dist/* ~/email_editor/public

http-server
