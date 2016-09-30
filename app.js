// ------------------
// Init Express
// ------------------
var express  = require('express'),
    app      = express(),
    PORT     = 3000;

// Web Socket Support
var expressWs = require('express-ws')(app);

global.DOC_ROOT = '/home/pi/HomeGateway';
global.logging = function (str) {

    var moment = require('moment'),
        now    = moment().format("YYYY-MM-DD HH:mm:ss");

    console.log('[%s] %s', now, str);

}
global.sound   = function (str) {

    global.run_cmd('aplay', [ global.DOC_ROOT + '/sound/' + str + '.wav']);

}
global.run_cmd = function (cmd, args, callback) {
    
    global.logging('cmd = ' + cmd);

    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        resp = "";

    child.stdout.on('data', function (buffer) { 
      resp += buffer.toString() 
    });

    child.stdout.on('end', function() { 
      if(callback)
        callback(resp) 
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
var lock  = require('./routes/lock');
var photo = require('./routes/photo');
var sensortag = require('./routes/sensortag');

app.use('/lock', lock);
app.use('/photo', photo);
app.use('/sensortag', sensortag);
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
