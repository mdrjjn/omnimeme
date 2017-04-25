//Connecting to Telegram
var TelegramBot = require('node-telegram-bot-api');
var token =/*insert your telegram bot token here. Better yet, use an environment variable*/;
var bot = new TelegramBot(token, {polling: true});

//Requiring graphic magick
var fs = require('fs')//this is a file managment system I use to delete files.
  , gm = require('gm').subClass({imageMagick: true});
var caption = require('./caption');//to actually annotate the pictures.

//git lolz
var clients = {};

//the custom keyboard markup that is passed as an option to the message after the photo has been uploaded.
var opts = {
      reply_markup: JSON.stringify({
        keyboard: [
          ['Top caption','Bottom caption'],
          ['Bottom text',"Top and Bottom Captions"]
        ],
        one_time_keyboard : true, // the keyboard will be hidden as soon as the user picks one option.
        resize_keyboard : true
      })
    };
var hideKeys = {
  reply_markup: JSON.stringify({
    hide_keyboard:true
  })
}

//this is def not the wat to go BUT this is just an EXACT copy of the keyboard in the
//JSON object above which is easier to search with the indexOf() method.
var keyTest = ["Top caption", "Bottom caption","Bottom text","Top and Bottom Captions"];

bot.on('message', function (msg) {
  console.log(msg);//kinda very helpful in the first stages, especially if you have no idea what you are doing.
    var chatId = msg.chat.id;
    //var sci = String(chatId);
    if (msg.text === "/start" || msg.text === "/help") {//or /c <--!!!!!!ATTENTION!!
      if (msg.text === "/start") {
      bot.sendMessage(chatId, "hey) just send me a photo to edit!");
    } else {
      bot.sendMessage(chatId, "wow wow. Its all cool. Just send a photo you want to memify, then you'll be asked to choose a template, and finally to provide the captions. Just roll with it ;)");
    }
    } else if (msg.photo) {
      clients[chatId] = new MakeClient(chatId);
      bot.getFileLink(msg.photo[msg.photo.length - 1].file_id).then(function(resp) {
      gm(resp).size(function(err, value){
        clients[chatId].size = value;
        // note : value for (err) may be undefined
      })
        .write('images/'+chatId+'.jpg', function (err) {
          if (err) {console.log(err);}else {bot.sendMessage(chatId, "Cool, now pick a template you'd like to apply",opts);}
        });
      });
    } else if (keyTest.indexOf(msg.text) != -1 && clients.hasOwnProperty(chatId) ) {
    // push the chosen style into the clients object/
      clients[chatId].template = msg.text;
    //Send a messae asking for text caption/s
      if (msg.text === "Top and Bottom Captions") {
        bot.sendMessage(chatId, "Sweet, now type the top caption.",hideKeys);
      } else {
        bot.sendMessage(chatId, "Sweet, now type the text you'd want to see appear.",hideKeys);
      }
    } else if (typeof clients[chatId] !== 'undefined' && !clients[chatId].hasOwnProperty("topCaption") && clients[chatId].template === "Top and Bottom Captions") {
      console.log("type defined");
        clients[chatId].topCaption = msg.text;
        console.log(clients);
        bot.sendMessage(chatId, "Awesome, now send the bottom caption!");
    }
    //add another else if to ask for the bottomCaption!!
     else if (msg.text && clients.hasOwnProperty(chatId) && clients[chatId].hasOwnProperty("template")) {

      args = new MakeArgs(msg.text,chatId,clients[chatId].topCaption);

      caption.path('images/'+chatId+'.jpg',args,
      function(err,filename){
        console.log(err);
        bot.sendPhoto(chatId, 'images/'+chatId+'.jpg').then(function(){
          console.log("sent");
          //delete the file
          fs.unlinkSync('images/'+chatId+'.jpg');
        }).then(function(){
          //remove the user
          clients[chatId] = null;
          delete clients[chatId];
        });
      });


    } else if (clients.hasOwnProperty(chatId)) {
      //remove the user
      clients[chatId] = null;
      delete clients[chatId];
      //delete the file
      fs.unlinkSync('images/'+chatId+'.jpg');
      bot.sendMessage(chatId, "not sure what you mean🤔I'd love a photo though!");
    } else {
      bot.sendMessage(chatId, "not sure what you mean🤔I'd love a photo though!");
    }
});

function MakeArgs(text,id,topCap){

  this.outputFile = 'images/'+id+'.jpg';
  if (clients[id].template === 'Top caption') {
    this.gravity = "north";//not even suret this is necessary anymore
    this.caption = text;
    this.bottomCaption = " ";
  }
  if (clients[id].template === "Bottom caption") {
    this.gravity = "south";//not even suret this is necessary anymore
    this.caption = text;
    //this.background = "transparent";
  }
  if (clients[id].template === "Bottom text") {
    this.gravity = "south";//not even suret this is necessary anymore
    this.caption = text;
    this.background = "white";
    this.fill = "black";
  }
  if (clients[id].template === "Top and Bottom Captions") {
    this.gravity = "center";//not even suret this is necessary anymore
    this.caption = topCap;
    this.bottomCaption = text;
  }
}

function MakeClient(name){
  this.name = name;
}
//Max Drojjn
