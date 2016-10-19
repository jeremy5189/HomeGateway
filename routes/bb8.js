'use strict';

//var bb8_address = 'e146c3a8db364a6c9ff2ae739401ddd8';
var bb8_address = 'ec:98:74:81:1c:5e';

var express    = require('express'),
	router     = express.Router(),
	sphero     = require("sphero"),
    bb8        = sphero(bb8_address),
    bb8_status = false;


function bb8_sound(num) {
	global.run_cmd('mpg123', [ global.DOC_ROOT + '/bb8-sounds/bb8-' + num + '.mp3']);
}

global.events.on('tag_all_connected', bb8_init);

function bb8_init() {
		
	global.logging('tag_all_connected event invoked');
	bb8.connect(bb8_connected);
}

function bb8_connected() {

	global.logging('bb8 connected');
	bb8_status = true;
	global.events.emit('bb8_connected');
	bb8_sound('26');
}

router.ws('/status', function(ws, req) {

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
			default:
				break; 
		}
	});
});

module.exports = router;
