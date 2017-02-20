var http, director, cool, bot, router, server, port;

http        = require('http');
director    = require('director');
cool        = require('cool-ascii-faces');
bot         = require('./bot.js');

var twilio = require('twilio');

router = new director.http.Router({
  '/' : {
    post: bot.respond,
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

function sms() {
  var twilio = require('twilio');
  var twiml = new twilio.TwimlResponse();

  var request = JSON.parse(this.req);

  console.log(request.text);
  twiml.message('The Robots are coming! Head for the hills!');
  this.res.writeHead(200, {'Content-Type': 'text/xml'});
  this.res.end(twiml.toString());
}
