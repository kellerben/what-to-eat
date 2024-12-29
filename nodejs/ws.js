const logger = require('./logger');

// ------------------- open websocket -------------------
const WebSocket = require("ws");

class WebsocketServer {
	launch() {
		WebsocketServer.wss = new WebSocket.Server({ port: 8081 });
		WebsocketServer.clients = {};

		WebsocketServer.wss.on("connection", function connection(ws, req) {
			//handle receiving a message{{{
			ws.on("message", function incoming(message) {
				let m = JSON.parse(message);
				if (typeof m.community != 'undefined' && m.community != '') {
					if (typeof WebsocketServer.clients[m.community] == 'undefined'){
						WebsocketServer.clients[m.community] = [];
					}
					WebsocketServer.clients[m.community].push(ws);
				}
			});//}}}
			//handle errors{{{
			ws.on("error", error => {
				logger.error(String(error));
			});//}}}
		});
	}

	static sendCommunity(community, data) {
		if (typeof WebsocketServer.clients[community] != 'undefined') {
			let oldclients = [];
			WebsocketServer.clients[community].forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(data);
				} else {
					oldclients.push(client);
				}
			});
			oldclients.forEach(function (c) {
				const index = WebsocketServer.clients[community].indexOf(c);
				if (index > -1) {
					WebsocketServer.clients[community].splice(index, 1);
				}
			});
		}
	}
	static sendAll(data) {
		WebsocketServer.wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	}
}

module.exports = WebsocketServer;
