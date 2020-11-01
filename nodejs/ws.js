const logger = require('./logger');

// ------------------- open websocket -------------------
const WebSocket = require("ws");

class WebsocketServer {
	launch() {
		WebsocketServer.wss = new WebSocket.Server({ port: 8081 });

		WebsocketServer.wss.on("connection", function connection(ws, req) {
			//handle receiving a message{{{
			ws.on("message", function incoming(message) {
			});//}}}
			//handle errors{{{
			ws.on("error", error => {
				logger.error(String(error));
			});//}}}
		});
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
