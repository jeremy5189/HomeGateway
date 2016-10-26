'use strict';

var express     = require('express'),
    config      = require('../config'),
    router      = express.Router(),
    sphero      = require("sphero"),
    bb8         = sphero(config.bb8_address),
    bb8_status  = false,
    ping_handle = null;

function bb8_sound(num) {
	global.run_cmd('mpg123', [ global.DOC_ROOT + '/bb8-sounds/bb8-' + num + '.mp3']);
}

global.events.on('tag_all_connected', bb8_init);

function bb8_init() {

	global.logging('bb8_init, tag_all_connected event invoked');
	bb8.connect(bb8_connected);
}

function bb8_connected() {

	global.logging('bb8 connected');
	bb8_status = true;
	global.events.emit('bb8_connected');
	bb8_sound('26');
	bb8.version(function(err, data) {
       if (err) {
         console.log("error: ", err);
       } else {
         console.log("data:");
         console.log("  recv:", data.recv);
         console.log("  mdl:", data.mdl);
         console.log("  hw:", data.hw);
         console.log("  msaVer:", data.msaVer);
         console.log("  msaRev:", data.msaRev);
         console.log("  bl:", data.bl);
         console.log("  bas:", data.bas);
         console.log("  macro:", data.macro);
         console.log("  apiMaj:", data.apiMaj);
         console.log("  apiMin:", data.apiMin);
       }
    });

	// Ping 10 secs
    ping_handle = setInterval(bb8_ping, 1000 * 10);
}

function bb8_ping() {
	global.logging('bb8 ping');

	bb8.ping(function(err, data) {

    	if(err)
    		console.error(err);

    	console.log(data);
	});
}

function bb8_disconnect() {
	bb8.disconnect(function() {
		global.logging('bb8 disconnected');
		bb8_status = false;
		clearInterval(ping_handle);
		global.events.emit('bb8_disconnected');
	});
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

	global.events.on('bb8_disconnected', function() {

		ws.send(JSON.stringify({
			status : bb8_status,
			address: bb8_address
		}), function(err){});
	});
});

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

function bb8_reconnect() {

	bb8_disconnect();

	// Wait and reconnect again
	setTimeout(function() {
		bb8_init();
	}, 3000);
}

function get_random_num() {
	var n = Math.floor(Math.random() * 32) + 1;
	if( n < 10 )
		return '0' + n;

	return n.toString();
}

router.ws('/control', function(ws, req) {

	// Got message from client
	ws.on('message', function(msg) {

		global.logging('Got message from clinet: ' + msg);

		// Abort if not connected
		if( !bb8_status ) return;

		bb8_sound(get_random_num());

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
			case 'reconnect':
				bb8_reconnect();
				break;
			default:
				break;
		}
	});
});

module.exports = router;
