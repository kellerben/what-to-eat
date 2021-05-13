const mysql = require('mysql2');
const fs = require('fs');
const DB_PASSWD = '/run/secrets/db_user_pw';
const db_user_passwd = fs.readFileSync(DB_PASSWD, 'UTF-8').trim();

class Service {
	static rejectResponse(error, code = 500) {
		return { error, code };
	}

	static successResponse(payload, code = 200) {
		return { payload, code };
	}

	static mysql_connection_pool = mysql.createPool({
		"host": "mariadb",
		"database": "lunch",
		"user": "lunch",
		"password": db_user_passwd,
		"charset": "utf8mb4"
	});

	static trimStrings(object) {
		for (const key in object) {
			if (typeof(object[key]) == 'string') {
				object[key] = object[key].trim();
			}
		}
	}
}

module.exports = Service;
