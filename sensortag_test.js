/*
	sensorTag Accelerometer example

	This example uses Sandeep Mistry's sensortag library for node.js to
	read data from a TI sensorTag.

	Although the sensortag library functions are all asynchronous,
	there is a sequence you need to follow in order to successfully
	read a tag:
		1) discover the tag
		2) connect to and set up the tag
		3) turn on the sensor you want to use (in this case, accelerometer)
		4) turn on notifications for the sensor
		5) listen for changes from the sensortag

	This example does all of those steps in sequence by having each function
	call the next as a callback. Discover calls connectAndSetUp, and so forth.

	This example is heavily indebted to Sandeep's test for the library, but
	achieves more or less the same thing without using the async library.

	created 15 Jan 2014
	by Tom Igoe
*/


var SensorTag = require('sensortag');		// sensortag library

function run_cmd(cmd, args, callBack) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var resp = "";
    console.log(args);
    child.stdout.on('data', function (buffer) { resp += buffer.toString() });
    child.stdout.on('end', function() { callBack (resp) });
}

// listen for tags:
SensorTag.discover(function(tag) {
	
	// when you disconnect from a tag, exit the program:
	tag.on('disconnect', function() {
		//console.log('disconnected!');
		process.exit(0);
	});

	function connectAndSetUpMe() {			// attempt to connect to the tag
    	//console.log('connectAndSetUp');
    	console.log(tag);
    	tag.connectAndSetUp(enableService);		// when you connect and device is setup, call enableAccelMe
    	//console.log('TAG UUID = ' + tag.uuid);
    	//console.log('TAG ADDRESS = ' + tag.address);
    }

    function enableService() {		// attempt to enable the accelerometer
		//console.log('enableService');
    	// when you enable the accelerometer, start accelerometer notifications:
    	//tag.enableAccelerometer(notifyMe);
    	//tag.enableHumidity(function(){
    	//	tag.notifyHumidity(listenForHumidity);
    	//});

    	tag.enableIrTemperature(function() {
    		tag.notifyIrTemperature(listenForIrTemperature);
    	});

    	tag.notifySimpleKey(listenForButton);
    }

    function listenForIrTemperature() {
    	tag.on('irTemperatureChange', function(objectTemperature, ambientTemperature) {
    		console.log(objectTemperature);
    		//console.log('ambientTemperature = ' + ambientTemperature);
    	});
    }


    function listenForHumidity() {
   		tag.on('humidityChange', function(temperature, humidity) {
   			console.log('temperature = %d', temperature);
   			console.log('humidity = %d', humidity);
   		});
    }

    // When you get an accelermeter change, print it out:
	function listenForAcc() {
		tag.on('accelerometerChange', function(x, y, z) {
	     console.log('\tx = %d G', x.toFixed(1));
	     console.log('\ty = %d G', y.toFixed(1));
	     console.log('\tz = %d G', z.toFixed(1));
	   });
	}

	// when you get a button change, print it out:
	function listenForButton() {
		tag.on('simpleKeyChange', function(left, right) {
			if (left) {
				console.log('left: ' + left);
				run_cmd('gpio', ['write', '7', '1'], function() {});
			}
			if (right) {
				console.log('right: ' + right);
				run_cmd('gpio', ['write', '7', '0'], function() {});
			}
			// if both buttons are pressed, disconnect:
			if (left && right) {
				tag.disconnect();
			}
	   });
	}

	// Now that you've defined all the functions, start the process:
	connectAndSetUpMe();
});