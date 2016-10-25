// ------------------
// Init Express
// ------------------
var express  = require('express'),
    config   = require('./config'),
    app      = express(),
    PORT     = config.port,
    local    = config.local;

// Web Socket Support
var expressWs = require('express-ws')(app);

// Handle Event
var EventEmitter  = require('events').EventEmitter;
global.events     = new EventEmitter();
global.DOC_ROOT   = config.doc_root;
global.connected_tag_count = 0;
global.expected_tag_count  = 2;

global.logging = function (str) {

    var moment = require('moment'),
        now    = moment().format("YYYY-MM-DD HH:mm:ss");

    console.log('[%s] %s', now, str);
}

global.sound   = function (str) {

    if(!local)
        global.run_cmd('aplay', [ global.DOC_ROOT + '/sound/' + str + '.wav']);
}

global.run_cmd = function (cmd, args, callback) {

    // global.logging('cmd = ' + cmd);

    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        resp = "";

    child.stdout.on('data', function (buffer) {
        resp += buffer.toString();
    });

    child.stdout.on('end', function() {
        if(callback)
            callback(resp);
    });
}

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

// ------------------
// Load Module
// ------------------
var lock;
var photo;
var sensortag = require('./routes/sensortag');
var bb8       = require('./routes/bb8');

if ( !local ) {
    lock  = require('./routes/lock');
    photo = require('./routes/photo');
    app.use('/lock'  , lock);
    app.use('/photo'    , photo);
}
app.use('/sensortag', sensortag);
app.use('/bb8'      , bb8);
app.use(allowCrossDomain);


// ------------------
// Index
// ------------------
app.get('/', function (req, res) {
    res.send('Home Gateway');
});

// ------------------
// Start Express
// ------------------
app.listen(PORT, function () {

    logging('HomeGateway listening on port 3000');
});
