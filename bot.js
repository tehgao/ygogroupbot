var HTTPS = require('https');
var HTTP = require('http');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]);
      // botRegex = /^\/cool guy$/;

  var requestRegex = /^\//;

  var banlistRegex = /^\/banlist/i;
  var priceRegex = /^\/price/i;
  var deckRegex = /^\/deck/i;
  var potOfGreed = /^what does pot of greed do/i;

  if(request.text && requestRegex.test(request.text)) {
    this.res.writeHead(200);
    if(banlistRegex.test(request.text)) {
      postMessage(banlist());
    } else if (priceRegex.test(request.text)) {
      cardPrice(request.text.replace(/\/price\w*/i, ""));
    } else if(deckRegex.test(request.text)) {
      postMessage(deckMix());
    } else {
      // botResponse = "I'm sorry, I can't do that.";
    }
    this.res.end();
  } else if(request.text && potOfGreed.test(request.text)) {
    this.res.writeHead(200);
    postMessage("I ACTIVATE POT OF GREED! IT ALLOWS ME TO ADD TWO CARDS FROM MY DECK TO MY HAND.");
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function cardPrice(cardname) {
  // regex to match strings formatted like print tags, i.e. SDK-001, CROS-EN050
  var printTagRegex = /[0-9a-zA-Z]{3,4}-([a-zA-Z]{2})?\d+/;

  if(printTagRegex.test(cardname)) {
    cardPriceByPrintTag(cardname);
  } else {
    cardPriceByName(cardname);
  }
}

function cardPriceByPrintTag(cardname) {
 var options = {
    host: 'yugiohprices.com',
    path: "/api/price_for_print_tag/".concat(cardname.replace(/[^a-zA-Z0-9-]/,"")),
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
        output += prices.data.name + "\n";

        var thisPrice = prices.data.price_data;
        output += thisPrice.rarity + "\n";
        output += " Low: $" + thisPrice.price_data.data.prices.low + ", ";
        output += " Avg: $" + thisPrice.price_data.data.prices.average + ", ";
        output += " High: $" + thisPrice.price_data.data.prices.high;

        output += "\n";
      } else {
        output = "Print Tag not found!";
      }

      postMessage(output);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function cardPriceByName(cardname) {
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
          output += " Low: $" + thisPrice.price_data.data.prices.low + ", ";
          output += " Avg: $" + thisPrice.price_data.data.prices.average + ", ";
          output += " High: $" + thisPrice.price_data.data.prices.high;

          output += "\n";
        }
      } else {
        output = "Card not found!";
      }

      if(prices.data.length > 3) {
        output += "(More...)";
      }

      postMessage(output);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function banlist() {
  var cards = [
    "Pot of Greed", 
    "Shapesnatch", 
    "Thunder King Rai-Oh", 
    "Sangan",
    "Every card printed in Starter Deck Joey",
    "Jerry Beans Man",
    "Deskbot 009",
    "DANKO SWAGGA",
    "MY PERFECTLY ULTIMATE GREAT MOTH",
    "Man-Eater Bug",
    "Ignister",
    "Trishula",
    "Ojama Blue",
    "Raigeki",
    "Solemn Strike"
  ];
  var reasons = [
    "because Konami", 
    "to balance out Hungry Burger OTK", 
    "because it's inherently unfair", 
    "to sell the new Ice Barriers structure deck",
    "because of the potential interactions with Jerry Beans Man",
    "because Konami learned their lesson with Dragon Rulers",
    "because it's stupid OP",
    "because it was degenerate and allowed too many FTKs",
    "because Jeff Jones topped with it",
    "because it just got reprinted",
    "because Konami hates fun",
    "to push the Pendulum agenda",
    "because.",
    "in case Konami wants to unban the dragon rulers",
    "for \"balance\"",
    "because $$$",
    "to balance the secondary market"
  ];

  var random_card = cards[Math.floor(Math.random()*cards.length)];
  var random_amt = Math.floor((Math.random() * 100) % 4);
  var random_reason = reasons[Math.floor(Math.random()*reasons.length)];

  var prediction = random_card.concat(" to ", random_amt, " ", random_reason);

  return prediction;
}

function deckMix() {
  var archetypes = [
    "Ojama",
    "Ice Barrier"
    "Deskbot",
    "Fire Fist",
    "Geargia",
    "Stick Chair",
    "Traptrix",
    "Artifact",
    "Shaddoll",
    "HERO",
    "Nekroz",
    "Red-Eyes",
    "Hieratic",
    "Dark World",
    "Fluffal",
    "Atlantean",
    "BLS",
    "Lightsworn"
  ];

  var prefix = [
    "Anti-Meta",
    "Rank-Up"
  ];

  var suffix = [
    "Turbo",
    "Beatdown",
    "Synchro Spam",
    "OTK",
    "Control"
  ];

  var numArchetypes = 2 + Math.floor(Math.random() * 3);

  var deck = [];

  while(deck.length < numArchetypes) {
    var thisArch = archetypes[Math.floor(Math.random() * archetypes.length())];
    if(!listContains(deck, thisArch)) {
      deck.push(thisArch);
    }
  }

  var deckText = "You should play ";

  if((Math.random() * 100) % 3) {
    deckText += prefix[Math.floor(Math.random() * prefix.length())] + " ";
  }

  for(var i = 0; i < deck.length; i++) {
    deckText += " " + deck[i] + " ";
  }

  if((Math.random() * 100) % 3) {
    deckText += suffix[Math.floor(Math.random() * suffix.length())];
  }

  return deckText;
}

function listContains(list, string) {
  for(var i = 1; i < list.length; i++) {
    if(list[i] == string) {
      return true;
    }
  }

  return false;
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