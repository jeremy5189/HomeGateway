'use strict';

var bb8_address = 'e146c3a8db364a6c9ff2ae739401ddd8';

var express    = require('express'),
	router     = express.Router(),
	sphero     = require("sphero"),
    bb8        = sphero(bb8_address),
    bb8_status = false;


global.events.on('tag_all_connected', bb8_init);

function bb8_init() {
		
	global.logging('tag_all_connected event invoked');
	bb8.connect(bb8_connected);
}

function bb8_connected() {

	global.logging('bb8 connected');
	bb8_status = true;
	global.events.emit('bb8_connected');
}

function bb8_up() {
	bb8.stop();
	bb8.roll(150, 0);
}

function bb8_down() {
	bb8.stop();
	bb8.roll(150, 180);
}

function bb8_left() {
	bb8.stop();
	bb8.roll(150, 270);
}

function bb8_right() {
	bb8.stop();
	bb8.roll(150, 90);
}

function bb8_stop() {
	bb8.stop();
}

function bb8_calibrate() {
	
	bb8.startCalibration();
	
	bb8.roll(1, 90, 2, function() {
        setTimeout(function() {
        	bb8.setHeading(0, function() {
            	bb8.roll(0,0,1);
          	});
        }, 300);
    });
}

function bb8_calibrate_finish() {
	bb8.finishCalibration();
}

router.ws('/status', function(ws, req) {

	global.logging('ws:// bb8/status');

	ws.send(JSON.stringify({
		status : bb8_status,
		address: bb8_address
	}), function(err){});

	global.events.on('bb8_connected', function() {

		ws.send(JSON.stringify({
			status : bb8_status,
			address: bb8_address
		}), function(err){});
	});
});

router.ws('/control', function(ws, req) {

	global.logging('ws:// bb8/control');

	// Got message from client
	ws.on('message', function(msg) {

		global.logging('Got message from clinet: ' + msg);

		// Abort if not connected
		if( !bb8_status ) return;

		switch(msg) {
			case 'up':
				bb8_up();
				break;
			case 'down':
				bb8_down();
				break;
			case 'left':
				bb8_left();
				break;
			case 'right':
				bb8_right();
				break;
			case 'stop':
				bb8_stop();
				break;
			case 'calibrate':
				bb8_calibrate();
				break;
			case 'calibrate_finish':
				bb8_calibrate_finish();
				break;
			default:
				break; 
		}
	});
});

module.exports = router;