var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      // botRegex = /^\/cool guy$/;

      banlistRegex = /^Banlist\?$/;

  if(request.text && banlistRegex.test(request.text)) {
    this.res.writeHead(200);
    postMessage();
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function banlist() {
  var cards = ["Pot of Greed", "Shapesnatch", "Thunder King Rai-Oh", "Sangan"];
  var reasons = ["because Konami.", "to balance out Hungry Burger OTK.", 
        "because it's inherently unfair.", "to sell the new Ice Barriers structure deck."];

  var random_card = cards[Math.floor((Math.random() * 10) % 4)];
  var random_amt = Math.floor((Math.random() * 10) % 4);
  var random_reason = reasons[Math.floor((Math.random() * 10) % 4)];

  var prediction = random_card.concat(" to ", random_amt, random_reason);

  return prediction;
}

function postMessage() {
  var botResponse, options, body, botReq;

  botResponse = banlist();

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

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
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


exports.respond = respond;