const axios = require('axios');
let conf = require('./conf.json');
var twilio = require('twilio');
var client = new twilio(conf.twilio.account_sid, conf.twilio.auth_token);
let prevResults = {};
loopFunc();
let interval = setInterval(loopFunc, conf.frequency * 1000);
/**
 * Returns true when previous result is different from current result
 */
function compareResults(previous, current) {
    if(isEmpty(previous)) {
        return false
    } else if(isEmpty(current.patient.test_results)) {
        return false;
    } else return current.patient.test_results !== previous.patient.test_results;
}

/**
 * Returns true when obj is empty
 */
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/**
 * Function to be run to poll API for test result changes and send notification if changes exist
 */
function loopFunc() {
    axios.post(conf.apiURL, conf.api).then((res) => {
        if(res.data.hasOwnProperty('error')) {
            console.log("Server returned error: %O", res.data.error);
            process.exit();
        }
        console.log("Result update: %O", res.data.patient.test_results);
        if(compareResults(prevResults, res.data)) {
            console.log("New result found, sending text.")
            sendUpdateText();
        }
        prevResults = res.data;
    });
}

/**
 * Sends the notification
 */
function sendUpdateText() {
    client.messages.create({
        body: 'New results available from Lilly!',
        to: conf.twilio.to_number,
        from: conf.twilio.from_number
    }).then(message => {
        console.log("Update message sent!");
    });
}
