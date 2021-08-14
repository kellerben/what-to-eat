const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');
const WS = require('./ws');

const launchServer = async () => {
	try {
		this.ws = new WS();
		this.ws.launch();
		logger.info('websocket server running');

		this.expressServer = new ExpressServer(
			config.URL_PORT,
			config.OPENAPI_YAML
		);
		this.expressServer.app.disable('x-powered-by');
		this.expressServer.launch();
		logger.info('Express server running');
	} catch (error) {
		logger.error('Express Server failure', error.message);
		await this.close();
	}
};

launchServer().catch(e => logger.error(e));
