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

var database = firebase.database();

var rpsImages = ['./assets/images/rock.png','./assets/images/paper.png','./assets/images/scissors.png'];

var rpsImagesPos = 1;

var currentPlayer = '0';

var selectionsDisplayed = false;

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

	setupPlayerPanel(newPlayerName, newPlayer, playerWins, playerLosses);
});

// Listens to the database for any value changes.  
// Only the the turn property is dealt with.
database.ref().on('value', function(snapshot){
	if(snapshot.val() !== null) {
		var playerTurn = snapshot.val().turn;

		if(playerTurn === currentPlayer) {
			setTurnMessage('It\'s Your Turn!');

			if(!selectionsDisplayed) {
				displaySelections();
			}
		}
	}
});

// Listens for left scroll button clicks.
$('#scroll-left').on('click', function() {
	console.log('clicked');

	rpsImagesPos--;

	if(rpsImagesPos < 0) {
		rpsImagesPos = 2;
	}

	var imageSrc = rpsImages[rpsImagesPos];

	$('#selection-img').attr('src', imageSrc);

});

// Listens for right scroll button clicks.
$('#scroll-right').on('click', function() {
	console.log('clicked');

	rpsImagesPos++;

	if(rpsImagesPos > 2) {
		rpsImagesPos = 0;
	}

	var imageSrc = rpsImages[rpsImagesPos];

	$('#selection-img').attr('src', imageSrc);

});

// Adds a new player to the database
function addNewPlayer(userName) {
	database.ref('/players').once('value', function(snapshot) {
		var newPlayer = {
			name: userName,
			wins: 0,
			losses: 0,
		};

		if(!snapshot.hasChildren()) {
			// Add user as player 1
			database.ref('/players').child('1').set(newPlayer);

			currentPlayer = '1';

			setPlayerMessage('You are Player ' + currentPlayer);
		}
		else if(snapshot.hasChild('1') && !snapshot.hasChild('2')) {
			// Add user as player 2
			database.ref('/players').child('2').set(newPlayer);

			currentPlayer = '2';

			setPlayerMessage('You are Player ' + currentPlayer);

			// The arrival of player 2 triggers the insertion of the turn node in the database
			var turn = {
				turn: '1',
			}

			database.ref().update(turn);
		}
		else {
			// Two players already exist in database
			setPlayerMessage('Enough players have joined the game.');
		}

		if(currentPlayer === '1' || currentPlayer === '2') {
			// Setup player panel
			setupPlayerPanel(userName, currentPlayer, 0, 0);

			// Hider user name input
			$('#user-name-container').css('display', 'none');
		}
	});	
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
function setupPlayerPanel(userName, player, wins, losses) {
	var panelTitleId = '#player' + player + '-panel-title';
	var panelBodyId = '#player' + player + '-panel-body';
	var panelFooterId = '#player' + player + '-panel-footer';

	$(panelTitleId).text(userName + ' - Player ' + player);

	$(panelBodyId).empty();

	$(panelFooterId).text('Wins: ' + wins + ' Losses:  ' + losses);
}

function displaySelections() {
	var panelBodyId = '#player' + currentPlayer + '-panel-body';

	var img = $('<img/>');
	img.attr('src', rpsImages[rpsImagesPos]);
	img.attr('alt', 'Player selection');
	img.attr('id', 'selection-img');
	img.addClass('img-responsive');

	$(panelBodyId).append(img);

	var leftBtn = $('<button></button>');
	leftBtn.attr('id', 'scroll-left');
	leftBtn.addClass('glyphicon glyphicon-arrow-left btn btn-primary btn-med');

	$(panelBodyId).append(leftBtn);

	var rightBtn = $('<button></button>');
	rightBtn.attr('id', 'scroll-right');
	rightBtn.addClass('glyphicon glyphicon-arrow-right btn btn-primary btn-med');

	$(panelBodyId).append(rightBtn);	
}