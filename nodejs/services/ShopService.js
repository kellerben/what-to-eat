const Service = require('./Service');
const mysql = require('mysql');
const ws = require('../ws');

/**
* Get the shop's menu
*
* shopId String The menu of which shop do you want to have?
* no response value expected for this operation
* */
const getMenu = ({ shopId }) => new Promise(
	async (resolve, reject) => {
		shopId = shopId.trim();

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
* Get price of a meal
*
* shopId String Which shop offers the meal?
* meal String Which meal-price do you want to have?
* no response value expected for this operation
* */
const getPrice = ({ shopId, meal }) => new Promise(
	async (resolve, reject) => {
		try {
			shopId = shopId.trim();
			meal = meal.trim();

			var stmt = "SELECT price FROM meals WHERE shop = ? AND meal = ?";
			var sql = mysql.format(stmt, [shopId, meal]);
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
* Get the shop's metadata
*
* shopId String The Metadata of which shop do you want to have?
* no response value expected for this operation
* */
const getShopData = ({ shopId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT * FROM shops WHERE shop = ?";
		shopId = shopId.trim();

		var sql = mysql.format(stmt, [shopId]);
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching shop details'));
				} else {
					if (rows.length == 0) {
						resolve({});
					} else {
						resolve(rows[0]);
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
* Get all known shops
*
* no response value expected for this operation
* */
const getShops = () => new Promise(
	async (resolve, reject) => {
		var sql =
			"SELECT DISTINCT shop FROM meals UNION SELECT DISTINCT shop FROM walks;";
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
* Get typical special requests of the shop
*
* shopId String The typical special requests of which shop do you want to have?
* no response value expected for this operation
* */
const getSpecialRequests = ({ shopId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT specialRequest FROM specialRequests WHERE shop = ?";
		shopId = shopId.trim();

		var sql = mysql.format(stmt, [shopId]);
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching special requests'));
				} else {
					var res = [];
					rows.forEach(function(elem){ res.push(elem.specialRequest) })
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
			shopId = shopId.trim();
			meal = meal.trim();

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
/**
* Set the shop's metadata
*
* shopId String The Metadata of the shop you want to set
* shopMetaData ShopMetaData
* no response value expected for this operation
* */
const setShopData = ({ shopId, shopMetaData }) => new Promise(
	async (resolve, reject) => {
		try {
			shopId = shopId.trim();
			var values = [shopMetaData.distance, shopMetaData.phone, shopMetaData.comment, shopId];
			var stmt =
				"UPDATE shops SET distance = ?, phone = ?, comment = ? WHERE shop = ?";
			var sql = mysql.format(stmt, values);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while updating orders'));
				} else {
					if (rows['affectedRows'] === 0){
						var stmt =
							"INSERT INTO shops " +
							"(distance, phone, comment, shop) " +
							"VALUES (?, ?, ?, ?)";

						var sql = mysql.format(stmt, values);
						Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
							if (err) {
								console.error(err);
								reject(Service.rejectResponse('error'));
							} else {
								ws.sendAll("getShopSuggestions");
								resolve(Service.successResponse('success'));
							}
						});
					} else {
						ws.sendAll("getShopSuggestions");
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
	getMenu,
	getPrice,
	getShopData,
	getShops,
	getSpecialRequests,
	setPrice,
	setShopData,
};
