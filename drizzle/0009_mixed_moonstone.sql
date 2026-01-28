ALTER TABLE `slaConfig` MODIFY COLUMN `priority` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `priority` varchar(50) NOT NULL DEFAULT 'media';--> statement-breakpoint
ALTER TABLE `slaConfig` ADD `displayName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `slaConfig` ADD `isCustom` int DEFAULT 0 NOT NULL;