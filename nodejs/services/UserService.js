/* eslint-disable no-unused-vars */
const Service = require('./Service');
const ws = require('../ws');

/**
* Get the payment information of a user
*
* community String The community string.
* userId String The user
* no response value expected for this operation
* */
const getPaymentInstructions = ({ community, userId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT paymentInstructions FROM users WHERE community = ? AND user = ?";
		var vars = [community, userId];
		try {
			Service.mysql_connection_pool.execute(stmt, vars, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching paymentInstructions'));
				} else {
					resolve(Service.successResponse(rows[0]));
				}
			});
		} catch (e) {
			reject(Service.rejectResponse(
				e.message || 'Invalid input',
				e.status || 405,
			));
		}
	},
);
/**
* Set the payment information of the user
*
* community String The community string.
* userId String The user
* paymentInstructions PaymentInstructions
* no response value expected for this operation
* */
const setPaymentInstructions = ({ community, userId, paymentInstructions }) => new Promise(
	async (resolve, reject) => {
		try {
			var inserts = [paymentInstructions.paymentInstructions, community, userId];
			var stmt =
				"INSERT INTO users" +
				" (paymentInstructions, community, user)" +
				" VALUES (?, ?, ?)";

			Service.mysql_connection_pool.execute(stmt, inserts, function (err, rows, fields) {
				if (err) {
					if (err.errno == 1062) { // duplicate primary key
						stmt =
							"UPDATE users" +
							" SET paymentInstructions = ?" +
							" WHERE community = ? AND user = ?";
						Service.mysql_connection_pool.execute(stmt, inserts, function (err, rows, fields) {
							if (err) {
								console.log('Error during update of paymentinfo: ', err);
								reject(Service.rejectResponse('Error during the insertion of the payment instructions'));
							} else {
								ws.sendCommunity(community, "refreshOrders");
								resolve(Service.successResponse('success'));
							}
						});
					} else {
						console.log('Error during insertion of paymentinfo: ', err);
						reject(Service.rejectResponse('Error during the insertion of the payment instructions'));
					}
				} else {
					ws.sendCommunity(community, "refreshOrders");
					resolve(Service.successResponse('success'));
				}
			});
		} catch (e) {
			reject(Service.rejectResponse(
				e.message || 'Invalid input',
				e.status || 405,
			));
		}
	},
);

module.exports = {
	getPaymentInstructions,
	setPaymentInstructions,
};
