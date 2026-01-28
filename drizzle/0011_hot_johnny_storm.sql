CREATE TABLE `custom_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`is_system` int NOT NULL DEFAULT 0,
	`permissions` text NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_roles_name_unique` UNIQUE(`name`)
);
