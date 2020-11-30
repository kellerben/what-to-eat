/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Get all orders which are not payed yet
*
* no response value expected for this operation
* */
const getOpenPayments = () => new Promise(
	async (resolve, reject) => {
		var sql =
			"SELECT orders.user AS from_user,walks.user AS to_user,price,orders.shop,orders.shop,orders.meal,orders.day " +
			"FROM orders,walks " +
			"WHERE walks.day = orders.day AND walks.shop = orders.shop AND walks.user != orders.user " +
			"ORDER BY to_user,from_user";
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
