'use strict';

var express   = require('express'),
	router    = express.Router(),
	SensorTag = require('sensortag'),
	device_info  = {}, // Global device recorder
	_log_every   = false;

global._tag		 = {}, // Global tag accessor	

// Duplicates allowed -> Reconnect possible
SensorTag.SCAN_DUPLICATES = true;

// Timeout for watchdog 
var timeoutVar = 7000;
var scanning = false;

// Handle Exception
process.on('uncaughtException', function(err) {
	console.error('uncaughtException restart process');
	console.error(err);
	process.exit(0);
});

// Intercept Noble Device Error
console.warn = function(d) {

	// Starts with
	if ( d.lastIndexOf('noble warning', 0) === 0 ) {
		console.error(d);
		console.error('Intercept noble warning, restarting process...');
		process.exit(0);
	} else {
    	process.stderr.write(d + '\n');
   	}
};

// ------------------------------------
// Listen to Connected Device
// ------------------------------------
router.ws('/connected', function(ws, req) {

	global.logging('ws:// connected');

	// Send init
	ws.send(JSON.stringify(device_info), function(error) {
	   	if(error)
	   		console.error(error);
	});

	global.events.on('device_disconnect', function() {

		global.logging('device_disconnect event trigger');
		
		ws.send(JSON.stringify(device_info), function(error) {
		   	if(error)
		   		console.error(error);
		});
	});

	global.events.on('device_connect', function() {

		global.logging('device_connect event trigger');

		ws.send(JSON.stringify(device_info), function(error) {
		   	if(error)
		   		console.error(error);
		});
	});
});


// ------------------------------------
// WebSocket Humidity 
// ------------------------------------
router.ws('/humidity/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || global._tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// humidity/' + uuid);

	global._tag[uuid].on('humidityChange', function (temperature, humidity) {

		if(_log_every) {
		   	global.logging('temperature = ' + temperature);
		   	global.logging('humidity = ' + humidity);
		}

		// Make json object with UUID
		var obj = {};

		obj[uuid] = {
	   		temperature: temperature, 
	   		humidity: humidity
	   	};

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});

// ------------------------------------
// WebSocket Pressure 
// ------------------------------------
router.ws('/barometricPressure/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || global._tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// barometricPressure/' + uuid);

	global._tag[uuid].on('barometricPressureChange', function(pressure) {

		if(_log_every) {
			global.logging('pressure = ' + pressure);
		}

	   	// Make json object with UUID
		var obj = {};

		obj[uuid] = {
			pressure: pressure
		};

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});

// ------------------------------------
// WebSocket irTemperature 
// ------------------------------------
router.ws('/irTemperature/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || global._tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// irTemperature/' + uuid);

	global._tag[uuid].on('irTemperatureChange', function (objectTemperature, ambientTemperature) {

		if(_log_every) {
	    	global.logging('objectTemperature = ' + objectTemperature);
	    	global.logging('ambientTemperature = ' + ambientTemperature);
	    }

	   	// Make json object with UUID
		var obj = {};

		obj[uuid] = {
	    	objectTemperature: objectTemperature, 
	    	ambientTemperature: ambientTemperature
	    };

	   	ws.send(JSON.stringify(obj), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
});



function tagDiscovery(tag) {

	// Stop Bluetooth discovering
	stop_discover();

	global.logging('discovered: ' + tag.address + ', type = ' + tag.type);
	global.sound('discover_sensortag');

	// connect me this tag
	connectAndSetUpMe();

	var watchDogFlag = true;

	tag.on('disconnect', function() {

		global.logging(tag.address + '(' + tag.type +') disconnected!');
		global.sound('sensortag_disconnected');

		// Remove Property
		delete device_info[tag.uuid];

		// Emit Disconnected Event
		global.events.emit('device_disconnect');

		// Resume scanning
	    start_discover();
	});


	function watchDog() {

		if(watchDogFlag) {

			global.logging('watchDog invoked, force disconnected');
			tag.disconnect();
		}
	}

	function connectAndSetUpMe() {			
    	
    	global.logging(tag.address + '(' + tag.type +') connectAndSetUp');
    	tag.connectAndSetUp(enableService);		

    	device_info[tag.uuid] = {
    		id        : tag.id,
    		uuid      : tag.uuid,
    		type	  : tag.type,
    		address   : tag.address,
    	};

    	global.logging('Device Info');
    	console.log(device_info[tag.uuid]);

    	// Set up watch dog
    	setTimeout(watchDog, timeoutVar);
    }

    function enableService(error) {		
		
		if ( error != undefined ) {
			console.error('ERROR connectAndSetUpMe!');
		}

		global.logging(tag.address + '(' + tag.type +') enableService');
		global.sound('enable_sensortag_services');

		// Emit connected Devent
		global.events.emit('device_connect');

		global._tag[tag.uuid] = tag;

		// Enable Service
    	tag.enableHumidity(function(){
    		tag.notifyHumidity();
    	});

    	tag.enableIrTemperature(function() {
    		tag.notifyIrTemperature();
    	});

    	tag.enableBarometricPressure(function() {
    		tag.notifyBarometricPressure();
    	});

    	// For BB8
    	tag.enableGyroscope(function() {
    		tag.notifyGyroscope();
    	});

    	tag.notifySimpleKey(listenForButton);

    	// Mark connected
    	watchDogFlag = false;

    	// Add count
    	connected_tag_count++;

    	if( connected_tag_count == expected_tag_count ) {
    		global.events.emit('tag_all_connected');
    	}

    	// Resume Scan
    	start_discover();
    }

    tag.on('gyroscopeChange', function(x, y, z) {
    	console.log()
    });

	// when you get a button change, print it out:
	function listenForButton() {

		tag.on('simpleKeyChange', function(left, right) {

			if (left) {
				global.logging(tag.address + '(' + tag.type +')> left: ' + left);
				global.run_cmd(DOC_ROOT + '/scripts/lock.sh', [], function(){});
			}

			if (right) {
				global.logging(tag.address + '(' + tag.type +')> right: ' + right);
				global.run_cmd(DOC_ROOT + '/scripts/unlock.sh', [], function(){});
			}

			// if both buttons are pressed, disconnect:
			if (left && right) {
				global.logging(tag.address + '(' + tag.type +')> Both BTN Pressed');
				tag.disconnect();
			}
	   });
	}

}

function start_discover() {

	if(scanning)
		return;

	scanning = true;
	global.logging('scanTimed: Start discovering');
	SensorTag.discover(tagDiscovery);
}

function stop_discover() {

	scanning = false;
	SensorTag.stopDiscoverAll(function(){});
	global.logging('stopTimed: Stop discovering');
}

// Start discovering
start_discover();

module.exports = router;
