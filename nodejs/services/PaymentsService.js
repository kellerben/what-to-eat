/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Get open or closed payments
*
* community String The community string.
* from String Payment sender (optional)
* to String Payment receiver (optional)
* states List Show only payments of these states (optional)
* no response value expected for this operation
* */
const getPayments = ({ community, from, to, states }) => new Promise(
	async (resolve, reject) => {
		let statement =
			"SELECT " +
			" orders.user AS from_user," +
			" walks.user AS to_user," +
			" price," +
			" orders.shop," +
			" orders.meal," +
			" orders.day," +
			" orders.state" +
			" FROM orders, walks " +
			" WHERE" +
			" orders.community = ? AND walks.community = ?" +
			" AND walks.day = orders.day AND walks.shop = orders.shop" +
			" AND walks.user != orders.user ";
		let vars = [ community, community ];
		if (typeof states == "undefined") {
			states = [];
		}
		if (states.length > 0){
			statement += "AND (";
			statement += Array.apply('', Array(states.length)).map(
				() => ' orders.state = ? '
			).join(' OR ');
			statement += ")";
			vars = vars.concat(states);
		}
		let additionalQueries = [];
		if (typeof from !== "undefined") {
			additionalQueries.push(" orders.user = ?");
			vars.push(from);
		}
		if (typeof to !== "undefined") {
			additionalQueries.push(" walks.user = ?");
			vars.push(to);
		}
		if (additionalQueries.length > 0){
			statement += " AND (  " +additionalQueries.join(' OR ') + ")";
		}
		try {
			Service.mysql_connection_pool.execute(statement, vars, (err, rows, fields) => {
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
module.exports = {
	getPayments,
};
