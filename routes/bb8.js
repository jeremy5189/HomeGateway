'use strict';

var express   = require('express'),
	router    = express.Router(),
	sphero = require("sphero"),
    bb8    = sphero("e146c3a8db364a6c9ff2ae739401ddd8");


global.events.on('tag_all_connected', function() {

	
	
	global.logging('tag_all_connected event invoked');

	bb8.connect(function() {

		global.logging('bb8 connected');
		
	});
});


module.exports = router;