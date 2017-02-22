var HTTPS = require('https');
var HTTP = require('http');
var cool = require('cool-ascii-faces');
var fs = require('fs');

var botID = process.env.BOT_ID;

function respond(request, res, callback) {
  var requestRegex = /^\//;

  var banlistRegex = /^\/banlist/i;
  var bannedRegex = /^\/banned/i;
  var priceRegex = /^\/price/i;
  var deckRegex = /^\/deck/i;
  var potOfGreed = /^what does pot of greed do/i;
  var memeRegex = /^\/meme/i;
  var infoRegex = /^\/card/i;

  if(request.text && requestRegex.test(request.text)) {
    if(banlistRegex.test(request.text)) {
      callback(banlist(), res);
    } else if (priceRegex.test(request.text)) {
      cardPrice(request.text.replace(/\/price */i, ""), res, callback);
    } else if(deckRegex.test(request.text)) {
      callback(deckMix(), res);
    } else if(memeRegex.test(request.text)) {
		  callback(dankMeme(), res);
    } else if(infoRegex.test(request.text)) {
      cardInfo(request.text.replace(/\/card */i, ""), res, callback);
    } else if(bannedRegex.test(request.text)) {
      isBanned(request.text.replace(/\/banned */i, ""), res, callback);
    } else {
      // botResponse = "I'm sorry, I can't do that.";
    }
  } else if(request.text && potOfGreed.test(request.text)) {
    callback("I ACTIVATE POT OF GREED! IT ALLOWS ME TO ADD TWO CARDS FROM MY DECK TO MY HAND.", res);
  } else {
    console.log("don't care");
    callback("", res);
  }
}

function isBanned(query, callback) {
  var tabletojson = require('tabletojson');
  var url = 'http://www.yugioh-card.com/en/limited/';
  tabletojson.convertUrl(url, function(tablesAsJson) {
    var response = '';

    var forbidden = tablesAsJson[1];
    var limited = tablesAsJson[2];
    var semi = tablesAsJson[3];

    var name = "";
    var status = "";

    var found = 0;
    for(i = 0; i < forbidden.length && found == 0; i++) {
        if(forbidden[i][1].toLowerCase().indexOf(query.toLowerCase()) > -1) {
            name = forbidden[i][1];
            status = "forbidden";
            found = 1;
        }
    }

    for(i = 0; i < limited.length && found == 0; i++) {
        if(limited[i][1].toLowerCase().indexOf(query.toLowerCase()) > -1) {
            name = limited[i][1];
            status = "limited";
            found = 1;
        }
    }

    for(i = 0; i < semi.length && found == 0; i++) {
        if(semi[i][1].toLowerCase().indexOf(query.toLowerCase()) > -1) {
            name = semi[i][1];
            status = "semi-limited";
            found = 1;
        }
    }

    if(found == 1) {
      response = name.concat(' is ').concat(status).concat('.');
    } else {
      response = "Not on list!";
    }

    callback(response);
  });
}

function cardPrice(cardname, res, callback) {
  // regex to match strings formatted like print tags, i.e. SDK-001, CROS-EN050
  var printTagRegex = /[0-9a-zA-Z]{3,4}-([a-zA-Z]{2})?\d+/;

  if(printTagRegex.test(cardname)) {
    cardPriceByPrintTag(cardname, res, callback);
  } else {
    cardPriceByName(cardname, res, callback);
  }
}

function cardPriceByPrintTag(cardname, res, sendToApp) {
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

      sendToApp(output, res);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function cardPriceByName(cardname, res, sendToApp) {
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

        if(prices.data.length > 3) {
          output += "(More...)";
        }
      } else {
        output = "Card not found!";
      }
      sendToApp(output, res);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function cardInfo(cardName, res, sendToApp) {
  var options = {
    host: 'yugiohprices.com',
    path: "/api/card_data/".concat(cardName),
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

      if(info.status == "success") {
        var data = info.data;

        output += data.name + "\n";
        if(data.card_type == "monster") {
          output += "Level/Rank " + data.level + " " + toTitleCase(data.family) + "\n";
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

      sendToApp(output, res);
    });
  }

  HTTP.get(options, callback).on('error', function(e) {
    console.log("Error: ", e);
  });
}

function banlist() {
  var cards = [
    "Pot of Greed",
    "Sangan",
    "Every card printed in Starter Deck Joey",
    "Jerry Beans Man",
    "DANKO SWAGGA",
    "MY PERFECTLY ULTIMATE GREAT MOTH",
    "Man-Eater Bug",
    "Trishula",
    "Ojama Blue",
    "Raigeki",
    "Solemn Strike",
    "Elemental HERO Stratos",
    "Construct",
    "Dark Law",
    "Gate Guardian",
    "Every card, except \"Frog the Jam\"",
    "Literally every single card ever",
    "Ratpier",
    "Pot of Gre-- I mean Desires",
    "Maxx C",
    "Heavy Storm",
    "Painful Choice",
    "Literally all commons"
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
    "to balance the meta",
    "because Trump complained about it",
    "because synchros ruined the game",
    "because it's they didn't want to recycle the same list",
    "to spice up the meta"
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

// stackoverflow ftw
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

exports.respond = respond;
exports.banlist = banlist;
