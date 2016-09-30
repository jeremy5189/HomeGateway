var express   = require('express'),
	router    = express.Router(),
	SensorTag = require('sensortag'),
	device_info  = {},
	_tag		 = null,
	_log_every   = false,
	device_connect  = false,
	time_to_connect = 7000;

global.logging('Loading sensortag module');

process.on('uncaughtException', function(err) {
	console.error('uncaughtException');
	console.error(err);
	process.exit(0);
});

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

// listen for tags
//SensorTag.discoverById('b0b448cffa81', tagDiscovery);
//SensorTag.discoverById('78a5041959b9', tagDiscovery);
SensorTag.discover(tagDiscovery);

// ------------------
// Get Record Photo
// ------------------
router.ws('/info', function(ws, req) {

	global.logging('WebSocket Info Opened!');
	
	device_info.status = _tag._peripheral.state;
	ws.send(JSON.stringify(device_info));

	_tag.on('disconnect', function() {
		device_info.status = 'disconnected';
		ws.send(JSON.stringify(device_info));
	});

});

// ------------------
// WebSocket Test
// ------------------
router.ws('/echo', function(ws, req) {
	ws.on('message', function(msg) {
		global.logging('WebSocket Echo');
    	ws.send(msg);
  	});
});

// ------------------------------------
// WebSocket Give 10 Test
// ------------------------------------
router.ws('/give', function(ws, req) {
	
	var i = 0;
	
	function give() {
		i++;
		ws.send('give');
		if( i < 10 ) {
			setTimeout(give, 1000);
		}
	}

	setTimeout(give, 1000);
});

// ------------------------------------
// WebSocket Humidity 
// ------------------------------------
router.ws('/humidity', function(ws, req) {

	global.logging('WebSocket humidity Open!');

	_tag.on('humidityChange', function (temperature, humidity) {

		if(_log_every) {
		   	global.logging('temperature = ' + temperature);
		   	global.logging('humidity = ' + humidity);
		}

	   	ws.send(JSON.stringify({
	   		temperature: temperature, 
	   		humidity: humidity
	   	}), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});
	});
	
});

// ------------------------------------
// WebSocket Pressure 
// ------------------------------------
router.ws('/barometricPressure', function(ws, req) {

	global.logging('WebSocket barometricPressureChange Open!');

	_tag.on('barometricPressureChange', function(pressure) {

		if(_log_every) {
			global.logging('pressure = ' + pressure);
		}

		ws.send(JSON.stringify({
			pressure: pressure
		}), function(error) {
	   		if(error && _log_every){
	   			console.error(error);
	   		}
	   	});

	});

});

// ------------------------------------
// WebSocket irTemperature 
// ------------------------------------
router.ws('/irTemperature', function(ws, req) {
	
	global.logging('WebSocket irTemperature Open!');

	_tag.on('irTemperatureChange', function (objectTemperature, ambientTemperature) {

		if(_log_every) {
	    	global.logging('objectTemperature = ' + objectTemperature);
	    	global.logging('ambientTemperature = ' + ambientTemperature);
	    }

	    ws.send(JSON.stringify({
	    	objectTemperature: objectTemperature, 
	    	ambientTemperature: ambientTemperature
	    }), function(error) {
	   		if(error && _log_every) {
	   			console.error(error);
	   		}
	   	});
	});

});


function tagDiscovery(tag) {

	global.sound('discover_sensortag');
	// Now that you've defined all the functions, start the process:
	connectAndSetUpMe();

	tag.on('disconnect', function() {

		global.logging('SensorTag disconnected!');
		global.sound('sensortag_disconnected');

		process.exit(0);
	});

	function connectAndSetUpMe() {			
    	
    	global.logging('SensorTag connectAndSetUp');
    	tag.connectAndSetUp(enableService);		

    	// Watch Dog
    	setTimeout(connectionWatchDog, time_to_connect);
    	
    	device_info = {
    		id      : tag.id,
    		uuid    : tag.uuid,
    		type	: tag.type,
    		address : tag.address
    	};

    	global.logging('SensorTag Device Info');
    	console.log(device_info);
    }

    function connectionWatchDog() {
    	if( device_connect == false ) {
    		global.logging('Watch Dog assume BLE connection Error, restart process');
    		process.exit(0);
    	}
    }

    function enableService(error) {		
		
		if ( error != undefined ) {
			console.error('ERROR connectAndSetUpMe!');
		}

		global.logging('SensorTag enableService');
		global.sound('enable_sensortag_services');
		_tag = tag;
		device_connect = true;

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
    }

	// when you get a button change, print it out:
	function listenForButton() {
		tag.on('simpleKeyChange', function(left, right) {
			if (left) {
				global.logging('left: ' + left);
				global.run_cmd(DOC_ROOT + '/scripts/lock.sh', [], function(){});
			}
			if (right) {
				global.logging('right: ' + right);
				global.run_cmd(DOC_ROOT + '/scripts/unlock.sh', [], function(){});
			}
			// if both buttons are pressed, disconnect:
			if (left && right) {
				tag.disconnect();
				global.logging('Both BTN Pressed');
			}
	   });
	}

}

module.exports = router;
