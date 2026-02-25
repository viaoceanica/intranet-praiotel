CREATE TABLE `serviceTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `serviceTypes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `serviceTypeId` int;