// ------------------
// Init Express
// ------------------
var express  = require('express'),
    app      = express(),
    DOC_ROOT = '/home/pi/DoorServer',
    PORT     = 3000;


// ------------------
// Index 
// ------------------
app.get('/', function (req, res) {

  res.send('Home Gateway');

});

// ------------------
// Get Record Photo
// ------------------
app.get('/photo/:event/:timestamp', function(req, res) {

  var event 	  = req.params.event,
      timestamp = req.params.timestamp;

  console.log(event);
  console.log(timestamp);

  var fs   = require('fs'),
      path = DOC_ROOT + '/photo/' + event + '/' + timestamp + '.jpg',
      img  = fs.readFileSync(path);

  res.writeHead(200, {'Content-Type': 'image/jpeg'});
  res.end(img, 'binary'); 
  
});

// ------------------------------------------------------
// Take Photo (With option ?event=open to not return)
// ------------------------------------------------------
app.get('/photo', function(req, res) {
  
    logging('GET /photo ip = ' + req.ip);

    // If event == open then dont return photo in res
    var event = null;
    // ?event=
    if( req.query.event != undefined )
        event = req.query.event;

    var fn, ts = (new Date().getTime());
  
    if( event == 'open' ) {
        logging('event = open');
        fn = DOC_ROOT + '/photo/' + event + '/' + ts + '.jpg';
    } 
    else {
        fn = '/tmp/' + ts + '.jpg';
    }

    logging('Photo fn = ' + fn);
    run_cmd('raspistill', [
        '-o',
        fn,
        '-w',
        '800',
        '-h',
        '600',
        '-hf', 
        '-vf',
        '-n'
    ], function() {

        logging('Photo done');

        if(event == null) {
	    	    var fs  = require('fs');
	    	    var img = fs.readFileSync(fn);
	    	    res.writeHead(200, {'Content-Type': 'image/jpeg' });
	    	    res.end(img, 'binary'); 
        }
  
    });

    // Send back record photo name to let db save it first
    if( event == 'open' )
        res.send({name: ts});
});

// ------------------
// Lock 
// ------------------
app.get('/lock/lock', function(req, res) {
  
    logging('GET /lock ip = '+ req.ip);

    run_cmd(DOC_ROOT + '/scripts/lock.sh', [], function(output) {
        res.send({status: 1});
    });
});

// ------------------
// Unlcok 
// ------------------
app.get('/lock/unlock', function(req, res) {

    logging('GET /unlock ip = ' + req.ip);

    run_cmd(DOC_ROOT + '/scripts/unlock.sh', [], function(output) {
        res.send({status: 0});
    });
});

// ------------------
// Lock Status 
// ------------------
app.get('/lock/status', function(req, res) {
  
    logging('GET /status ip = ' + req.ip);

    run_cmd(DOC_ROOT + '/scripts/status.sh', [], function(output) {
        var ret = parseInt(output.replace("\n", '').replace(" ", ""));
        logging('Lock Status = ' + ret);
        res.send({ lock: ret });
    });
});

// ------------------
// Start Express 
// ------------------
app.listen(PORT, function () {
    
    logging('HomeGateway listening on port 3000');
    init();

});

var init = function() {
    
    // Init GPIO
    run_cmd( DOC_ROOT + '/scripts/init.sh', [], function(){});

    // Lock on Init
    run_cmd( DOC_ROOT + '/scripts/lock.sh', [], function(){});

    // Play Init Sound
    run_cmd('aplay', ['/home/pi/DoorServer/sound/init_lock.wav']);
}

var logging = function(str) {

    var moment = require('moment'),
        now    = moment().format("YYYY-MM-DD HH:mm:ss");

    console.log('[%s] %s', now, str);
}

var run_cmd = function (cmd, args, callback) {
    
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
