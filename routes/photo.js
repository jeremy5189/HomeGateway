var express = require('express');
var router = express.Router();

global.logging('Loading photo module');

// ------------------
// Get Record Photo
// ------------------
router.get('/photo/:event/:timestamp', function(req, res) {

  var event 	  = req.params.event,
      timestamp = req.params.timestamp;

  global.logging(event);
  global.logging(timestamp);

  var fs   = require('fs'),
      path = DOC_ROOT + '/photo/' + event + '/' + timestamp + '.jpg',
      img  = fs.readFileSync(path);

  res.writeHead(200, {'Content-Type': 'image/jpeg'});
  res.end(img, 'binary'); 
  
});

// ------------------------------------------------------
// Take Photo (With option ?event=open to not return)
// ------------------------------------------------------
router.get('/photo', function(req, res) {
  
    global.logging('GET /photo ip = ' + req.ip);

    // If event == open then dont return photo in res
    var event = null;
    // ?event=
    if( req.query.event != undefined )
        event = req.query.event;

    var fn, ts = (new Date().getTime());
  
    if( event == 'open' ) {
        global.logging('event = open');
        fn = DOC_ROOT + '/photo/' + event + '/' + ts + '.jpg';
    } 
    else {
        fn = '/tmp/' + ts + '.jpg';
    }

    global.logging('Photo fn = ' + fn);
    global.run_cmd('raspistill', [
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

        global.logging('Photo done');

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

module.exports = router;