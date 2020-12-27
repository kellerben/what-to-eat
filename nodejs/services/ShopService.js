const Service = require('./Service');
const mysql = require('mysql');
const ws = require('../ws');

/**
* Get the shop's menu
*
* community String The community string
* shopId String The menu of which shop do you want to have?
* no response value expected for this operation
* */
const getMenu = ({ community, shopId }) => new Promise(
	async (resolve, reject) => {
		shopId = shopId.trim();

		var stmt =
			"SELECT meal,price FROM meals WHERE community = ? AND shop = ?";
		var sql = mysql.format(stmt, [community, shopId]);
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
* community String The community string.
* shopId String Which shop offers the meal?
* meal String Which meal-price do you want to have?
* no response value expected for this operation
* */
const getPrice = ({ community, shopId, meal }) => new Promise(
	async (resolve, reject) => {
		try {
			shopId = shopId.trim();
			meal = meal.trim();

			var stmt = "SELECT price FROM meals WHERE community = ? AND shop = ? AND meal = ?";
			var sql = mysql.format(stmt, [community, shopId, meal]);
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
* community String The community string.
* shopId String The Metadata of which shop do you want to have?
* no response value expected for this operation
* */
const getShopData = ({ community, shopId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT * FROM shops WHERE community = ? AND shop = ?";
		shopId = shopId.trim();

		var sql = mysql.format(stmt, [community, shopId]);
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
* community String The community string
* no response value expected for this operation
* */
const getShops = ({ community }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT DISTINCT shop FROM meals WHERE community = ? UNION SELECT DISTINCT shop FROM walks WHERE community = ?;";
		var sql = mysql.format(stmt, [community, community]);
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
* community String The community string.
* shopId String The typical special requests of which shop do you want to have?
* no response value expected for this operation
* */
const getSpecialRequests = ({ community, shopId }) => new Promise(
	async (resolve, reject) => {
		var stmt =
			"SELECT specialRequest FROM specialRequests WHERE community = ? AND shop = ?";
		shopId = shopId.trim();

		var sql = mysql.format(stmt, [community, shopId]);
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
* community String The community string.
* meal String Which meal-price do you want to set?
* shopId String Which shop offers the meal?
* price BigDecimal The price of the meal
* no response value expected for this operation
* */
const setPrice = ({ community, meal, shopId, price }) => new Promise(
	async (resolve, reject) => {
		try {
			shopId = shopId.trim();
			meal = meal.trim();

			var updatePriceInOrders = function() {
				var stmt =
					"UPDATE orders SET price = ? WHERE community = ? AND shop = ? AND meal = ? AND day = ?";
				var sql = mysql.format(stmt, [price, community, shopId, meal, new Date().toISOString().slice(0,10)]);
				Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
					if (err) {
						console.error(err);
						reject(Service.rejectResponse('Error while updating orders'));
					} else {
						ws.sendCommunity(community, "refreshOrders");
						resolve(Service.successResponse('success'));
					}
				});
			}

			var stmt =
				"UPDATE meals SET price = ? WHERE community = ? AND shop = ? AND meal = ?";
			var sql = mysql.format(stmt, [price, community, shopId, meal]);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while updating orders'));
				} else {
					if (rows['affectedRows'] === 0){
						var stmt =
							"INSERT INTO meals " +
							"(community, shop, meal, price) " +
							"VALUES (?, ?, ?, ?)";

						var sql = mysql.format(stmt, [community, shopId, meal, price]);
						Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
							if (err) {
								console.error(err);
								reject(Service.rejectResponse('error'));
							} else {
								ws.sendCommunity(community, "refreshPrices");
								updatePriceInOrders();
							}
						});
					} else {
						ws.sendCommunity(community, "refreshPrices");
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
* community String The community string.
* shopId String The Metadata of the shop you want to set
* shopMetaData ShopMetaData
* no response value expected for this operation
* */
const setShopData = ({ community, shopId, shopMetaData }) => new Promise(
	async (resolve, reject) => {
		try {
			shopId = shopId.trim();
			var values = [shopMetaData.distance, shopMetaData.phone, shopMetaData.comment, community, shopId];
			var stmt =
				"UPDATE shops SET distance = ?, phone = ?, comment = ? WHERE community = ? AND shop = ?";
			var sql = mysql.format(stmt, values);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while updating orders'));
				} else {
					if (rows['affectedRows'] === 0){
						var stmt =
							"INSERT INTO shops " +
							"(distance, phone, comment, community, shop) " +
							"VALUES (?, ?, ?, ?, ?)";

						var sql = mysql.format(stmt, values);
						Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
							if (err) {
								console.error(err);
								reject(Service.rejectResponse('error'));
							} else {
								ws.sendCommunity(community, "getShopSuggestions");
								resolve(Service.successResponse('success'));
							}
						});
					} else {
						ws.sendCommunity(community, "getShopSuggestions");
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
