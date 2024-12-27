const Service = require('./Service');
const ws = require('../ws');

/**
 * Get all orders of one day
 *
 * community String The community string
 * date date For which day do you want to get the orders? (optional)
 * no response value expected for this operation
 * */
const getOrdersOfDay = ({
	community,
	date
}) => new Promise(
	async (resolve, reject) => {
		let date;
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		let stmt =
			"SELECT shop, user, meal, specialRequest, price, state" +
			" FROM orders WHERE community = ? AND day = ?" +
			" ORDER BY shop, meal, specialRequest";
		let vars = [community, date];
		try {
			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
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
const getShopOrders = ({
	community,
	shopId,
	date
}) => new Promise(
	async (resolve, reject) => {
		if (typeof(date) === 'undefined') {
			date = new Date();
		} else {
			date = new Date(date);
		}
		date = date.toISOString().slice(0,10);
		shopId = shopId.trim();

		let stmt =
			"SELECT user,meal,price FROM orders" +
			" WHERE community = ? AND shop = ? AND day = ?";
		let vars = [community, shopId, date];
		try {
			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
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
const orderLunch = ({
	mealOrder
}) => new Promise(
	async (resolve, reject) => {
		try {
			let date;
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);

			let stmt, vars;
			if (mealOrder.specialRequest != "") {
				stmt =
					"INSERT INTO specialRequests" +
					" SET community = ?, shop = ?, specialRequest = ?";

				vars = [
					mealOrder.community, mealOrder.shopId, mealOrder.specialRequest
				];
				Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
					if (err && err.errno != 1062) { // 1062 := duplicate primary key, nothing to do
						console.log('Error during insertion of order: ', err);
						reject(Service.rejectResponse('Error during insertion of order'));
					}
				});
			}

			stmt =
				"INSERT INTO orders" +
				" SET community = ?," +
				" user = ?," +
				" shop = ?," +
				" meal = ?," +
				" specialRequest = ?," +
				" day = ?," +
				" state = 'NEW'";
			let inserts = [
				mealOrder.community,
				mealOrder.userId,
				mealOrder.shopId,
				mealOrder.meal,
				mealOrder.specialRequest,
				date
			];
			if (typeof(mealOrder.price) !== 'undefined') {
				stmt += ", price = ?";
				inserts.push(mealOrder.price);
			}

			Service.mysql_connection_pool.execute(stmt, inserts, (err, rows, fields) => {
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
 * Change price, special request or state of an order
 *
 * mealOrder MealOrder 
 * no response value expected for this operation
 * */
const updateOrder = ({
	mealOrder
}) => new Promise(
	async (resolve, reject) => {
		try {
			let date;
			if (typeof(mealOrder.date) === 'undefined') {
				date = new Date();
			} else {
				date = new Date(mealOrder.date);
			}
			date = date.toISOString().slice(0,10);

			Service.trimStrings(mealOrder);

			let stmt = "UPDATE orders SET day = ?";
			let vars = [date];
			if (typeof(mealOrder.price) !== 'undefined') {
				stmt += ",price = ?";
				vars.push(mealOrder.price);
			}
			if (typeof(mealOrder.specialRequest) !== 'undefined') {
				stmt += ",specialRequest = ?";
				vars.push(mealOrder.specialRequest);
			}
			if (typeof(mealOrder.state) !== 'undefined') {

				if (mealOrder.state === "PAID") {
					// notify users via e-mail
					let s = "SELECT users.user,users.email,orders.price" +
						" FROM users,orders" +
						" WHERE users.community = ?" +
						" AND orders.community = ?" +
						" AND orders.shop = ?" +
						" AND orders.day = ?" +
						" AND orders.meal = ?" +
						" AND orders.user = ?" +
						" AND users.user = (SELECT user FROM walks " +
						" WHERE community = ? AND shop = ? AND day = ?)"
					let v = [
						mealOrder.community,
						mealOrder.community,
						mealOrder.shopId,
						mealOrder.date,
						mealOrder.meal,
						mealOrder.userId,
						mealOrder.community,
						mealOrder.shopId,
						mealOrder.date
					]

					Service.mysql_connection_pool.execute(s, v, (err, rows, fields) => {
						if (err) {
							console.log(
								'Error during SQL-query for sendmail of payment: ', err
							);
						} else {
							if (rows[0]) {
								let receiver = {
									user: rows[0].user,
									email: rows[0].email
								}
								let sender = {
									user: mealOrder.userId,
									email: ""
								}
								let price = rows[0].price;

								// get receiver mail
								let s = "SELECT email FROM users" +
									" WHERE community = ?" +
									" AND user = ?";
								let v = [
									mealOrder.community,
									mealOrder.userId,
								]

								let subject = `Transaction Notification: ` +
								 `${sender.user} paid ${price} ct to ${receiver.user}`;
								let body =
									`My esteemed guests ${receiver.user} and ${sender.user},\n\n` +
									`I trust this message finds you in the very best of spirits. ` +
									`It is my distinct pleasure to inform you that the meal ` +
									`(${mealOrder.meal}), which ${receiver.user} graciously collected on ` +
									`${mealOrder.date} from ${mealOrder.shopId}, has now been marked as paid.\n\n` +
									`Accordingly, ${receiver.user} has received the amount of ` +
									`${price} ct from ${sender.user}.\n\n` +
									`Should you have any further inquiries, kindly direct them to the respective ` +
									`staff of ${receiver.user} or ${sender.user}.\n\n` +
									`I remain, as always, your humble and obedient servant,\n` +
									`Wilfred, your loyal butler.`;

								Service.mysql_connection_pool.execute(s, v, (err, rows, fields) => {
									if (err) {
										console.log(
											'Error during SQL-query for sendmail of payment: ', err
										);
									} else {
										if (rows[0]) {
											sender["email"] = rows[0].email;
											// notify the user who did the payment
											if (sender.email) {
												Service.sendMail(sender.email, subject, body,
													function (err, info){
														if (err) {
															console.log(
																'Error while sending mail: ', err, info
															);
														}
													});
											}
										}
									}
								});

								// notify the user who should have received the payment
								if (receiver.email) {
									Service.sendMail(receiver.email, subject, body,
										function (err, info){
											if (err) {
												console.log(
													'Error while sending mail: ', err, info
												);
											}
										});
								}
							}
						}
					});

				}

				stmt += ",state = ? ";
				vars.push(mealOrder.state);
			}
			stmt += "WHERE community = ?" +
				" AND shop = ? " +
				" AND user = ? " +
				" AND day = ? " +
				" AND meal = ?";
			vars.push(
				mealOrder.community,
				mealOrder.shopId,
				mealOrder.userId,
				date,
				mealOrder.meal
			);

			Service.mysql_connection_pool.execute(stmt, vars, (err, rows, fields) => {
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
