'use strict';
var async = require('async');
var SensorTag = require('sensortag');

// Timeout Variables
// Discovering is limited to timeoutVar
var timeoutVar = 60000;
var timeoutID;
var timeoutCleared = true;

// Duplicates allowed -> Reconnect possible
SensorTag.SCAN_DUPLICATES = true;

// For each discovered Tag
function onDiscover(sensorTag) {

  console.log('discovered: ' + sensorTag.uuid + ', type = ' + sensorTag.type);
  stopTimed();

  sensorTag.once('disconnect', function () {
    console.log('Disconnected.');

    if (timeoutCleared) {
      scanTimed();
    }
  });

  sensorTag.connectAndSetup(function () {
    console.log('Connect and setup');
    sensorTag.readDeviceName(function (error, deviceName) {
      console.log('\tDevice Name = ' + deviceName);
      console.log('\tType = ' + sensorTag.type);
      console.log('\tUUID = ' + sensorTag.uuid);
    });
    sensorTag.enableIrTemperature(function() {
    	sensorTag.notifyIrTemperature();
    });
    sensorTag.on('irTemperatureChange', function (objectTemperature, ambientTemperature) {
	   console.log(sensorTag.type + ' objectTemperature = ' + objectTemperature);
	   console.log(sensorTag.type + ' ambientTemperature = ' + ambientTemperature);
    });
    scanTimed();
  });
}

// Start timed discovering
function scanTimed() {
  console.log('Start discovering');
  timeoutCleared = false;
  SensorTag.discoverAll(onDiscover);
  timeoutID = setTimeout(function () {
    stopTimed();
  }, timeoutVar);
}

// Stop timer and discovering
function stopTimed() {
  SensorTag.stopDiscoverAll(onDiscover);
  timeoutCleared = true;
  console.log('Stop discovering');
  clearTimeout(timeoutID);
}

// Start discovering
scanTimed();
