/* eslint-disable no-unused-vars */
const Service = require('./Service');
const mysql = require('mysql');
const ws = require('../ws');

/**
* I will walk to the shop
*
* shopAnnouncement ShopAnnouncement
* no response value expected for this operation
* */
const announceShop = ({ shopAnnouncement }) => new Promise(
	async (resolve, reject) => {
		if (typeof(shopAnnouncement.date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(shopAnnouncement.date);
		}
		date = date.toISOString().slice(0,10);
		var inserts = [shopAnnouncement.userId, shopAnnouncement.shopId, date];
		var stmt =
			"INSERT INTO walks " +
			"(user, shop, day) " +
			"VALUES (?, ?, ?)";

		var sql = mysql.format(stmt, inserts);
		Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
			if (err) {
				console.error(err);
				reject(Service.rejectResponse('Error during insertion'));
			} else {
				ws.sendAll("getShopAnnouncements");
				resolve(Service.successResponse('success'));
			}
		});
	}
);
/**
* I will not walk to the shop
*
* shopAnnouncement ShopAnnouncement
* no response value expected for this operation
* */
const deleteShopAnnouncement = ({ shopAnnouncement }) => new Promise(
	async (resolve, reject) => {
		try {
			if (typeof(shopAnnouncement.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(shopAnnouncement.date);
			}
			date = date.toISOString().slice(0,10);
			var statement = "DELETE FROM walks WHERE user = ? AND shop = ? AND day = ?";
			var sql = mysql.format(statement, [shopAnnouncement.userId, shopAnnouncement.shopId, date]);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('error'));
				} else {
					if (rows['affectedRows'] === 0){
						reject(Service.rejectResponse("User didn't announced this shop yet", 404));
					} else {
						ws.sendAll("getShopAnnouncements");
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
	}
);
/**
* Get the shop's menu
*
* shopId String The menu of which shop do you want to have?
* no response value expected for this operation
* */
const getMenu = ({ shopId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT meal,price FROM meals WHERE shop = ?";
		var sql = mysql.format(stmt, [shopId]);
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching meals'));
				} else {
					resolve(Service.successResponse(rows));
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
* Get all orders which are not payed yet
*
* no response value expected for this operation
* */
const getOpenPayments = () => new Promise(
	async (resolve, reject) => {
		var sql =
			"SELECT orders.shop,walks.user AS to_user,orders.user AS from_user,price,orders.shop,orders.meal,orders.day " +
			"FROM orders,walks " +
			"WHERE walks.day = orders.day AND walks.shop = orders.shop AND walks.user != orders.user " +
			"ORDER BY walks.day";
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
* Get all orders of one day
*
* date date For which day do you want to get the orders? (optional)
* no response value expected for this operation
* */
const getOrdersOfDay = ({ date }) => new Promise(
	async (resolve, reject) => {
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		var stmt =
			"SELECT shop,user,meal,price FROM orders WHERE day = ?";
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
* Get price of a meal
*
* shopId String Which shop offers the meal?
* meal String Which meal-price do you want to have?
* no response value expected for this operation
* */
const getPrice = ({ shopId, meal }) => new Promise(
	async (resolve, reject) => {
		try {
			var stmt = "SELECT price FROM meals WHERE shop = ? AND meal = ?";
			var sql = mysql.format(shopId, meal);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching orders'));
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
	}
);
/**
* Get all shop announcements
*
* date date For which day do you want to get the shop announcements? (optional)
* no response value expected for this operation
* */
const getShopAnnouncements = ({ date }) => new Promise(
	async (resolve, reject) => {
		try {
			if (typeof(date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(date);
			}
			date = date.toISOString().slice(0,10);
			var stmt =
				"SELECT user,shop FROM walks WHERE day = ?";
			var sql = mysql.format(stmt, [date]);
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
* Get all known shops
*
* no response value expected for this operation
* */
const getShops = () => new Promise(
	async (resolve, reject) => {
		var sql =
			"SELECT DISTINCT shop FROM meals";
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching shops'));
				} else {
					var res = [];
					rows.forEach(function(elem){ res.push(elem.shop) })
					resolve(Service.successResponse(res));
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
* Set price of a meal
*
* shopId String Which shop offers the meal?
* meal String Which meal-price do you want to set?
* price BigDecimal The price of the meal
* no response value expected for this operation
* */
const setPrice = ({ shopId, meal, price }) => new Promise(
	async (resolve, reject) => {
		try {

			var updatePriceInOrders = function() {
				var stmt =
					"UPDATE orders SET price = ? WHERE shop = ? AND meal = ? AND day = ?";
				var sql = mysql.format(stmt, [price, shopId, meal, new Date().toISOString().slice(0,10)]);
				Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
					if (err) {
						console.error(err);
						reject(Service.rejectResponse('Error while updating orders'));
					} else {
						ws.sendAll("refreshOrders");
						resolve(Service.successResponse('success'));
					}
				});
			}

			var stmt =
				"UPDATE meals SET price = ? WHERE shop = ? AND meal = ?";
			var sql = mysql.format(stmt, [price, shopId, meal]);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while updating orders'));
				} else {
					if (rows['affectedRows'] === 0){
						var stmt =
							"INSERT INTO meals " +
							"(shop, meal, price) " +
							"VALUES (?, ?, ?)";

						var sql = mysql.format(stmt, [shopId, meal, price]);
						Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
							if (err) {
								console.error(err);
								reject(Service.rejectResponse('error'));
							} else {
								ws.sendAll("refreshPrices");
								updatePriceInOrders();
							}
						});
					} else {
						ws.sendAll("refreshPrices");
						updatePriceInOrders();
					}
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
	announceShop,
	deleteShopAnnouncement,
	getMenu,
	getOpenPayments,
	getOrdersOfDay,
	getPrice,
	getShopAnnouncements,
	getShopOrders,
	getShops,
	setPrice,
};
