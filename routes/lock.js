var express = require('express');
var router = express.Router();

global.logging('Loading lock module');

// ------------------
// Lock 
// ------------------
router.get('/lock', function(req, res) {
  
    global.logging('GET /lock ip = '+ req.ip);

    global.run_cmd(DOC_ROOT + '/scripts/lock.sh', [], function(output) {
        res.send({status: 1});
    });
});

// ------------------
// Unlcok 
// ------------------
router.get('/unlock', function(req, res) {

    global.logging('GET /unlock ip = ' + req.ip);

    global.run_cmd(DOC_ROOT + '/scripts/unlock.sh', [], function(output) {
        res.send({status: 0});
    });
});

// ------------------
// Lock Status 
// ------------------
router.get('/status', function(req, res) {
  
    global.logging('GET /status ip = ' + req.ip);

    global.run_cmd(DOC_ROOT + '/scripts/status.sh', [], function(output) {
        var ret = parseInt(output.replace("\n", '').replace(" ", ""));
        logging('Lock Status = ' + ret);
        res.send({ lock: ret });
    });
});

module.exports = router;