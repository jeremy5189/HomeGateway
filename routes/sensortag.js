'use strict';

var async = require('async'),
	express   = require('express'),
	router    = express.Router(),
	SensorTag = require('sensortag'),
	util	  = require('util'),
	device_info  = {},
	_tag		 = {},
	_log_every   = false,
	time_to_connect = 7000;

var EventEmitter = require('events').EventEmitter,
	events		 = new EventEmitter();

// Duplicates allowed -> Reconnect possible
SensorTag.SCAN_DUPLICATES = true;

// Timeout Variables
// Discovering is limited to timeoutVar
var timeoutVar = 60000;
var timeoutHandle;
var timeoutCleared = true;

// Handle Exception
/*
process.on('uncaughtException', function(err) {
	console.error('uncaughtException');
	console.error(err);
	process.exit(0);
});*/

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
	ws.send(JSON.stringify(device_info));

	events.on('device_disconnect', function() {
		ws.send(JSON.stringify(device_info));
	});

	events.on('device_connect', function() {
		ws.send(JSON.stringify(device_info));
	});
});


// ------------------------------------
// WebSocket Humidity 
// ------------------------------------
router.ws('/humidity/:uuid', function(ws, req) {

	var uuid = req.params.uuid;

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// humidity/' + uuid);

	_tag[uuid].on('humidityChange', function (temperature, humidity) {

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

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// barometricPressure/' + uuid);

	_tag[uuid].on('barometricPressureChange', function(pressure) {

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

	if( uuid == undefined || _tag[uuid] == undefined ) {
		global.logging('Device uuid not defined or not found');
		ws.close(); // Cloase Connection
	}

	global.logging('ws:// irTemperature/' + uuid);

	_tag[uuid].on('irTemperatureChange', function (objectTemperature, ambientTemperature) {

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
	stopTimed();

	global.logging('discovered: ' + tag.address + ', type = ' + tag.type);
	global.sound('discover_sensortag');

	// connect me this tag
	connectAndSetUpMe();

	tag.on('disconnect', function() {

		global.logging(tag.address + '(' + tag.type +') disconnected!');
		global.sound('sensortag_disconnected');

		// Remove Property
		delete device_info[tag.uuid];

		// Emit Disconnected Event
		events.emit('device_disconnect');

		// Resume scanning or wait
	    if (timeoutCleared) {
	      scanTimed();
	    }
	});

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
    }

    function enableService(error) {		
		
		if ( error != undefined ) {
			console.error('ERROR connectAndSetUpMe!');
		}

		global.logging(tag.address + '(' + tag.type +') enableService');
		global.sound('enable_sensortag_services');

		// Emit connected Devent
		events.emit('device_connect');

		_tag[tag.uuid] = tag;

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

    	tag.notifySimpleKey(listenForButton);

    	// Resume Scan
    	scanTimed();
    }

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

function scanTimed() {
	global.logging('scanTimed: Start discovering');
	timeoutCleared = false;
	SensorTag.discover(tagDiscovery);
	timeoutHandle = setTimeout(function() {
		stopTimed();
	}, timeoutVar);
}

function stopTimed() {
	SensorTag.stopDiscoverAll(function(){});
	timeoutCleared = true;
	console.log('stopTimed: Stop discovering');
	clearTimeout(timeoutHandle);
}

// Start discovering
scanTimed();

module.exports = router;
