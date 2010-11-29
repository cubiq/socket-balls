var sys = require('sys'),
    http = require('http'),
	io = require('socket.io'),
    server = http.createServer(),
    socket = io.listen(server, { transports: ['websocket']}),
	players = {};

// Set up events
socket.on('connection', function (client) {
	// Send to the new user the list of active players
	client.send({ type: 'playerslist', list: players });

	// Add the new user to the list of players
	players[client.sessionId] = { x:0, y:0 }

	// Broadcast the new user to all players
	socket.broadcast({ type: 'new', id: client.sessionId }, [client.sessionId]);

	client.on('message', function (message) {
		if (message.type != 'position') {
			return;
		}

		// Broadcast the new user position
		players[message.id] = { x: message.x, y: message.y };
		//socket.broadcast({ type: 'position', id: message.id, x: message.x, y: message.y }, [client.sessionId]);
		client.send({ type: 'position', list: players });
	});
	
	client.on('disconnect', function () {
		// Remove the user from the list of players
		delete players[this.sessionId];

		// Broadcast the logged out user's id
		socket.broadcast({ type: 'leave', id: this.sessionId });
	});

});

// Start listening
server.listen(8008);
