ALTER DATABASE lunch CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS lunch.orders (
	`user` varchar(255) NOT NULL,
	`shop` varchar(255) NOT NULL,
	`meal` varchar(255) NOT NULL,
	`specialRequest` varchar(255),
	`day` DATE NOT NULL,
	`price` int(5),
	PRIMARY KEY (`user`,`shop`,`meal`,`day`)
);

CREATE TABLE IF NOT EXISTS lunch.walks (
	`user` varchar(255) NOT NULL,
	`shop` varchar(255) NOT NULL,
	`day` DATE NOT NULL,
	PRIMARY KEY (`user`,`shop`,`day`)
);

CREATE TABLE IF NOT EXISTS lunch.meals (
	`shop` varchar(255) NOT NULL,
	`meal` varchar(255) NOT NULL,
	`price` int(5),
	PRIMARY KEY (`shop`, `meal`)
);

CREATE TABLE IF NOT EXISTS lunch.specialRequests (
	`shop` varchar(255) NOT NULL,
	`specialRequest` varchar(255) NOT NULL,
	PRIMARY KEY (`shop`, `specialRequest`)
);
