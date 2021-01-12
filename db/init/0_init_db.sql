ALTER DATABASE lunch CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS lunch.orders (
	`community` varchar(64) NOT NULL,
	`user` varchar(64) NOT NULL,
	`shop` varchar(64) NOT NULL,
	`meal` varchar(64) NOT NULL,
	`specialRequest` varchar(64),
	`day` DATE NOT NULL,
	`price` int(5),
	`state` varchar(16),
	PRIMARY KEY (`community`,`user`,`shop`,`meal`,`day`)
);

CREATE TABLE IF NOT EXISTS lunch.walks (
	`community` varchar(64) NOT NULL,
	`user` varchar(64) NOT NULL,
	`shop` varchar(64) NOT NULL,
	`day` DATE NOT NULL,
	PRIMARY KEY (`community`,`user`,`shop`,`day`)
);

CREATE TABLE IF NOT EXISTS lunch.meals (
	`community` varchar(64) NOT NULL,
	`shop` varchar(64) NOT NULL,
	`meal` varchar(64) NOT NULL,
	`price` int(5),
	PRIMARY KEY (`community`,`shop`, `meal`)
);

CREATE TABLE IF NOT EXISTS lunch.specialRequests (
	`community` varchar(64) NOT NULL,
	`shop` varchar(64) NOT NULL,
	`specialRequest` varchar(64) NOT NULL,
	PRIMARY KEY (`community`,`shop`, `specialRequest`)
);

CREATE TABLE IF NOT EXISTS lunch.shops (
	`community` varchar(64) NOT NULL,
	`shop` varchar(64) NOT NULL,
	`distance` int(5),
	`phone` varchar(50),
	`comment` varchar(5000),
	PRIMARY KEY (`community`,`shop`)
);

CREATE TABLE IF NOT EXISTS lunch.users (
	`community` varchar(64) NOT NULL,
	`user` varchar(64) NOT NULL,
	`paymentInstructions` varchar(5000),
	PRIMARY KEY (`community`,`user`)
);
