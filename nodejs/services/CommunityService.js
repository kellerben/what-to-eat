const Service = require('./Service');

/**
 * Get the community information
 *
 * community String The community string.
 * no response value expected for this operation
 * */
const getCommunityInformation = ({ community }) =>
	new Promise((resolve, reject) => {
		let stmt = 'SELECT * FROM communities WHERE community = ?';
		try {
			Service.mysql_connection_pool.execute(
				stmt,
				[community],
				(err, rows, fields) => {
					if (err) {
						console.error(err);
						reject(
							Service.rejectResponse(
								'Error while fetching community properties'
							)
						);
					} else {
						if (rows.length == 0) {
							reject(
								Service.rejectResponse('The community was not found', 404)
							);
						} else {
							resolve(Service.successResponse(rows[0]));
						}
					}
				}
			);
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});
/**
 * Set the community information
 *
 * community String The community string.
 * communityInformation CommunityInformation
 * no response value expected for this operation
 * */
const setCommunityInformation = ({ community, communityInformation }) =>
	new Promise((resolve, reject) => {
		try {
			Service.trimStrings(communityInformation);
			let stmt = 'UPDATE communities SET lat = ?, lng = ? WHERE community = ?';
			let values = [
				communityInformation.lat,
				communityInformation.lng,
				community,
			];
			Service.mysql_connection_pool.execute(
				stmt,
				values,
				(err, rows, fields) => {
					if (err) {
						console.error(err);
						reject(
							Service.rejectResponse('Error while setting communityInformation')
						);
					} else {
						if (rows['affectedRows'] === 0) {
							let stmt =
								'INSERT INTO communities SET lat = ?, lng = ?, community = ?';

							Service.mysql_connection_pool.execute(
								stmt,
								values,
								(err, rows, fields) => {
									if (err) {
										console.error(err);
										reject(
											Service.rejectResponse(
												'Error while inserting community information'
											)
										);
									} else {
										resolve(Service.successResponse('Success'));
									}
								}
							);
						} else {
							resolve(Service.successResponse('Success'));
						}
					}
				}
			);
		} catch (e) {
			reject(
				Service.rejectResponse(e.message || 'Invalid input', e.status || 405)
			);
		}
	});

module.exports = {
	getCommunityInformation,
	setCommunityInformation,
};
