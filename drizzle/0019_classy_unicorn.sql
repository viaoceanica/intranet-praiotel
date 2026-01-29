ALTER TABLE `clients` ADD `source` enum('lead','direto','outro') DEFAULT 'direto';--> statement-breakpoint
ALTER TABLE `clients` ADD `leadId` int;