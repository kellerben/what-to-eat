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
		var date;
		if (typeof(shopAnnouncement.date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(shopAnnouncement.date);
		}
		date = date.toISOString().slice(0,10);
		Service.trimStrings(shopAnnouncement);

		var inserts = [shopAnnouncement.community, shopAnnouncement.userId, shopAnnouncement.shopId, date];
		var stmt =
			"INSERT INTO walks " +
			"(community, user, shop, day) " +
			"VALUES (?, ?, ?, ?)";

		var sql = mysql.format(stmt, inserts);
		Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
			if (err) {
				if (err.errno == 1062) { // duplicate primary key
					resolve(Service.rejectResponse('This announcement was already made.', 400));
				} else {
					console.log('Error during insertion of the announcement: ', err);
					reject(Service.rejectResponse('Error during insertion of the announcement'));
				}
			} else {
				ws.sendCommunity(shopAnnouncement.community, "getShopAnnouncements");
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
			var date;
			if (typeof(shopAnnouncement.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(shopAnnouncement.date);
			}
			date = date.toISOString().slice(0,10);
			Service.trimStrings(shopAnnouncement);

			var statement = "DELETE FROM walks WHERE community = ? AND user = ? AND shop = ? AND day = ?";
			var sql = mysql.format(statement, [shopAnnouncement.community, shopAnnouncement.userId, shopAnnouncement.shopId, date]);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('error'));
				} else {
					if (rows['affectedRows'] === 0){
						reject(Service.rejectResponse("User didn't announced this shop yet", 404));
					} else {
						ws.sendCommunity(shopAnnouncement.community, "getShopAnnouncements");
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
* Get all shop announcements
*
* community String The community string
* date date For which day do you want to get the shop announcements? (optional)
* no response value expected for this operation
* */
const getShopAnnouncements = ({ community, date }) => new Promise(
	async (resolve, reject) => {
		try {
			if (typeof(date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(date);
			}
			date = date.toISOString().slice(0,10);
			var stmt =
				"SELECT user,shop FROM walks WHERE community = ? AND day = ?";
			var sql = mysql.format(stmt, [community, date]);
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
	announceShop,
	deleteShopAnnouncement,
	getShopAnnouncements,
};
