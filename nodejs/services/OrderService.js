const Service = require('./Service');
const mysql = require('mysql');
const ws = require('../ws');

/**
* delete an order
*
* userId String User of whom the order should be deleted.
* mealOrder MealOrder  (optional)
* no response value expected for this operation
* */
const deleteOrder = ({ userId, mealOrder }) => new Promise(
	async (resolve, reject) => {
		try {
			var date;
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			var statement = "DELETE FROM orders WHERE user = ? AND day = ?";
			var inputs = [userId, date];
			if (typeof(mealOrder.shopId) !== 'undefined') {
				statement += " AND shop = ?";
				inputs.push(mealOrder.shopId);
			} else {
				statement += " AND shop is NULL";
			}
			if (typeof(mealOrder.meal) !== 'undefined') {
				statement += " AND meal = ?";
				inputs.push(mealOrder.meal);
			} else {
				statement += " AND meal is NULL";
			}
			if (typeof(mealOrder.price) !== 'undefined') {
				statement += " AND price = ?";
				inputs.push(mealOrder.price);
			} else {
				statement += " AND price is NULL";
			}

			var sql = mysql.format(statement, inputs);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.log('Error during deletion of order: ', err);
					reject(Service.rejectResponse('Error during deletion of order'));
				} else {
					if (rows['affectedRows'] === 0){
						reject(Service.rejectResponse("This order was not placed", 404));
					} else {
						// FIXME: not the best way to log deletions
						// would be better to make this accessible and delete it after a while
						console.log(sql);
						ws.sendAll("refreshOrders");
						resolve(Service.successResponse('success'));
					}
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
* Get all orders of one day
*
* date date For which day do you want to get the orders? (optional)
* no response value expected for this operation
* */
const getOrdersOfDay = ({ date }) => new Promise(
	async (resolve, reject) => {
		var date;
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		var stmt =
			"SELECT shop,user,meal,specialRequest,price FROM orders WHERE day = ? ORDER BY shop,meal,specialRequest";
		var sql = mysql.format(stmt, [date]);
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
/**
* Get all orders of one shop
*
* shopId String Which shop orders do you want to have?
* date date For which day do you want to get the orders? (optional)
* no response value expected for this operation
* */
const getShopOrders = ({ shopId, date }) => new Promise(
	async (resolve, reject) => {
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		shopId = shopId.trim();

		var stmt =
			"SELECT user,meal,price FROM orders WHERE shop = ? AND day = ?";
		var sql = mysql.format(stmt, [shopId, date]);
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
/**
* Order lunch
*
* userId String Who wants to order something?
* mealOrder MealOrder
* no response value expected for this operation
* */
const orderLunch = ({ userId, mealOrder }) => new Promise(
	async (resolve, reject) => {
		try {
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);
			userId = userId.trim();


			var stmt =
				"INSERT INTO specialRequests" +
				" (shop, specialRequest)" +
				" VALUES (?, ?)";

			var sql = mysql.format(stmt, [mealOrder.shopId, mealOrder.specialRequest]);
			Service.mysql_connection_pool.query(sql);

			var inserts = [userId, mealOrder.shopId, mealOrder.meal, mealOrder.specialRequest, mealOrder.price, date];
			var stmt =
				"INSERT INTO orders" +
				" (user, shop, meal, specialRequest, price, day)" +
				" VALUES (?, ?, ?, ?, ?, ?)";

			var sql = mysql.format(stmt, inserts);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.log('Error during insertion of order: ', err);
					reject(Service.rejectResponse(mealOrder));
				} else {
					ws.sendAll("refreshOrders");
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
/**
* Change an order
*
* userId String Who wants to order something?
* mealOrder MealOrder
* no response value expected for this operation
* */
const updateOrder = ({ userId, mealOrder }) => new Promise(
	async (resolve, reject) => {
		try {
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);
			userId = userId.trim();

			var stmt, sql;
			if (typeof(price) === 'undefined') {
				stmt =
					"UPDATE orders " +
					"SET shop = ?, meal = ? " +
					"WHERE user = ? AND day = ?";
				sql = mysql.format(stmt, [mealOrder.shopId, mealOrder.meal, userId, date]);
			} else {
				stmt =
					"UPDATE orders " +
					"SET shop = ?, meal = ?, price = ? " +
					"WHERE user = ? AND day = ?";
				sql = mysql.format(stmt, [shopId, meal, price, userId, date]);
			}

			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.log('Error during insertion of order: ', err);
					reject(Service.rejectResponse('Error during insertion of order'));
				} else {
					if (rows['affectedRows'] === 0){
						reject(Service.rejectResponse("User didn't ordered anything yet"));
					} else {
						ws.sendAll("refreshOrders");
						resolve(Service.successResponse('success'));
					}
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
	deleteOrder,
	getOrdersOfDay,
	getShopOrders,
	orderLunch,
	updateOrder,
};
