// ------------------
// Init Express
// ------------------
var express  = require('express'),
    app      = express(),
    PORT     = 3000;

global.DOC_ROOT = '/home/pi/DoorServer';
global.logging = function(str) {

    var moment = require('moment'),
        now    = moment().format("YYYY-MM-DD HH:mm:ss");

    console.log('[%s] %s', now, str);
}
global.run_cmd = function (cmd, args, callback) {
    
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
    photo = require('./routes/photo');

app.use('/lock', lock);
app.use('/photo', photo);

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
    
    // Init GPIO
    run_cmd( DOC_ROOT + '/scripts/init.sh', [], function(){});

    // Lock on Init
    run_cmd( DOC_ROOT + '/scripts/lock.sh', [], function(){});

    // Play Init Sound
    run_cmd('aplay', ['/home/pi/DoorServer/sound/init_lock.wav']);

});
