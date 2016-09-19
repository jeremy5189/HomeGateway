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
    console.log(args);

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
    
// ------------------
// Load Module 
// ------------------
var lock  = require('./routes/lock'),
    photo = require('./routes/photo'),
    sensortag = require('./routes/sensortag');

app.use('/lock', lock);
app.use('/photo', photo);
app.use('/sensortag', sensortag);


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
