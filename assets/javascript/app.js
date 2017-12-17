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

// Listeners
$('#start-btn').on('click', function() {
	var userName = $('#user-name-input').val().trim();

	addPlayerToDatabase(userName);
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