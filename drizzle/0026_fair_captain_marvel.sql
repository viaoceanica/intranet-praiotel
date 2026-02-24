ALTER TABLE `tickets` ADD `commercialClientId` int;--> statement-breakpoint
ALTER TABLE `tickets` ADD `clientType` enum('assistencia','comercial') DEFAULT 'assistencia' NOT NULL;