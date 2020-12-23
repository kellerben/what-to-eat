/* eslint-disable no-unused-vars */
const Service = require('./Service');
const mysql = require('mysql');

/**
* Get all orders which are not payed yet
*
* community String The community string.
* no response value expected for this operation
* */
const getOpenPayments = ({ community }) => new Promise(
	async (resolve, reject) => {
		var statement =
			"SELECT orders.user AS from_user,walks.user AS to_user,price,orders.shop,orders.shop,orders.meal,orders.day " +
			"FROM orders,walks " +
			"WHERE orders.community = ? AND orders.community = ? AND walks.day = orders.day AND walks.shop = orders.shop AND walks.user != orders.user " +
			"ORDER BY to_user,from_user";
		var sql = mysql.format(statement, [ community, community ]);
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching orders'));
				} else {
					resolve(Service.successResponse({
						rows
					}));
				}
			});
		} catch (e) {
			reject(Service.rejectResponse(
				e.message || 'Invalid input',
				e.status || 405,
			));
		}
	}
);
module.exports = {
	getOpenPayments,
};
