ALTER TABLE `crm_tasks` ADD `isRecurring` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `crm_tasks` ADD `recurrencePattern` enum('diaria','semanal','mensal');--> statement-breakpoint
ALTER TABLE `crm_tasks` ADD `recurrenceInterval` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `crm_tasks` ADD `parentTaskId` int;