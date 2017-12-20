// Initialize Firebase
var config = {
	apiKey: "AIzaSyCo2DejadWQS7fw_niSEzmhYmnRFMjUSAA",
	authDomain: "rpsmultiplayer-70853.firebaseapp.com",
	databaseURL: "https://rpsmultiplayer-70853.firebaseio.com",
	projectId: "rpsmultiplayer-70853",
	storageBucket: "rpsmultiplayer-70853.appspot.com",
	messagingSenderId: "728920962116"
};

firebase.initializeApp(config);

// Globals //
var database = firebase.database();

var rpsImages = ['./assets/images/rock.png','./assets/images/paper.png','./assets/images/scissors.png'];

var rpsImagesPos = 1;

var currentPlayer = '0';
// End Globals //

// Listens for chat send button clicks
$('#chat-send').on('click', function(){
	writeChatMessageToDatabase('');
});

// Listens for play button clicks for a new user.
$('#play-btn').on('click', function() {
	var userName = $('#user-name-input').val().trim();

	addNewPlayer(userName);
});

// Listens to the database for new children on the /players node.
database.ref('/players').on('child_added', function(snapshot) {
	var newPlayer = snapshot.ref.key;

	var newPlayerName = snapshot.val().name;
	var playerWins = snapshot.val().wins;
	var playerLosses = snapshot.val().losses;

	updatePlayerPanelHeaderAndFooter(newPlayerName, newPlayer, playerWins, playerLosses);

	updatePlayerPanelBody(newPlayer, false, false, '');
});

// Listens to the database for changes on children of the /players node
database.ref('/players').on('child_changed', function(snapshot) {
	var player = snapshot.ref.key;

	var playerName = snapshot.val().name;
	var playerWins = snapshot.val().wins;
	var playerLosses = snapshot.val().losses;

	updatePlayerPanelHeaderAndFooter(playerName, player, playerWins, playerLosses);
});

// Listens to the database for children added to the root
database.ref().on('child_added', function(snapshot){
	if(snapshot.key === 'turn') {
		checkWhoseTurnItIs();
	} else if(snapshot.key === 'chat') {
		writeChatMessageToChatWindow(snapshot);
	}
});

// Listens to the database for children changed.
database.ref().on('child_changed', function(snapshot) {
	if(snapshot.ref.key === 'turn') {
		checkWhoseTurnItIs();	
	} else if(snapshot.key === 'chat') {
		writeChatMessageToChatWindow(snapshot);
	}
});

function test(snapshot) {
	console.log('from test(): ' + snapshot.key);
}

// Listens to the database for children removed from the /players node
database.ref('/players').on('child_removed', function(snapshot) {
	// Remove the turn node
	database.ref('/turn').remove();

	// Clear counter message
	$('#new-game-countdown').empty();

	// Clear results panel body
	$('#results-panel-body').empty();

	setTurnMessage('');

	if(currentPlayer === '1') {
		updatePlayerPanelBody(currentPlayer, false, false, '');

		// Reset the opposing player's panel
		resetPlayerPanel('2');
	} else if(currentPlayer === '2') {
		updatePlayerPanelBody(currentPlayer, false, false, '');

		resetPlayerPanel('1');
	} else {
		resetPlayerPanel('1');

		resetPlayerPanel('2');
	}
});

// Listens to scroll button clicks
$(document).on('click', '.scroll-btn', scrollImages);

// Listens to select button clicks
$(document).on('click', '.select-btn', selectionMade);

// Listener for refresh button
$(window).on('beforeunload', function() {
	console.log('beforeunload', currentPlayer);
	// Refresh has been clicked which means player has left game
	if(currentPlayer !== '0') {
		writeChatMessageToDatabase('has disconnected.');

		// Delete the current player from the database
		database.ref('/players/' + currentPlayer).remove();
	}
});

// Scrolls selections left or right
function scrollImages() {
	var btnType = $(this).attr('btn-type');

	if(btnType === 'scroll-left') {
		rpsImagesPos--;

		if(rpsImagesPos < 0) {
 			rpsImagesPos = 2;
 		}
	} else {
		rpsImagesPos++;

		if(rpsImagesPos > 2) {
			rpsImagesPos = 0;
		}
	}

	var imageSrc = rpsImages[rpsImagesPos];

	$('#selection-img').attr('src', imageSrc);
	$('#selection-img').attr('selection', getChoiceValue());
}

// Contains logic used when user has made a selection
function selectionMade() {
	// Store player selection in database
	var choice = {
		choice: $('#selection-img').attr('selection'),
	};

	updateDatabaseNode('/players/' + currentPlayer, choice);

	// Remove buttons from panel body
	updatePlayerPanelBody(currentPlayer, false, true, $('#selection-img').attr('src'), '');

	// Player has made a selection, so the turn value has to be updated.
	updateTurnValue();
}

// Adds a new player to the database
function addNewPlayer(userName) {
	database.ref('/players').once('value')
		.then(function(snapshot) {
		var newPlayer = {
			name: userName,
			wins: 0,
			losses: 0,
		};

		if(!snapshot.hasChildren()) {
			// Add user as player 1
			addDatabaseNode('/players', '1', newPlayer);

			currentPlayer = '1';

			setPlayerMessage('You are Player ' + currentPlayer);

			// Setup player panel
			updatePlayerPanelHeaderAndFooter(userName, currentPlayer, 0, 0);

			updatePlayerPanelBody(currentPlayer, false, false, '');

			// Hide user name input
			$('#user-name-container').css('display', 'none');

			// Enable chat send button
			$('#chat-send').attr('disabled', false);
		}
		else if(snapshot.hasChild('1') && !snapshot.hasChild('2')) {
			// Add user as player 2
			addDatabaseNode('/players', '2', newPlayer);

			currentPlayer = '2';

			setPlayerMessage('You are Player ' + currentPlayer);

			// Setup player panel
			updatePlayerPanelHeaderAndFooter(userName, currentPlayer, 0, 0);

			// Hider user name input
			$('#user-name-container').css('display', 'none');

			// Enable chat send button
			$('#chat-send').attr('disabled', false);

			// The arrival of player 2 triggers the insertion of the turn node in the database
			updateTurnValue();
		}
		else {
			// Two players already exist in database
			setPlayerMessage('Enough players have joined the game.');
		}
	});	
}

// Updates the turn value in the database
function updateTurnValue() {
	database.ref().once('value')
		.then(function(snapshot) {

		var newTurnValue = 0;

		if(snapshot.child('turn').exists()) {
			// Read turn value, update, then write
			var currentTurnValue = snapshot.child('turn').val();

			newTurnValue = currentTurnValue + 1;
		} else {
			// Add turn value
			newTurnValue = 1;
		}

		var turnObj = {
			turn: newTurnValue,
		};

		updateDatabaseNode('', turnObj);

	});
}

// Updates the wins value in the database for the specified player
function updatePlayerWins(player) {
	database.ref('/players').once('value')
		.then(function(snapshot) {
			var playerObj = snapshot.child(player).val();

			var currentWins = playerObj.wins;

			var winsObj = {
				wins: (currentWins + 1),
			};

			updateDatabaseNode('/players/' + player, winsObj);
		});
}

// Updates the losses value in the database for the specified player
function updatePlayerLosses(player) {
	database.ref('/players').once('value')
		.then(function(snapshot) {
			var playerObj = snapshot.child(player).val();

			var currentLosses = playerObj.losses;

			var lossesObj = {
				losses: (currentLosses + 1),
			};

			updateDatabaseNode('/players/' + player, lossesObj);
		});
}

// Checks and determines game logic based on turn value
function checkWhoseTurnItIs() {
	// There are only 3 turns per game:
	// 1. Player 1 is choosing and Player 2 is waiting
	// 2. Player 1 has chosen and Player 2 is choosing
	// 3. Both players have chosen, determine winner
	database.ref().once('value')
		.then(function(snapshot){
			var player1Obj = snapshot.child('/players/1').val();
			var player2Obj = snapshot.child('/players/2').val();

			if(snapshot.child('turn').val() === 1) {
				// Turn 1 means we are starting a new game, so let's clear elements 
				// just in case they are still populated from a previous game.

				// Player 1 is choosing while Player 2 is waiting
				if(currentPlayer === '1') {
					setTurnMessage('It\'s Your Turn!');

					// Display scrollable images
					updatePlayerPanelBody(currentPlayer, true, false, '', '');

					// Update Player 2 panel to waiting
					updatePlayerPanelBody('2', false, false, '', 'Waiting for your selection...');

				} else {
					// You are Player 2, so you have to wait for Player 1
					setTurnMessage('Waiting for ' + player1Obj.name + ' to choose...');

					// Update Player 1 panel to selecting
					updatePlayerPanelBody('1', false, false, '', 'Selecting...');

					// Clear Player 2 panel body
					updatePlayerPanelBody('2', false, false, '', '');
				}
			} else if(snapshot.child('turn').val() === 2) {
				// Player 1 has chosen and is now waiting, Player 2 is choosing
				if(currentPlayer === '1') {
					// Waiting for Player 2
					setTurnMessage('Waiting for ' + player2Obj.name + ' to choose...');

					// Update Player 2 panel to selecting
					updatePlayerPanelBody('2', false, false, '', 'Selecting...');
				} else {
					setTurnMessage('It\'s Your Turn!');

					// Display scrollable images
					updatePlayerPanelBody(currentPlayer, true, false, '', '');

					// Update Player 1 panel to waiting
					updatePlayerPanelBody('1', false, false, '', 'Waiting for your selection...');
				}
			} else if(snapshot.child('turn').val() === 3) {
				// Determine winner
				determineWinner();

				startNewGameCountdown();
			}
		});
}

// Determines the winner of the game
function determineWinner() {
	database.ref('/players').once('value')
		.then(function(snapshot) {

		var player1Obj = snapshot.child('1').val();
		var player2Obj = snapshot.child('2').val();

		var winner = '';

		if(player1Obj.choice === player2Obj.choice) {
			// It's a tie!!!!
			winner = 'Tie';
		} else if(hasPlayer1Won(player1Obj.choice, player2Obj.choice)) {
			winner = '1';
		} else if(hasPlayer2Won(player1Obj.choice, player2Obj.choice)) {
			winner = '2';
		} else {
			console.log('determineWinner():  Something went wrong!  Unable to determine winner based on player choice.');

			return;
		}

		// Display opponents choice
		if(currentPlayer === '1') {
			// Display Player 2's choice
			var imageUrl = getChoiceImageUrlBasedOnValue(player2Obj.choice);

			updatePlayerPanelBody('2', false, true, imageUrl, '');
		} else if(currentPlayer === '2') {
			// Display Player 1's choice
			var imageUrl = getChoiceImageUrlBasedOnValue(player1Obj.choice);

			updatePlayerPanelBody('1', false, true, imageUrl, '');
		}

		// Update turn message
		if(winner === currentPlayer) {
			setTurnMessage('Awesome, you won!');

			displayYouWinResult(); 

			updatePlayerWins(currentPlayer);
		} else if(winner === 'Tie') {
			setTurnMessage('Awww snap, you tied!');

			displayTieResult();
		} else {
			if(currentPlayer === '1') {
				setTurnMessage(player2Obj.name + ' has beat you.  Better luck next time.');	

				displayYouWLoseResult();

				updatePlayerLosses(currentPlayer);
			} else if(currentPlayer === '2') {
				setTurnMessage(player1Obj.name + ' has beat you.  Better luck next time.');

				displayYouWLoseResult();

				updatePlayerLosses(currentPlayer);
			} else {
				console.log('checkWhoseTurnItIs():  Unhandled currentPlayer value encoutered ' + currentPlayer);

				return;
			}		
		}
	});
}

// Checks if player 1 has won
function hasPlayer1Won(player1Choice, player2Choice) {
	if(player1Choice === 'rock' && player2Choice === 'scissors') {
		return true;
	} else if(player1Choice === 'paper' && player2Choice === 'rock') {
		return true;
	} else if(player1Choice === 'scissors' && player2Choice === 'paper') {
		return true;
	}

	return false;
}

// Checks if player 2 has won
function hasPlayer2Won(player1Choice, player2Choice) {
	if(player2Choice === 'rock' && player1Choice === 'scissors') {
		return true;
	} else if(player2Choice === 'paper' && player1Choice === 'rock') {
		return true;
	} else if(player2Choice === 'scissors' && player1Choice === 'paper') {
		return true;
	}

	return false;
}

// Updates a specific path in the database with the specified data object
function updateDatabaseNode(refPath, dataObject) {
	if(refPath.length === 0) {
		database.ref().update(dataObject);
	} else {
		database.ref(refPath).update(dataObject);
	}
}

// Adds the specified data object into the database to the specified path
function addDatabaseNode(refPath, newChildPath, dataObject) {
	if(refPath.length === 0) {
		database.ref().child(newChildPath).set(dataObject);
	} else {
		database.ref(refPath).child(newChildPath).set(dataObject);
	}
}

// Sets messages to the player messages section
function setPlayerMessage(message) {
	$('#player-message').text(message);
}

// Sets messages to the turn message section
function setTurnMessage(message) {
	$('#turn-message').text(message);
}

// Sets up the current players selection panel
function updatePlayerPanelHeaderAndFooter(userName, player, wins, losses) {
	var panelTitleId = '#player' + player + '-panel-title';
	var panelBodyId = '#player' + player + '-panel-body';
	var panelFooterId = '#player' + player + '-panel-footer';

	$(panelTitleId).text(userName + ' - Player ' + player);

	//$(panelBodyId).empty();

	$(panelFooterId).text('Wins: ' + wins + ' Losses:  ' + losses);
}

// Resets the specified player panel
function resetPlayerPanel(player) {
	var panelTitleId = '#player' + player + '-panel-title';
	var panelBodyId = '#player' + player + '-panel-body';
	var panelFooterId = '#player' + player + '-panel-footer';

	$(panelTitleId).empty();
	$(panelBodyId).text('Waiting for Player ' + player);
	$(panelFooterId).empty();
}

// Returns text string representing choice based on the images array position value
function getChoiceValue() {
	switch(rpsImagesPos) {
		case 0: 
			return 'rock';
		case 1:
			return 'paper';
		case 2:
			return 'scissors';
		default:
			console.log('getChoiceValue():  Unhandled image position value encountered ' + rpsImagesPos);
	}
}

// Returns the img url for the specified choice
function getChoiceImageUrlBasedOnValue(choice) {
	switch(choice) {
		case 'rock' :
			return rpsImages[0];
		case 'paper' :
			return rpsImages[1];
		case 'scissors' :
			return rpsImages[2];
		default:
			console.log('getChoiceImageUrlBasedOnValue():  Unhandled choice value encoutered ' + choice);
	}
}

// Updates the body of the specifired players game panel
function updatePlayerPanelBody(player, displayScrollableImages, displayStaticImage, imageUrl, message) {
	var panelBodyId = '#player' + player + '-panel-body';

	$(panelBodyId).empty();

	if(displayScrollableImages) {
		var img = $('<img/>');
		img.attr('src', rpsImages[rpsImagesPos]);
		img.attr('alt', 'Player selection');
		img.attr('id', 'selection-img');
		img.attr('selection', getChoiceValue());
		img.addClass('img-responsive');

		$(panelBodyId).append(img);

		var leftBtn = $('<button></button>');
		//leftBtn.attr('id', 'scroll-left');
		leftBtn.attr('btn-type', 'scroll-left')
		leftBtn.addClass('glyphicon glyphicon-arrow-left btn btn-primary btn-med scroll-btn');

		$(panelBodyId).append(leftBtn);

		var rightBtn = $('<button></button>');
		//rightBtn.attr('id', 'scroll-right');
		rightBtn.attr('btn-type', 'scroll-right')
		rightBtn.addClass('glyphicon glyphicon-arrow-right btn btn-primary btn-med scroll-btn');

		$(panelBodyId).append(rightBtn);

		var chooseBtn = $('<button></button>');
		chooseBtn.addClass('btn btn-primary btn-med select-btn');
		chooseBtn.text('Select');

		$(panelBodyId).append(chooseBtn);
	} else if(displayStaticImage) {
		var img = $('<img/>');
		img.attr('src', imageUrl);
		img.attr('alt', 'Player selection');
		img.attr('id', 'selection-img');
		img.addClass('img-responsive');

		$(panelBodyId).append(img);
	} else {
		$(panelBodyId).text(message);
	}	
}

// Displays the you win image to the results panel
function displayYouWinResult() {
	$('#results-panel-body').empty();

	var img = $('<img/>');
	img.attr('src', './assets/images/you-win.png');
	img.attr('alt', 'you win image');
	img.addClass('img-responsive');

	$('#results-panel-body').append(img);
}

// Displays the you lose image to the results panel
function displayYouWLoseResult() {
	$('#results-panel-body').empty();

	var img = $('<img/>');
	img.attr('src', './assets/images/you-lose.jpg');
	img.attr('alt', 'you lose image');
	img.addClass('img-responsive');

	$('#results-panel-body').append(img);
}

// Displays the you tied image to the results panel
function displayTieResult() {
	$('#results-panel-body').empty();

	var img = $('<img/>');
	img.attr('src', './assets/images/tie.jpg');
	img.attr('alt', 'you tied image');
	img.addClass('img-responsive');

	$('#results-panel-body').append(img);
}

// Sets up a new game with the same players
function setupNewGame() {
	// Reset turn value to 1
	var turnObj = {
		turn: 1,
	};

	updateDatabaseNode('', turnObj);

	// Clear counter message
	$('#new-game-countdown').empty();

	// Clear results panel body
	$('#results-panel-body').empty();
}

// Starts the new game countdown
function startNewGameCountdown() {
	var secondsRemaining = 5;

	var intervalId = 0;

	// Update counter display
	$('#new-game-countdown').text('New game in ' + secondsRemaining);

	clearInterval(intervalId);

	var countdown = function(secsRemaining, intvlId) {
		secondsRemaining--;

		// Update counter display
		$('#new-game-countdown').text('New game in ' + secondsRemaining);

		if(secondsRemaining == 0) {
			clearInterval(intervalId);

			setupNewGame();
		}
	}

	intervalId = setInterval(countdown, 1000, secondsRemaining, intervalId);
}

// Writes chat message to the database.
// If a message is not provided, the message will be read from the chat input text box.
function writeChatMessageToDatabase(message) {
	// Contains example of using bind!!!
	database.ref().once('value')
		.then(function(snapshot){
			var chatMessage = '';

			if(this.message.length == 0) {
				chatMessage = $('#chat-input').val().trim();
			} else {
				chatMessage = this.message;
			}

			var playerName = snapshot.child('/players/' + currentPlayer + '/name/').val();

			var message = playerName + ': ' + chatMessage;
			
			if(snapshot.child('/chat/').exists()) {
				// Overwrite message in existing node
				var currentChatArray = snapshot.child('/chat/messages').val();

				currentChatArray.push(message);

				var messageObj = {
					messages: currentChatArray,
				};

				updateDatabaseNode('/chat/', messageObj);
			} else {
				// Create chat array
				var chatArray = [message];

				// Create chat object to store the array
				var messageObj = {
					messages: chatArray,
				};

				addDatabaseNode('', '/chat/', messageObj);
			}

			// Clear chat input
			$('#chat-input').val('');
		}.bind({message: message}));
}

// Writes chate message stored in database to the chat window
function writeChatMessageToChatWindow(snapshot) {
	$('#chat-window').text('');

	var currentChatArray = snapshot.child('/messages/').val();

	for(var i=0; i<currentChatArray.length; i++) {
		$('#chat-window').append(currentChatArray[i] + '\n');
	}
}