CREATE TABLE `clientEmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientEmails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`designation` varchar(255) NOT NULL,
	`address` text,
	`primaryEmail` varchar(320) NOT NULL,
	`nif` varchar(20) NOT NULL,
	`responsiblePerson` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_nif_unique` UNIQUE(`nif`)
);
