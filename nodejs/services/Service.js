const mysql = require('mysql2');
const fs = require('fs');
const nodemailer = require('nodemailer');
const nodemailerCramMd5 = require('nodemailer-cram-md5');
const jsYaml = require('js-yaml');

const DB_PASSWD = '/run/secrets/db_user_pw';
const db_user_passwd = fs.readFileSync(DB_PASSWD, 'UTF-8').trim();

const smtp_config = jsYaml.safeLoad(
	fs.readFileSync('/run/secrets/smtprc.yaml', 'UTF-8')
);
smtp_config.transport.customAuth = {
	'CRAM-MD5': nodemailerCramMd5,
};

class Service {
	static init() {
		this.mysql_connection_pool = mysql.createPool({
			host: 'mariadb',
			database: 'lunch',
			user: 'lunch',
			password: db_user_passwd,
			charset: 'utf8mb4',
		});

		this.mail_transporter = nodemailer.createTransport(smtp_config.transport);
	}

	static rejectResponse(error, code = 500) {
		return {
			error,
			code,
		};
	}

	static successResponse(payload, code = 200) {
		return {
			payload,
			code,
		};
	}

	static sendMail(to, subject, body) {
		this.mail_transporter.sendMail(
			{
				from: smtp_config.from,
				to: to,
				subject: subject,
				text: body,
			},
			function (err, info) {
				if (err) {
					console.log('Error while sending mail: ', err, info);
				}
			}
		);
	}

	static trimStrings(object) {
		for (const key in object) {
			if (typeof object[key] == 'string') {
				object[key] = object[key].trim();
			}
		}
	}
}

Service.init();
module.exports = Service;
