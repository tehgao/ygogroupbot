var HTTPS = require('https');
var HTTP = require('http');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]);
      // botRegex = /^\/cool guy$/;

  requestRegex = /^\//;

  banlistRegex = /^\/banlist/i;
  priceRegex = /^\/price/i;

  if(request.text && requestRegex.test(request.text)) {
    this.res.writeHead(200);
    if(banlistRegex.test(request.text)) {
      postMessage(banlist());
    } else if (priceRegex.test(request.text)) {
      cardPrice(request.text.replace(/\/price\w*/i, ""));
    } else {
      // botResponse = "I'm sorry, I can't do that.";
    }
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function cardPrice(cardname) {
  var options = {
    host: 'http://yugiohprices.com',
    path: "/api/get_card_prices/".concat(cardname),
  };

  callback = function(response) {
    var str = '';

    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      var resp = str;

      var prices = JSON.parse(resp);

      output = "";

      if(prices.status == "success") {
        for(var i = 0; i < prices.data.length; i++) {
          var thisPrice = prices.data[i];

          output += cardname + "\n";
          output += thisPrice.name;
          output += " (" + thisPrice.print_tag + ") ";
          output += " Low: $" + thisPrice.prices.low + ", ";
          output += " Avg: $" + thisPrice.prices.average + ", ";
          output += " High: $" + thisPrice.prices.high + "\n";
        }
      } else {
        output = "Card not found!";
      }

      postMessage(output);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function banlist() {
  var cards = ["Pot of Greed", "Shapesnatch", "Thunder King Rai-Oh", "Sangan"];
  var reasons = ["because Konami.", "to balance out Hungry Burger OTK.", 
        "because it's inherently unfair.", "to sell the new Ice Barriers structure deck."];

  var random_card = cards[Math.floor((Math.random() * 100) % 4)];
  var random_amt = Math.floor((Math.random() * 100) % 4);
  var random_reason = reasons[Math.floor((Math.random() * 100) % 4)];

  var prediction = random_card.concat(" to ", random_amt, " ", random_reason);

  return prediction;
}

function postMessage(text) {
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