const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const WS = require('./ws');

const launchServer = async () => {
	try {
		this.ws = new WS();
		this.ws.launch();
		logger.info('Websocket Server running');

		this.expressServer = new ExpressServer(
			config.URL_PORT,
			config.OPENAPI_YAML
		);
		this.expressServer.app.disable('x-powered-by');
		this.expressServer.launch();
	} catch (error) {
		logger.error(`Express Server failure: ${error.message}`);
		logger.debug(error.stack);
		await this.close();
	}
};

launchServer().catch((e) => logger.error(e));
