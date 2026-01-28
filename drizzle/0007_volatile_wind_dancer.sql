CREATE TABLE `equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serialNumber` varchar(100) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`category` varchar(100),
	`location` varchar(100),
	`clientId` int,
	`isCritical` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_serialNumber_unique` UNIQUE(`serialNumber`)
);
--> statement-breakpoint
CREATE TABLE `prioritizationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`ruleType` enum('vip_client','critical_equipment','keyword','time_elapsed') NOT NULL,
	`condition` text NOT NULL,
	`targetPriority` enum('baixa','media','alta','urgente') NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prioritizationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priorityChangeLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`oldPriority` enum('baixa','media','alta','urgente') NOT NULL,
	`newPriority` enum('baixa','media','alta','urgente') NOT NULL,
	`changedBy` varchar(50) NOT NULL,
	`reason` text,
	`ruleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priorityChangeLog_id` PRIMARY KEY(`id`)
);
