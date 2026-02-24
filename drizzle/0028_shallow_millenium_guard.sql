CREATE TABLE `user_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetUserId` int NOT NULL,
	`performedByUserId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_audit_log_id` PRIMARY KEY(`id`)
);
