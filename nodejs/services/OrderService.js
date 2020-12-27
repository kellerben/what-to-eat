const Service = require('./Service');
const mysql = require('mysql');
const ws = require('../ws');

/**
* Get all orders of one day
*
* community String The community string
* date date For which day do you want to get the orders? (optional)
* no response value expected for this operation
* */
const getOrdersOfDay = ({ community, date }) => new Promise(
	async (resolve, reject) => {
		var date;
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		var stmt =
			"SELECT shop,user,meal,specialRequest,price FROM orders WHERE community = ? AND day = ? AND state != 'DISCARDED' ORDER BY shop,meal,specialRequest";
		var sql = mysql.format(stmt, [community, date]);
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
	},
);
/**
* Get all orders of one shop
*
* community String The community string
* shopId String Which shop orders do you want to have?
* date date For which day do you want to get the orders? (optional)
* no response value expected for this operation
* */
const getShopOrders = ({ community, shopId, date }) => new Promise(
	async (resolve, reject) => {
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		shopId = shopId.trim();

		var stmt =
			"SELECT user,meal,price FROM orders WHERE community = ? AND shop = ? AND day = ?";
		var sql = mysql.format(stmt, [community, shopId, date]);
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
	},
);
/**
* Order lunch
*
* mealOrder MealOrder
* no response value expected for this operation
* */
const orderLunch = ({ mealOrder }) => new Promise(
	async (resolve, reject) => {
		try {
			var date;
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);

			var stmt, sql;
			if (mealOrder.specialRequest != "") {
				stmt =
					"INSERT INTO specialRequests" +
					" (community, shop, specialRequest)" +
					" VALUES (?, ?, ?)";

				sql = mysql.format(stmt, [mealOrder.community, mealOrder.shopId, mealOrder.specialRequest]);
				Service.mysql_connection_pool.query(sql);
			}

			var inserts = [mealOrder.community, mealOrder.userId, mealOrder.shopId, mealOrder.meal, mealOrder.specialRequest, mealOrder.price, date];
			stmt =
				"INSERT INTO orders" +
				" (community, user, shop, meal, specialRequest, price, day, state)" +
				" VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW')";

			sql = mysql.format(stmt, inserts);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					if (err.errno == 1062) { // duplicate primary key
						resolve(Service.rejectResponse('This order was already placed.', 400));
					} else {
						console.log('Error during insertion of order: ', err);
						reject(Service.rejectResponse('Error during insertion of order'));
					}
				} else {
					ws.sendCommunity(mealOrder.community, "refreshOrders");
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
* mealOrder MealOrder
* no response value expected for this operation
* */
const updateOrder = ({ mealOrder }) => new Promise(
	async (resolve, reject) => {
		try {
			var date;
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);

			var stmt = "UPDATE orders SET day = ?";
			var vars = [date];
			if (typeof(mealOrder.price) !== 'undefined') {
				stmt += ",price = ?";
				vars.push(mealOrder.price);
			}
			if (typeof(mealOrder.specialRequest) !== 'undefined') {
				stmt += ",specialRequest = ?";
				vars.push(mealOrder.specialRequest);
			}
			if (typeof(mealOrder.state) !== 'undefined') {
				stmt += ",state = ? ";
				vars.push(mealOrder.state);
			}
			stmt += "WHERE community = ? AND shop = ? AND user = ? AND day = ? AND meal = ?";
			vars.push(mealOrder.community, mealOrder.shopId, mealOrder.userId, date, mealOrder.meal);
			var sql = mysql.format(stmt, vars);

			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.log('Error during insertion of order: ', err);
					reject(Service.rejectResponse('Error during insertion of order'));
				} else {
					if (rows['affectedRows'] === 0){
						reject(Service.rejectResponse("User didn't ordered anything yet"));
					} else {
						ws.sendCommunity(mealOrder.community, "refreshOrders");
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
	getOrdersOfDay,
	getShopOrders,
	orderLunch,
	updateOrder,
};
