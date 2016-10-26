var unirest = require('unirest');
var config  = require('./config');

/*unirest.post("http://localhost:8000/api/notify/manager")
.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
.send({
    uuid  : 'ysredutfiygouhij',
    'if'    : 'temp',
    opr   : '=',
    value : '87'
}).end(function (response) {
    console.log(response);
    console.log(response.body);
});*/

unirest.post("http://localhost:8000/api/notify/manager")
.headers({'Content-Type': 'multipart/form-data'})
.field({
    uuid  : 'ysredutfiygouhij',
    'if'  : 'temp',
    opr   : '=',
    value : '87'
}) // Form field
.attach('photo', '/Users/jeremy/Pictures/test.jpg') // Attachment
.end(function (response) {
    console.log(response);
    console.log(response.body);
});
