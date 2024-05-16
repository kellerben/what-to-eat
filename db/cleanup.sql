DELETE FROM orders WHERE (state = 'DISCARDED' OR state = 'PAID') AND day < (DATE_SUB(CURDATE(), INTERVAL 30 DAY));
DELETE FROM walks WHERE NOT EXISTS (SELECT orders.day FROM orders WHERE walks.day = orders.day AND walks.community = orders.community);
