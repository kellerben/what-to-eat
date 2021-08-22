const mysql = require('mysql2');
const fs = require('fs');
const DB_PASSWD = '/run/secrets/db_user_pw';
const db_user_passwd = fs.readFileSync(DB_PASSWD, 'UTF-8').trim();

const nodemailer = require('nodemailer');
const nodemailerCramMd5 = require('nodemailer-cram-md5');
const smtp_config = JSON.parse(
	fs.readFileSync('/run/secrets/smtprc.json', 'UTF-8')
);
smtp_config.transport.customAuth = {
	"CRAM-MD5": nodemailerCramMd5
}
mail_transporter = nodemailer.createTransport(smtp_config.transport)


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


	static sendMail(to, subject, body) {
		mail_transporter.sendMail({
			from: smtp_config.from,
			to: to,
			subject: subject,
			text: body
		}, function (err, info){
			if (err) {
				console.log(
					'Error while sending mail: ', err, info
				);
			}
		})
	}

	static trimStrings(object) {
		for (const key in object) {
			if (typeof(object[key]) == 'string') {
				object[key] = object[key].trim();
			}
		}
	}
}

module.exports = Service;
