/* eslint-disable no-unused-vars */
const Service = require('./Service');
const mysql = require('mysql');

/**
* Get the community information
*
* community String The community string.
* no response value expected for this operation
* */
const getCommunityInformation = ({ community }) => new Promise(
	async (resolve, reject) => {
		var stmt = "SELECT * FROM communities WHERE community = ?";
		var sql = mysql.format(stmt, [community]);
		try {
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while fetching community properties'));
				} else {
					if (rows.length == 0) {
						reject(Service.rejectResponse('The community was not found',404));
					} else {
						resolve(Service.successResponse(rows[0]));
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
* Set the community information
*
* community String The community string.
* communityInformation CommunityInformation
* no response value expected for this operation
* */
const setCommunityInformation = ({ community, communityInformation }) => new Promise(
	async (resolve, reject) => {
		try {
			Service.trimStrings(communityInformation);
			var values = [communityInformation.lat, communityInformation.lng, community];
			var stmt =
				"UPDATE communities SET lat = ?, lng = ? WHERE community = ?";
			var sql = mysql.format(stmt, values);
			Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
				if (err) {
					console.error(err);
					reject(Service.rejectResponse('Error while setting communityInformation'));
				} else {
					if (rows['affectedRows'] === 0){
						var stmt =
							"INSERT INTO communities " +
							"(lat, lng, community) " +
							"VALUES (?, ?, ?)";

						var sql = mysql.format(stmt, values);
						Service.mysql_connection_pool.query(sql, function (err, rows, fields) {
							if (err) {
								console.error(err);
								reject(Service.rejectResponse('error'));
							} else {
								resolve(Service.successResponse('success'));
							}
						});
					} else {
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
	getCommunityInformation,
	setCommunityInformation,
};
