const Service = require('./Service');
const ws = require('../ws');

/**
 * Get the payment information of a user
 *
 * community String The community string.
 * userId String The user
 * no response value expected for this operation
 * */
const getPaymentInstructions = ({ community, userId }) =>
	new Promise((resolve, reject) => {
		let stmt =
			'SELECT paymentInstructions FROM users WHERE community = ? AND user = ?';
		let vars = [community, userId];
		try {
			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
				if (err) {
					console.error(err);
					reject(
						Service.rejectResponse('Error while fetching paymentInstructions')
					);
				} else {
					resolve(Service.successResponse(rows[0]));
				}
			});
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});
/**
 * Set the email of the user
 *
 * community String The community string.
 * userId String The user
 * email Email
 * no response value expected for this operation
 * */
const setEmail = ({ community, userId, email }) =>
	new Promise((resolve, reject) => {
		try {
			let inserts = [email.email, community, userId];
			let stmt =
				'INSERT INTO users' + ' (email, community, user)' + ' VALUES (?, ?, ?)';

			Service.mysql_connection_pool.execute(
				stmt,
				inserts,
				(err, rows, fields) => {
					if (err) {
						if (err.errno == 1062) {
							// duplicate primary key
							stmt =
								'UPDATE users' +
								' SET email = ?' +
								' WHERE community = ? AND user = ?';
							Service.mysql_connection_pool.execute(
								stmt,
								inserts,
								(err, rows, fields) => {
									if (err) {
										console.log('Error during update of email: ', err);
										reject(
											Service.rejectResponse(
												'Error during the insertion of the email'
											)
										);
									} else {
										resolve(Service.successResponse('success'));
									}
								}
							);
						} else {
							console.log('Error during insertion of email: ', err);
							reject(
								Service.rejectResponse(
									'Error during the insertion of the email'
								)
							);
						}
					} else {
						resolve(Service.successResponse('success'));
					}
				}
			);
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});
/**
 * Set the payment information of the user
 *
 * community String The community string.
 * userId String The user
 * paymentInstructions PaymentInstructions
 * no response value expected for this operation
 * */
const setPaymentInstructions = ({ community, userId, paymentInstructions }) =>
	new Promise((resolve, reject) => {
		try {
			let inserts = [
				paymentInstructions.paymentInstructions,
				community,
				userId,
			];
			let stmt =
				'INSERT INTO users' +
				' SET paymentInstructions = ?, community = ?, user = ?';

			Service.mysql_connection_pool.execute(
				stmt,
				inserts,
				(err, rows, fields) => {
					if (err) {
						if (err.errno == 1062) {
							// duplicate primary key
							stmt =
								'UPDATE users' +
								' SET paymentInstructions = ?' +
								' WHERE community = ? AND user = ?';
							Service.mysql_connection_pool.execute(
								stmt,
								inserts,
								(err, rows, fields) => {
									if (err) {
										console.log('Error during update of paymentinfo: ', err);
										reject(
											Service.rejectResponse(
												'Error during the insertion of the payment instructions'
											)
										);
									} else {
										ws.sendCommunity(community, 'refreshOrders');
										resolve(Service.successResponse('success'));
									}
								}
							);
						} else {
							console.log('Error during insertion of paymentinfo: ', err);
							reject(
								Service.rejectResponse(
									'Error during the insertion of the payment instructions'
								)
							);
						}
					} else {
						ws.sendCommunity(community, 'refreshOrders');
						resolve(Service.successResponse('success'));
					}
				}
			);
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});

module.exports = {
	getPaymentInstructions,
	setEmail,
	setPaymentInstructions,
};
