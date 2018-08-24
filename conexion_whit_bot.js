var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();
var contexid = "";

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '43eff924-adbd-46e8-af77-d6ab1a45801f',
    password: process.env.CONVERSATION_PASSWORD || 'BL2T2AE1B5T7',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || 'workspaceId';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'EAAPoLgXZB2YABAH0vEZAsNVsfKiZAqwPWF0L0ZBRS2lEHAZAGzJ7JKu3YxsJfgDJzp3EDEZCTedIYxNGBZAhXZAngTiU6ZAWQQCRYNzeaZAhZCfcdBJ7AMQMZAZCl0XEu7Ihxm4HFjsfCvIozPQBTkzeANqqRM6ZA3DDI3fq0ZBhGPm1ZAw0DrJtofuOvTnJiPFXfRWd2VwZD') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error.');
});

app.post('/webhook/', function (req, res) {
	var text = null;

    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}

		var params = {
			input: text,
			// context: {"conversation_id": conversation_id}
			context:contexid
		}

		var payload = {
			workspace_id: "72e95306-e714-4a6b-8fd7-c29d915d98b5"
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
        res.status(200).send('EVENT_RECEIVED');
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
		 console.log(convResults);
		contexid = convResults.context;

        if (err) {
            return responseToRequest.send("Erro.");
        }

		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}

    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAAPoLgXZB2YABAH0vEZAsNVsfKiZAqwPWF0L0ZBRS2lEHAZAGzJ7JKu3YxsJfgDJzp3EDEZCTedIYxNGBZAhXZAngTiU6ZAWQQCRYNzeaZAhZCfcdBJ7AMQMZAZCl0XEu7Ihxm4HFjsfCvIozPQBTkzeANqqRM6ZA3DDI3fq0ZBhGPm1ZAw0DrJtofuOvTnJiPFXfRWd2VwZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
