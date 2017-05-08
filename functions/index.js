const functions = require('firebase-functions');
const async = require('async');
const moment = require('moment-timezone');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendMessages = functions.https.onRequest((req, res) => {

  let time = moment().tz("America/Los_Angeles").format('HH');

  var ref = admin.database().ref('/scheduled_messages/daily/' + time);

  ref.on("value", function(snapshot) {

    let message_body = snapshot.val().message;
    let properties = snapshot.val().properties;

    console.log('Retrived body: ' + JSON.stringify(message_body));
    console.log('Retrived properties: ' + JSON.stringify(properties));

    //let new_id = ref.push().key();
    let payload = createPayload('1', message_body);

    try {
      let count = 0;
      let all_arr = [];
      async.whilst(
        function() { return count < properties.groups.length; },
        function(callback) {
            admin.database().ref('/messages/' + properties.groups[count]).push(payload).then(snapshot => {
              all_arr.push('/messages/' + properties.groups[count]);
              console.log('Sent message to: ' + '/messages/' + properties.groups[count]);
              count++;
              callback();
            });
        },
        function (err, n) {
          res.status(200).send({ done: true, sent_to: all_arr });
        }
      );
    } catch (e) {
      console.warn(e);
    }
  }, function (error) {
     console.log("Error: " + error.code);
  });
});

function createPayload(id, body) {
  var response = {
    created_at: moment().format('MMM D, YYYY HH:mm:ss'),
    id_number: id,
    user: {
      id: body.user.id,
      name: body.user.name
    },
    message: {
      content: body.content,
      content_type: body.content_type
    }
  };

  return response;
}