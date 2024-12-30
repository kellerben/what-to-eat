// const { Middleware } = require('swagger-express-middleware');
const http = require('http');
const fs = require('fs');
const path = require('path');
const swaggerUI = require('swagger-ui-express');
const jsYaml = require('js-yaml');
const express = require('express');
//const cors = require('cors');
const bodyParser = require('body-parser');
const OpenApiValidator = require('express-openapi-validator');
const logger = require('./logger');
const config = require('./config');

class ExpressServer {
	constructor(port, openApiYaml) {
		this.port = port;
		this.app = express();
		this.openApiPath = openApiYaml;
		try {
			this.schema = jsYaml.safeLoad(fs.readFileSync(openApiYaml));
		} catch (e) {
			logger.error('failed to start Express Server', e.message);
		}
		this.setupMiddleware();
	}

	setupMiddleware() {
		//this.app.use(cors());
		this.app.use(bodyParser.json({ limit: '14MB' }));
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: false }));
		//View the openapi document in a visual interface. Should be able to test from this page
		this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(this.schema));
		this.app.use(
			OpenApiValidator.middleware({
				apiSpec: this.openApiPath,
				operationHandlers: path.join(__dirname),
				fileUploader: { dest: config.FILE_UPLOAD_PATH },
			})
		);
	}

	launch() {
		http.createServer(this.app).listen(this.port);
		logger.info(`Listening on port ${this.port}`);
	}

	async close() {
		if (this.server !== undefined) {
			await this.server.close();
			logger.info(`Server on port ${this.port} shut down`);
		}
	}
}

module.exports = ExpressServer;
