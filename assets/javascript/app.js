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

// Listeners
$('#start-btn').on('click', function() {
	var userName = $('#user-name-input').val().trim();

	addPlayerToDatabase(userName);
});

$('#scroll-left').on('click', function() {
	rpsImagesPos--;

	if(rpsImagesPos < 0) {
		rpsImagesPos = 2;
	}

	var imageSrc = rpsImages[rpsImagesPos];

	$('#player-selection').attr('src', imageSrc);

});

$('#scroll-right').on('click', function() {
	rpsImagesPos++;

	if(rpsImagesPos > 2) {
		rpsImagesPos = 0;
	}

	var imageSrc = rpsImages[rpsImagesPos];

	$('#player-selection').attr('src', imageSrc);

});

function addPlayerToDatabase(userName) {
	database.ref('/players').once('value', function(snapshot) {
		var newPlayer = {
			name: userName,
			wins: 0,
			losses: 0,
		};

		console.log(snapshot.hasChild('1'));

		if(!snapshot.hasChildren()) {
			// Add user as player 1
			database.ref('/players').child('1').set(newPlayer);

			$('#player-value').text(userName + ' you are player 1');
		}
		else if(snapshot.hasChild('1') && !snapshot.hasChild('2')) {
			// Add user as player 2
			database.ref('/players').child('2').set(newPlayer);

			$('#player-value').text(userName + ' you are player 2!');
		}
		else {
			// Two players already exist in database
			$('#player-value').text('Enough players have joined the game.');
		}
	});	
}