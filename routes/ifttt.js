'use strict';

var express     = require('express'),
    mysql       = require('mysql'),
    router      = express.Router(),
    config      = require('../config');

var database = mysql.createConnection({
    host     : config.db.host,
    user     : config.db.user,
    password : config.db.pass,
    database : config.db.database
});

database.connect();

router.get('/test', function(req, res) {
    database.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
      if (err) throw err;
      res.send('1 + 1 = ' + rows[0].solution);
    });
});

router.get('/list', function(req, res) {
    get_conditions(function(resp) {
        res.send(resp);
    });
});

global.logging('Loading ifttt module');

// Loop forever
setInterval(ifttt_watcher, config.ifttt_sleep_sec);

function ifttt_watcher() {

    /*
    humidity.temperature
    humidity.humidity
    barometricPressure.pressure
    irTemperature.objectTemperature
    irTemperature.ambientTemperature
    */

    get_conditions(process_condition);

    function process_condition(conditions) {
        for( var index in conditions ) {

            var event = conditions[index].if.split('.')[0],
                attr  = conditions[index].if.split('.')[1],
                uuid  = conditions[index].uuid;

            global.logging('IFTTT: Got event: ' + event + ' attr: ' + attr);

            if( global.ifttt_data[uuid] != undefined ) {

                console.log('IFTTT: if ' + global.ifttt_data[uuid][attr] + ' ' +
                            conditions[index].opr + ' ' + conditions[index].value +
                            ' then ' + conditions[index].then);

                switch (conditions[index].opr) {
                    case '>':
                        if( global.ifttt_data[uuid][attr] > conditions[index].value )
                            invoke_then(conditions[index]);
                        break;
                    case '<':
                        if( global.ifttt_data[uuid][attr] < conditions[index].value )
                            invoke_then(conditions[index]);
                        break;
                    case '=':
                        if( global.ifttt_data[uuid][attr] = conditions[index].value )
                            invoke_then(conditions[index]);
                        break;
                    case '>=':
                        if( global.ifttt_data[uuid][attr] >= conditions[index].value )
                            invoke_then(conditions[index]);
                        break;
                    case '<=':
                        if( global.ifttt_data[uuid][attr] <= conditions[index].value )
                            invoke_then(conditions[index]);
                        break;
                }

            } else {
                global.logging('IFTTT tag ' + uuid + ' not connected');
            }
        }
    }

    function invoke_then(obj) {

        global.logging('IFTTT invoke_then: ' + obj.then);

        switch (obj.then) {
            case 'email':
                email(obj);
                break;
            case 'speaker':
                speaker(obj);
                break;
            case 'open_door':
                open_door();
                break;
            case 'email_photo':
                email_photo(obj);
                break;
            default:
                break;
        }
    }

    function email(obj) {

        var unirest = require('unirest');

        unirest.post(config.email_api)
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
        .send(obj)
        .end(function (response) {
            global.logging('unirest status: ' + response.status);
        });
    }

    function speaker(obj) {
        var target = obj.if.split('.')[1];
        global.run_cmd('aplay', [config.doc_root + '/sound/alert/' + target + '.wav']);
    }

    function open_door() {
        global.run_cmd(config.doc_root  + '/scripts/unlock.sh', [], function(output) {
            setTimeout(function() {
                global.run_cmd(config.doc_root  + '/scripts/lock.sh', [], function(output) {

                });
            }, 3000);
        });
    }

    function email_photo(obj) {

        var unirest = require('unirest');

        var fn, ts = (new Date().getTime());
        fn = '/tmp/' + ts + '.jpg';

        global.logging('Photo fn = ' + fn);
        global.run_cmd('raspistill', [
            '-o',
            fn,
            '-w',
            '800',
            '-h',
            '600',
    	    '-hf',
            '-n'
        ], function() {
            unirest.post(config.email_api)
            .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
            .send(obj)
            .attach(fn)
            .end(function (response) {
                global.logging('unirest status: ' + response.status);
            });
        });
    }
}

function get_conditions(callback) {
    database.query('SELECT * FROM ifttt ORDER BY id', function(err, rows, fields) {
      if (err) throw err;
      callback(rows);
    });
}

module.exports = router;
