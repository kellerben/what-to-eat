const { transports, createLogger, format } = require('winston');

let log_level = 'info';
if (process.env.NODE_ENV !== 'production') {
	log_level = 'debug';
}
const logger = createLogger({
	level: log_level,
	format: format.combine(format.timestamp(), format.simple()),
	defaultMeta: { service: 'user-service' },
	transports: [new transports.Console()],
});

module.exports = logger;
