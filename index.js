var http, director, cool, bot, router, server, port;

http        = require('http');
director    = require('director');
cool        = require('cool-ascii-faces');
bot         = require('./bot.js');

var twilio = require('twilio');
var qs = require('querystring');

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

  var request = qs.parse(this.req.chunks[0]);
  var reqBody = request.Body;

  if(/^\/price/i.test(reqBody)) {
    var cardname = reqBody.replace(/\/price */i, "");

    var options = {
      host: 'yugiohprices.com',
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

        console.log(str);

        if(prices.status == "success") {
          output += cardname + "\n";
          for(var i = 0; i < prices.data.length && i < 3; i++) {
            var thisPrice = prices.data[i];

            output += thisPrice.print_tag + ": ";

            // console.log(thisPrice.price_data.data);
            if(thisPrice.price_data.status == "success") {
              output += "Low: $" + thisPrice.price_data.data.prices.low.toFixed(2) + ", ";
              output += " Avg: $" + thisPrice.price_data.data.prices.average.toFixed(2) + ", ";
              output += " High: $" + thisPrice.price_data.data.prices.high.toFixed(2) + "\n";
              output += "Shift: " + (thisPrice.price_data.data.prices.shift_21 * 100).toFixed(2);
            } else {
              output += "Could not find prices!";
            }
            output += "\n";
          }
        } else {
          output = "Card not found!";
        }

        if(prices.data.length > 3) {
          output += "(More...)";
        }

        twiml.message(output);
        this.res.writeHead(200, {'Content-Type': 'text/xml'});
        this.res.end(twiml.toString());
      });
    }

    HTTP.get(options, callback).on('error', function(e) {
      console.log("Error: ", e);
    });
  }

}
