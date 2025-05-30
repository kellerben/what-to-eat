const Service = require('./Service');
const ws = require('../ws');
const logger = require('../logger');

/**
 * I will walk to the shop
 *
 * shopAnnouncement ShopAnnouncement
 * no response value expected for this operation
 * */
const announceShop = (req) =>
	new Promise((resolve, reject) => {
		let date;
		let shopAnnouncement = req.body;
		if (typeof shopAnnouncement.date === 'undefined') {
			date = new Date();
		} else {
			date = new Date(shopAnnouncement.date);
		}
		date = date.toISOString().slice(0, 10);
		Service.trimStrings(shopAnnouncement);

		let inserts = [
			shopAnnouncement.community,
			shopAnnouncement.userId,
			shopAnnouncement.shopId,
			date,
		];
		let stmt =
			'INSERT INTO walks ' + ' SET community = ?, user = ?, shop = ?, day = ?';

		Service.mysql_connection_pool.execute(
			stmt,
			inserts,
			(err, rows, fields) => {
				if (err) {
					if (err.errno == 1062) {
						// duplicate primary key
						resolve(
							Service.rejectResponse('This announcement was already made.', 400)
						);
					} else {
						logger.error('Error during insertion of the announcement: ', err);
						reject(
							Service.rejectResponse(
								'Error during insertion of the announcement'
							)
						);
					}
				} else {
					ws.sendCommunity(shopAnnouncement.community, 'getShopAnnouncements');
					resolve(Service.successResponse('success'));
				}
			}
		);
	});
/**
 * I will not walk to the shop
 *
 * shopAnnouncement ShopAnnouncement
 * no response value expected for this operation
 * */
const deleteShopAnnouncement = (req) =>
	new Promise((resolve, reject) => {
		try {
			let date;
			let shopAnnouncement = req.body;
			if (typeof shopAnnouncement.date === 'undefined') {
				date = new Date();
			} else {
				date = new Date(shopAnnouncement.date);
			}
			date = date.toISOString().slice(0, 10);
			Service.trimStrings(shopAnnouncement);

			let stmt =
				'DELETE FROM walks' +
				' WHERE community = ? AND user = ? AND shop = ? AND day = ?';
			let vars = [
				shopAnnouncement.community,
				shopAnnouncement.userId,
				shopAnnouncement.shopId,
				date,
			];
			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
				if (err) {
					logger.error(err);
					reject(Service.rejectResponse('error'));
				} else {
					if (rows['affectedRows'] === 0) {
						reject(
							Service.rejectResponse("User didn't announced this shop yet", 404)
						);
					} else {
						ws.sendCommunity(
							shopAnnouncement.community,
							'getShopAnnouncements'
						);
						resolve(Service.successResponse('success'));
					}
				}
			});
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});
/**
 * Get all shop announcements
 *
 * community String The community string
 * date date For which day do you want to get the shop announcements? (optional)
 * no response value expected for this operation
 * */
const getShopAnnouncements = ({ community, date }) =>
	new Promise((resolve, reject) => {
		try {
			if (typeof date === 'undefined') {
				date = new Date();
			} else {
				date = new Date(date);
			}
			date = date.toISOString().slice(0, 10);
			let stmt = 'SELECT user,shop FROM walks WHERE community = ? AND day = ?';
			let vars = [community, date];
			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
				if (err) {
					logger.error(err);
					reject(Service.rejectResponse('Error while fetching orders'));
				} else {
					resolve(
						Service.successResponse({
							rows,
						})
					);
				}
			});
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});

module.exports = {
	announceShop,
	deleteShopAnnouncement,
	getShopAnnouncements,
};
