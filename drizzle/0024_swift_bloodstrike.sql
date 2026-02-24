CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(100) NOT NULL,
	`setting_value` text,
	`setting_type` varchar(20) NOT NULL DEFAULT 'string',
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`label` varchar(200),
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by_id` int,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_setting_key_unique` UNIQUE(`setting_key`)
);
