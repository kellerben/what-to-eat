const { transports, createLogger, format } = require('winston');

const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(),
		format.json(),
	),
	defaultMeta: { service: 'user-service' },
	transports: [
		new transports.Console(),
	],
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;
