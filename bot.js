var HTTPS = require('https');
var HTTP = require('http');
var cool = require('cool-ascii-faces');
var fs = require('fs');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]);
      // botRegex = /^\/cool guy$/;

  var requestRegex = /^\//;

  var banlistRegex = /^\/banlist/i;
  var priceRegex = /^\/price/i;
  var deckRegex = /^\/deck/i;
  var potOfGreed = /^what does pot of greed do/i;
  var memeRegex = /^\/meme/i;
  var infoRegex = /^\/card/i;

  if(request.text && requestRegex.test(request.text)) {
    this.res.writeHead(200);
    if(banlistRegex.test(request.text)) {
      postMessage(banlist());
    } else if (priceRegex.test(request.text)) {
      cardPrice(request.text.replace(/\/price\w*/i, ""));
    } else if(deckRegex.test(request.text)) {
      postMessage(deckMix());
    } else if(memeRegex.test(request.text)) {
		  postMessage(dankMeme());
    } else if(infoRegex.test(request.text)) {
      cardInfo(request.text.replace(/\/card\w*/i, ""));
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
        output += " Low: $" + thisPrice.price_data.data.prices.low.toFixed(2) + ", ";
        output += " Avg: $" + thisPrice.price_data.data.prices.average.toFixed(2) + ", ";
        output += " High: $" + thisPrice.price_data.data.prices.high.toFixed(2) + "\n";
        output += "Shift: " + (thisPrice.price_data.data.prices.shift_21 * 100).toFixed(2);
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

      postMessage(output);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function cardInfo(cardName) {

  console.log(toTitleCase(cardName));

  var options = {
    host: 'yugiohprices.com',
    path: "/api/card_data/".concat(toTitleCase(cardName)),
  };

  callback = function(response) {
    var str = '';

    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      var resp = str;

      var info = JSON.parse(resp);

      output = "";

      console.log(str);

      if(info.status == "success") {
        var data = info.data;

        output += data.name + "\n";
        if(data.card_type == "monster") {
          output += "Level " + data.level + " " + toTitleCase(data.family) + "\n";
          output += data.type + "\n";
        } else {
          if(!!data.property) {
            output += data.property + " ";
          }

          output += toTitleCase(data.card_type) + " Card\n";
        }

        output += data.text + "\n";

        if(data.card_type == "monster") {
          output += "ATK/" + data.atk + " DEF/" + data.def + "\n";
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
    "Solemn Strike",
    "Exciton",
    "Elemental HERO Stratos",
    "Construct",
    "Ulti-Cannahawk",
    "Dark Law",
    "Gate Guardian",
    "Every card, except \"Frog the Jam\"",
    "Literally every single card ever"
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
    "to balance the secondary market",
    "because it literally gave people cancer",
    "so the player base would stop complaining",
    "because #YOLO",
    "because why not?",
    "to encourage format diversity",
    "to balance the meta"
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
    "Ice Barrier",
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
    "Lightsworn",
    "Airblade",
    "Chaos",
    "Exodia",
    "Monarch",
    "Explosion"
  ];

  var prefix = [
    "Anti-Meta",
    "Rank-Up",
    "Budget"
  ];

  var suffix = [
    "Turbo",
    "Beatdown",
    "Synchro Spam",
    "OTK",
    "FTK",
    "Control"
  ];

  var phrases = [
    ["Jeff Jones just topped an ARG with", ""],
    ["[R/F] my", "deck for competitive locals/regionals/YCS/Nats/Worlds"],
    ["I really think", "is gonna be good next format."],
    ["Hey, Spoofy here, doing a deck profile on", ""],
    ["", "is going to be good post-BOSH"],
    ["I was on tilt after I got knocked around by Ojamas, but getting 2-0'd by", 
      "made me sell my deck"],
    ["I'm totally playing", "next format."]
  ];

  var numArchetypes = 2 + Math.floor(Math.random() * 3);

  var deck = [];

  while(deck.length < numArchetypes) {
    var thisArch = archetypes[Math.floor(Math.random() * archetypes.length)];
    if(!listContains(deck, thisArch)) {
      deck.push(thisArch);
    }
  }

  var thisPhrase = phrases[Math.floor(Math.random() * phrases.length)];

  var deckText = thisPhrase[0];

  if((Math.floor(Math.random() * 100) % 3) == 0) {
    deckText += " " + prefix[Math.floor(Math.random() * prefix.length)];
  }

  for(var i = 0; i < deck.length; i++) {
    deckText += " " + deck[i];
  }

  deckText += " " + suffix[Math.floor(Math.random() * suffix.length)] + " " + thisPhrase[1];

  return deckText;
}

function dankMeme() {
	var meme_prefix = [
		"Gnome Child",
		"DESKMEN",
		"Jeff Jones",
		"Upstart Hoban",
		"Noah Greene"
	];
	
	var meme_suffix = [
		"will enlighten you.",
		"has topped yet another ARG event.",
		"went x-0 with Magical Explosion FTK.",
		"went +10 turn one.",
		"is literally cancer."
	];
	
	var random_prefix = meme_prefix[Math.floor(Math.random() * meme_prefix.length)];
	var random_suffix = meme_suffix[Math.floor(Math.random() * meme_suffix.length)];
	
	var dank_meme = random_prefix.concat(" ", random_suffix);
	
	return dank_meme;
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

// stackoverflow ftw
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

exports.respond = respond;
exports.banlist = banlist;