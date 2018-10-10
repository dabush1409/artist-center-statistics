'use strict';

var server = require('./server/server');
//var conf = require('./server/conf/conf');
var http = require('http');
var app = server.init();

var PORT = app.get('port');

function x(req, res, next) {
    app.handle(req, res, next);
}

http.createServer(x).listen(PORT);

console.log('HTTP server is running ... port:', PORT);
