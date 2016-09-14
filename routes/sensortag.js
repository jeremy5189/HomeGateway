var express   = require('express'),
	router    = express.Router(),
	SensorTag = require('sensortag'),
	device_info = {},
	_tag		= null,
	_log_every  = false; 

global.logging('Loading sensortag module');

// listen for tags
SensorTag.discover(tagDiscovery);

// ------------------
// Get Record Photo
// ------------------
router.get('/info', function(req, res) {
	res.send(device_info);
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
	
	tag.on('disconnect', function() {

		global.logging('SensorTag disconnected!');

		// Restarting discovery
		SensorTag.discover(tagDiscovery);
	});

	function connectAndSetUpMe() {			// attempt to connect to the tag
    	
    	global.logging('SensorTag connectAndSetUp');
    	
    	tag.connectAndSetUp(enableService);		// when you connect and device is setup, call enableAccelMe
    	
    	device_info = {
    		id      : tag.id,
    		uuid    : tag.uuid,
    		type	: tag.type,
    		address : tag.address
    	};

    	global.logging('SensorTag Device Info');
    	console.log(device_info);
    }

    function enableService() {		// attempt to enable the accelerometer
		
		global.logging('SensorTag enableService');
		_tag = tag;

    	tag.enableHumidity(function(){
    		tag.notifyHumidity();
    	});

    	tag.enableIrTemperature(function() {
    		tag.notifyIrTemperature();
    	});

    	tag.notifySimpleKey(listenForButton);
    }

	// when you get a button change, print it out:
	function listenForButton() {
		tag.on('simpleKeyChange', function(left, right) {
			if (left) {
				global.logging('left: ' + left);
			}
			if (right) {
				global.logging('right: ' + right);
			}
			// if both buttons are pressed, disconnect:
			if (left && right) {
				tag.disconnect();
			}
	   });
	}

	// Now that you've defined all the functions, start the process:
	connectAndSetUpMe();
}

module.exports = router;