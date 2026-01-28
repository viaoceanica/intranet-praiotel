CREATE TABLE `slaConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`priority` enum('baixa','media','alta','urgente') NOT NULL,
	`responseTimeHours` int NOT NULL,
	`resolutionTimeHours` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `slaConfig_priority_unique` UNIQUE(`priority`)
);
