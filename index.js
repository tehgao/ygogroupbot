var http, https, director, cool, bot, router, server, port;

http        = require('http');
https       = require('https');
director    = require('director');
cool        = require('cool-ascii-faces');
bot         = require('./bot.js');

var twilio = require('twilio');
var qs = require('querystring');
var botID = process.env.BOT_ID;

router = new director.http.Router({
  '/' : {
    post: groupme,
    get: ping
  },

  '/sms' : {
    post: sms,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("\<html\>\<head\>\<link rel=\"stylesheet\" type=\"text/css\" href=\"css/style.css\"\>\<title\>Banlist Predictions\</title\>\</head\>\<body\>\<p align=\"center\"\>\<h1\>"
    + bot.banlist() + "\</h1\>\</p\>\</body\>\</html\>");
}

function respondToTwilio(text, res) {
  myres = res;

  var twilio = require('twilio');
  var twiml = new twilio.TwimlResponse();

  twiml.message(text);
  myres.writeHead(200, {'Content-Type': 'text/xml'});
  myres.end(twiml.toString());
}

function respondToGroupMe(text, res) {
  var botResponse, options, body, botReq;

  botResponse = text;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = https.request(options, function(r) {
      if(r.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + r.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


function sms() {
  var request = qs.parse(this.req.chunks[0]);
  request.text = request.Body;
  bot.respond('/' + request, this.res, respondToTwilio);
}

function groupme() {
  var request = JSON.parse(this.req.chunks[0]);
  bot.respond(request, this.res, respondToGroupMe);
}
