/*

This starts up game.js for the local client

and handles the socket io commands with the server

and handles the local storage of 

and state changing into and out of game

*/

var localToken = null;
var socket;
var ping;
var pingInterval;
var game;

var inGame = false;

var clientId = 0;

// for client player controls
var localPlayerID = 0;

var usersOnline = -1;

var serverEventHandlers = {
  lobbyFound: function(body) {
    // console.log("lobby found: " + body);
    $('.statusText').text('Lobby Found: ' + body + '/' + minPlayers + ' Players');
    document.title = body + '/' + minPlayers + ' Waiting...';
  },
  ping: function(body) {
    if(body.usersOnline != usersOnline) {
      usersOnline = body.usersOnline;
      $('.playerCount').text("Players Online: " + usersOnline);
    }

    // console.log("ping " + body);
    var t = new Date().getTime();
    ping = t - Number(body.ping);
  },
  gameStart: function(body) {
    clientId = body.clientId;
    
    inGame = true;

    $('.statusText').text('Game starting!');

    // console.log('Let\'s start this game');
    document.title = 'GAME FOUND!';
    $('.gameSearcher').fadeOut(500);
    $('.statusText').fadeOut(500);
    $('.waitAnimation').fadeOut(500);
    setTimeout(function(){document.title = 'GAME STARTING!!!!';},2000);
    setTimeout(function(){document.title = 'GO GO GO!!!!';},4000);
    setTimeout(function(){document.title = 'tpa.gg';},6000);

    clearInterval(game.gameLoopInterval);
    game = new Game(false);
    localPlayerID = body.inGameNumber;
    game.startGameLoop();
  },
  token: function(body) {
    localToken = body;
  },
  gameData: function(body) {
    game.clientParseGameData(body);
  },
  gameEnd: function(body) {

    var resultString = "Uh... Tie?";
    if(Number(body) == localPlayerID) { 
      localStorage.setItem("tpa_victory", Number(localStorage.getItem("tpa_victory")) + 1);

      $('.wins').text('Wins: ' + localStorage.getItem("tpa_victory"));
      
      resultString = "Victory!!";
      if(Math.random()*100 < 7) {
        resultString = "Victory!! Nice one.";
      }
      else if(Math.random()*100 < 7) {
        resultString = "Victory!! Slick stuff";
      }
      else if(Math.random()*100 < 7) {
        resultString = "Victory!! Good job";
      }
      else if(Math.random()*100 < 7) {
        resultString = "Fantastic Victory.";
      }
      else if(Math.random()*100 < 7) {
        resultString = "Excellent Victory.";
      }
      else if(Math.random()*100 < 7) {
        resultString = "You are the greatest.";
      }
      else if(Math.random()*100 < 7) {
        resultString = "That was incredible. VICTORY!";
      }
    }
    else if(Number(body) >= 0) {
      localStorage.setItem("tpa_defeat", Number(localStorage.getItem("tpa_defeat")) + 1);

      $('.losses').text('Losses: ' + localStorage.getItem("tpa_defeat"));

      resultString = "Defeat.";
      if(Math.random()*100 < 7) {
        resultString = "Better luck next time.";
      }
      else if(Math.random()*100 < 10) {
        resultString = "You may have lost the battle.";
      }
      else if(Math.random()*100 < 10) {
        resultString = "You have been defeated";
      }
    }

    game.slowTime = true;

    // console.log('try to join game');
    document.title = resultString;
    $('.statusText').text(resultString);

    setTimeout(function() {
      $('.gameSearcher').fadeIn(500);
      $('.statusText').fadeIn(500);
      $('.waitAnimation').fadeIn(500);

      document.title = 'tpa.gg';

      // give it that little wait before searching for the game
      setTimeout( function() {
        // Game has ended, set up the background game
        clearInterval(game.gameLoopInterval);

        delete game;
        game = new Game(false);

        localPlayerID = 0;

        game.players.push(new Player(gameWidth/2, gameHeight/2));
        game.countdownTimer = 0;
      }, 4000);
    }, 2000);

    setTimeout( function() {
      $('.statusText').text('Searching for a game...');

      // give it that little wait before searching for the game
      setTimeout( function() {
        // try to join a game
        var message = JSON.stringify({'event': 'joinGame'});
        socket.send(message);
      }, 3000);
    }, 9000);
  }
}

// clientside running for now
$(document).ready(function() {

  // if they have a small window, give them the resize
  if(window.innerHeight > 600 && window.innerHeight < 900) {
    width = 800;
    height = 600;

    // 400 x 600
    $('.gameSearcher').css('top', '100px');
    $('.gameSearcher').css('left', '100px');
  }

  if(!localStorage.getItem("tpa_defeat")) {
    localStorage.setItem("tpa_defeat", 0);
    localStorage.setItem("tpa_victory", 0);
  }

  $('.wins').text('Wins: ' + localStorage.getItem("tpa_victory"));
  $('.losses').text('Losses: ' + localStorage.getItem("tpa_defeat"));

  socket = io();

  // start ping interval
  pingInterval = setInterval(function() {
    var t = new Date().getTime();
    var message = JSON.stringify({'event': 'ping', 'body': t});
    socket.send(message);
  }, 1000);

  // handle mesages from the server
  socket.on('message', function (m) {

    var message = JSON.parse(m);
    if (message['event'] !== undefined
        && serverEventHandlers[message['event']] !== undefined) {
      var eventName = message['event'];
      var eventBody = message['body'];
      serverEventHandlers[eventName](eventBody);
    }
  });
  // find a game
  $('.joinGame').on('click', function() {
    // console.log('try to join game');
    document.title = 'Searching for game...';
    $('.statusText').text('Searching for a game...');

    $('.joinGame').fadeOut(500, function(){$('.joinGame').css('display', 'none');});

    setTimeout(function() {
      $('.statusText').fadeIn(500);
      $('.waitAnimation').fadeIn(500);
    }, 1000);

    // give it that little wait before searching for the game
    setTimeout( function() {
      // try to join a game
      var message = JSON.stringify({'event': 'joinGame'});
      socket.send(message);
    }, 2000);
  });

  game = new Game(false);
  game.players.push(new Player(gameWidth/2, gameHeight/2));
  game.countdownTimer = 0;
  game.initGame();
});



console.log('Game script loaded.');
