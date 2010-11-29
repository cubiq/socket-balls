
var socket = new io.Socket(null, { port: 8008, transports: ['websocket'] }),
	sessionid = 0,
	connectTimeout;

function socketInit() {
	var connection = socket.connect();

	connectTimeout = setTimeout(function () {
		if (connection.connected === true) {
			return;
		}

		var popup = document.getElementById('popup');
		popup.innerHTML = 'Sorry, the server is probably down. Retry later';
		popup.style.display = 'block';
	}, 3000);
	
	socket.on('connect', function () {
		clearTimeout(connectTimeout);

		sessionid = this.transport.sessionid;

		me = new Player(sessionid, 'player');

		mainLoop = setInterval(moveMe);
	});

	socket.on('message', function (message) {
		switch (message.type) {
			case 'position':
				// Update players position
				updatePosition(message.list);
				ready = true;
				break;
			case 'playerslist':
				// Create all opponents
				createOpponents(message.list);
				ready = true;	// ready to communicate with socket server
				break;
			case 'new':
				// New player joined
				players.push(new Player(message.id, 'opponent'));
				break;
			case 'leave':
				// Player disconnected
				leave(message.id);
				break;
		}
	});

	socket.on('disconnect', function () {
		document.getElementById('popup').style.display = 'block';
	});
}

function sendPosition () {
	if (ready) {
		ready = false;

		var pos = buffer.length ? buffer[0] : { x:me.x, y:me.y };
		buffer.shift();

		socket.send({ type:'position', id:me.id, x:pos.x, y:pos.y });
	}
}

function updatePosition (data) {
	var id, i, l;

	for (i=0, l=players.length; i<l; i++) {
		id = players[i].id;
		if (id in data) {
			players[i].update(data[id].x, data[id].y);
		}
	}
}

function createOpponents (list) {
	for (var i in list) {
		players.push(new Player(i, 'opponent', list[i].x, list[i].y));
	}
}

function leave (id) {
	for (var i=0, l=players.length; i<l; i++) {
		if (id == players[i].id) {
			players[i].remove();
			players.splice(i, 1);
			return;
		}
	}
}
