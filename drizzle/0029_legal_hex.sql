CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` text NOT NULL,
	`status` varchar(20) NOT NULL,
	`error_message` text,
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`metadata` text,
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
